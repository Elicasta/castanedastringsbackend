import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity";
import { sendTemplateEmail } from "@/lib/email/resend";
import { formatCents } from "@/lib/currency";
import { formatDate } from "@/lib/dates";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  async function markPaid(invoiceId: string, paymentIntentId: string | null) {
    const { data: invoice } = await supabase
      .from("invoices")
      .select("*, client:clients(*)")
      .eq("id", invoiceId)
      .single();
    if (!invoice || invoice.status === "paid") return;

    await supabase
      .from("invoices")
      .update({
        status: "paid",
        amount_paid_cents: invoice.total_cents,
        balance_due_cents: 0,
        payment_method: "stripe",
        stripe_payment_intent_id: paymentIntentId,
        paid_at: new Date().toISOString(),
      })
      .eq("id", invoiceId);

    await logActivity({
      action: "paid",
      entity_type: "invoice",
      entity_id: invoiceId,
      description: `Paid via Stripe (${formatCents(invoice.total_cents, invoice.currency)})`,
    });

    if (invoice.client?.email) {
      await sendTemplateEmail({
        to: invoice.client.email,
        template: "payment_received",
        vars: {
          client_first_name: invoice.client.first_name,
          amount: formatCents(invoice.total_cents, invoice.currency),
          invoice_number: invoice.invoice_number ?? "",
          event_date: formatDate(invoice.due_date),
          business_name: "Castaneda Strings",
        },
        client_id: invoice.client_id,
        invoice_id: invoice.id,
      });
    }
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const invoiceId = session.metadata?.invoice_id;
    if (invoiceId) {
      await markPaid(invoiceId, (session.payment_intent as string) ?? null);
    }
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const { data: invoice } = await supabase
      .from("invoices")
      .select("id")
      .eq("stripe_payment_intent_id", intent.id)
      .maybeSingle();
    if (invoice) await markPaid(invoice.id, intent.id);
  }

  return NextResponse.json({ received: true });
}
