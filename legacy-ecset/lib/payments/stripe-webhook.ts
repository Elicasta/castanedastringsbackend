import 'server-only';
import Stripe from 'stripe';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { checkAndPromoteToBookingReady } from '@/lib/server-actions/bookings';

/**
 * Call this from app/api/webhooks/stripe/route.ts after verifying the
 * signature with stripe.webhooks.constructEvent(). Nothing in this file
 * trusts anything from the request body except what Stripe's SDK already
 * verified the signature on.
 *
 * Idempotency: Stripe retries webhooks on anything other than a 2xx
 * response, and can deliver the same event more than once even on success.
 * The actual guarantee here is the unique index on
 * payments(invoice_id, provider, provider_reference) from migration 0006 —
 * if this handler runs twice for the same payment_intent, the second insert
 * throws a unique violation, we catch it, and return success without
 * double-crediting the invoice or sending a second "payment received" email.
 */
export async function handleStripeWebhookEvent(event: Stripe.Event) {
  if (event.type !== 'checkout.session.completed') {
    return { handled: false as const };
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const invoiceId = session.metadata?.invoice_id;
  if (!invoiceId) {
    return { handled: false as const };
  }

  const supabase = createServiceRoleClient();

  const { data: invoice } = await supabase
    .from('invoices')
    .select('id, studio_id, client_id, total, payment_status, quote_id')
    .eq('id', invoiceId)
    .single();

  if (!invoice) {
    return { handled: false as const };
  }

  const paymentIntentId =
    typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;

  const { error: insertError } = await supabase.from('payments').insert({
    studio_id: invoice.studio_id,
    invoice_id: invoice.id,
    client_id: invoice.client_id,
    provider: 'stripe',
    provider_reference: paymentIntentId ?? session.id,
    amount: (session.amount_total ?? 0) / 100,
    status: 'succeeded',
    paid_at: new Date().toISOString(),
    raw_payload: { stripe_event_id: event.id, checkout_session_id: session.id },
  });

  if (insertError) {
    // 23505 = unique_violation. This is the idempotency path: we've already
    // processed this exact payment, so do nothing and report success.
    if ((insertError as { code?: string }).code === '23505') {
      return { handled: true as const, duplicate: true as const };
    }
    throw insertError;
  }

  if (invoice.payment_status === 'paid') {
    // Already paid by some other path (e.g. admin marked Zelle at the same
    // moment). Don't re-trigger booking-ready logic twice, but don't error.
    return { handled: true as const, duplicate: true as const };
  }

  await supabase
    .from('invoices')
    .update({
      amount_paid: invoice.total,
      balance_due: 0,
      payment_status: 'paid',
      payment_method: 'stripe',
      stripe_payment_intent_id: paymentIntentId ?? null,
      paid_at: new Date().toISOString(),
    })
    .eq('id', invoice.id);

  await supabase.rpc('log_status_event', {
    p_studio_id: invoice.studio_id,
    p_entity_type: 'invoice',
    p_entity_id: invoice.id,
    p_event_type: 'invoice_paid_stripe',
    p_title: 'Invoice paid via Stripe',
    p_metadata: { payment_intent_id: paymentIntentId, stripe_event_id: event.id },
  });

  if (invoice.quote_id) {
    await checkAndPromoteToBookingReady(invoice.quote_id);
  }

  return { handled: true as const, duplicate: false as const };
}
