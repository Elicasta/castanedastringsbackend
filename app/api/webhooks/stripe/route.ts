import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { handleStripeWebhookEvent } from '@/lib/payments/stripe-webhook';

// Lazy, same reasoning as lib/email/send.ts and lib/server-actions/invoices.ts —
// don't instantiate at module load, only when a webhook actually arrives.
let stripeClient: Stripe | null = null;
function getStripeClient(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });
  }
  return stripeClient;
}

/**
 * Point your Stripe webhook at {NEXT_PUBLIC_SITE_URL}/api/webhooks/stripe.
 * Subscribe it to at least "checkout.session.completed" — that's the only
 * event type lib/payments/stripe-webhook.ts currently handles.
 *
 * Signature verification happens here, not in the handler, on purpose:
 * this route is the only place that ever sees the raw request body, which
 * is required to verify the signature at all.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header.' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripeClient().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  try {
    await handleStripeWebhookEvent(event);
  } catch (err) {
    // Returning a 500 here makes Stripe retry the delivery, which is the
    // right behavior for a transient failure (e.g. a momentary DB blip).
    // The idempotency guarantee in handleStripeWebhookEvent means a retry
    // is safe even if part of the first attempt already landed.
    console.error('Stripe webhook handler error:', err);
    return NextResponse.json({ error: 'Webhook handler error.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
