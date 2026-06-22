'use server';

import Stripe from 'stripe';
import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { createAdminClient } from '@/lib/supabase/server';
import { sendTransactionalEmail } from '@/lib/email/send';
import { checkAndPromoteToBookingReady } from '@/lib/server-actions/bookings';
import { getCurrentAdmin } from '@/lib/server-actions/current-admin';

// Same fix as lib/email/send.ts: lazy singleton, not created at module load.
let stripeClient: Stripe | null = null;
function getStripeClient(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });
  }
  return stripeClient;
}

export async function createStripeCheckoutForInvoice(token: string) {
  const supabase = createServiceRoleClient();

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('id, studio_id, title, balance_due, payment_status, stripe_checkout_session_id')
    .eq('public_token', token)
    .single();

  if (error || !invoice) {
    return { ok: false as const, error: 'Invoice not found.' };
  }

  if (invoice.payment_status === 'paid') {
    return { ok: false as const, error: 'This invoice is already paid.' };
  }

  if (Number(invoice.balance_due) <= 0) {
    return { ok: false as const, error: 'There is no balance due on this invoice.' };
  }

  const session = await getStripeClient().checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: invoice.title },
          unit_amount: Math.round(Number(invoice.balance_due) * 100),
        },
        quantity: 1,
      },
    ],
    metadata: { invoice_id: invoice.id, invoice_public_token: token },
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/invoice/${token}?paid=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/invoice/${token}?cancelled=1`,
  });

  await supabase
    .from('invoices')
    .update({
      stripe_checkout_session_id: session.id,
      payment_status: 'payment_pending',
    })
    .eq('id', invoice.id);

  return { ok: true as const, checkoutUrl: session.url };
}

/**
 * Admin-only. Called from /admin/invoices when the studio has manually
 * confirmed a Zelle transfer landed. Per spec: "manual confirmation creates
 * payment record and status event" and the event carries audit metadata —
 * which admin marked it, and the reference number they were given, so a
 * wrong "marked paid by mistake" click is traceable and reversible.
 */
export async function markInvoiceZellePaid(invoiceId: string, zelleReference: string) {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false as const, error: 'Not signed in.' };

  const supabase = createServiceRoleClient();

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('id, studio_id, client_id, total, amount_paid, payment_status, quote_id')
    .eq('id', invoiceId)
    .single();

  if (error || !invoice) {
    return { ok: false as const, error: 'Invoice not found.' };
  }

  if (invoice.payment_status === 'paid') {
    return { ok: false as const, error: 'Invoice is already marked paid.' };
  }

  const remaining = Number(invoice.total) - Number(invoice.amount_paid);

  const { error: paymentError } = await supabase.from('payments').insert({
    studio_id: invoice.studio_id,
    invoice_id: invoice.id,
    client_id: invoice.client_id,
    provider: 'zelle',
    provider_reference: zelleReference,
    amount: remaining,
    status: 'succeeded',
    paid_at: new Date().toISOString(),
    raw_payload: { marked_by_admin_user_id: admin.id, manual: true },
  });

  if (paymentError) {
    return { ok: false as const, error: 'Could not record payment.' };
  }

  await supabase
    .from('invoices')
    .update({
      amount_paid: invoice.total,
      balance_due: 0,
      payment_status: 'paid',
      payment_method: 'zelle',
      zelle_reference: zelleReference,
      paid_at: new Date().toISOString(),
    })
    .eq('id', invoice.id);

  await supabase.rpc('log_status_event', {
    p_studio_id: invoice.studio_id,
    p_entity_type: 'invoice',
    p_entity_id: invoice.id,
    p_event_type: 'invoice_paid_zelle_manual',
    p_title: 'Invoice marked paid via Zelle (manual)',
    p_metadata: { zelle_reference: zelleReference, marked_by_admin_user_id: admin.id },
    p_created_by: admin.id,
  });

  if (invoice.quote_id) {
    await checkAndPromoteToBookingReady(invoice.quote_id);
  }

  revalidatePath(`/admin/invoices/${invoiceId}`);
  return { ok: true as const };
}

/**
 * Client-facing "I sent by Zelle" button. This does NOT mark the invoice
 * paid — per spec, only an admin can do that, manually, after actually
 * checking the bank. This just records that the client says they sent it
 * and flags it for admin follow-up, so nothing falls through the cracks
 * waiting on a phone screenshot in a text thread somewhere.
 */
export async function submitZelleReferenceByToken(token: string, referenceNumber: string) {
  const supabase = createServiceRoleClient();

  const { data: invoice } = await supabase
    .from('invoices')
    .select('id, studio_id, payment_status')
    .eq('public_token', token)
    .single();

  if (!invoice) return { ok: false as const, error: 'Invoice not found.' };
  if (invoice.payment_status === 'paid') return { ok: false as const, error: 'This invoice is already paid.' };

  await supabase
    .from('invoices')
    .update({ zelle_reference: referenceNumber, payment_status: 'payment_pending' })
    .eq('id', invoice.id);

  await supabase.rpc('log_status_event', {
    p_studio_id: invoice.studio_id,
    p_entity_type: 'invoice',
    p_entity_id: invoice.id,
    p_event_type: 'zelle_reference_submitted',
    p_title: 'Client reported sending Zelle payment',
    p_description: 'Needs admin confirmation once the transfer is verified.',
    p_metadata: { zelle_reference: referenceNumber },
  });

  return { ok: true as const };
}

export async function sendInvoice(invoiceId: string) {
  const supabase = createAdminClient();

  const { data: invoice } = await supabase
    .from('invoices')
    .select('id, studio_id, client_id, public_token, payment_status, clients(first_name, email)')
    .eq('id', invoiceId)
    .single();

  if (!invoice) return { ok: false as const, error: 'Invoice not found.' };
  if (invoice.payment_status !== 'draft') {
    return { ok: false as const, error: 'Only a draft invoice can be sent.' };
  }

  await supabase.from('invoices').update({ payment_status: 'sent' }).eq('id', invoiceId);

  await supabase.rpc('log_status_event', {
    p_studio_id: invoice.studio_id,
    p_entity_type: 'invoice',
    p_entity_id: invoice.id,
    p_event_type: 'invoice_sent',
    p_title: 'Invoice sent to client',
  });

  const client = invoice.clients as any;
  await sendTransactionalEmail({
    studioId: invoice.studio_id,
    triggerKey: 'invoice_sent',
    toEmail: client.email,
    relatedIds: { client_id: invoice.client_id, invoice_id: invoice.id },
    data: {
      firstName: client.first_name,
      invoiceUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/invoice/${invoice.public_token}`,
    },
  });

  revalidatePath(`/admin/invoices/${invoiceId}`);
  return { ok: true as const };
}
