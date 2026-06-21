"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generatePublicId } from "@/lib/ids";
import { logActivity } from "@/lib/activity";
import { markZellePaidSchema } from "@/lib/schemas";
import { formatCents } from "@/lib/currency";
import { formatDate } from "@/lib/dates";
import { sendTemplateEmail } from "@/lib/email/resend";
import { canTransitionInvoice, InvalidTransitionError } from "@/lib/status";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { revalidatePath } from "next/cache";

/**
 * Generates an invoice from an accepted quote. Used both by the admin
 * ("New invoice" from a quote) and automatically when a client accepts
 * a quote on the public page — hence the service-role client so it works
 * in both contexts.
 */
export async function generateInvoiceFromQuoteAction(quoteId: string) {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("invoices")
    .select("id, public_id")
    .eq("quote_id", quoteId)
    .maybeSingle();
  if (existing) return existing;

  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select("*, quote_items(*)")
    .eq("id", quoteId)
    .single();
  if (quoteError || !quote) return { error: "Quote not found." };

  const { data: settings } = await supabase.from("settings").select("*").limit(1).single();
  const dueDays = settings?.default_invoice_due_days ?? 7;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + dueDays);

  const { data: numberRow } = await supabase.rpc("next_invoice_number");

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      public_id: generatePublicId("inv"),
      quote_id: quote.id,
      inquiry_id: quote.inquiry_id,
      client_id: quote.client_id,
      invoice_number: numberRow as string,
      subtotal_cents: quote.subtotal_cents,
      discount_cents: quote.discount_cents,
      tax_cents: quote.tax_cents,
      total_cents: quote.total_cents,
      balance_due_cents: quote.total_cents,
      due_date: dueDate.toISOString().slice(0, 10),
      status: "draft",
      notes_to_client: quote.notes_to_client,
    })
    .select("id, public_id")
    .single();

  if (error) return { error: "Couldn't generate the invoice. " + error.message };

  const items = (quote.quote_items ?? []).map(
    (item: { name: string; description: string | null; quantity: number; unit_price_cents: number; total_cents: number; sort_order: number }) => ({
      invoice_id: invoice.id,
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      unit_price_cents: item.unit_price_cents,
      total_cents: item.total_cents,
      sort_order: item.sort_order,
    })
  );
  if (items.length) await supabase.from("invoice_items").insert(items);

  await logActivity({
    action: "created",
    entity_type: "invoice",
    entity_id: invoice.id,
    description: `Invoice generated from quote ${quote.quote_number}`,
  });

  return invoice;
}

export async function sendInvoiceAction(invoiceId: string) {
  const supabase = await createClient();
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*, client:clients(*)")
    .eq("id", invoiceId)
    .single();
  if (error || !invoice) throw new Error("Invoice not found");

  if (!canTransitionInvoice(invoice.status, "sent")) {
    throw new InvalidTransitionError("invoice", invoice.status, "sent");
  }
  if (!invoice.client?.email) return { error: "This client doesn't have an email on file yet." };

  const invoiceLink = `${process.env.NEXT_PUBLIC_APP_URL}/i/${invoice.public_id}`;

  const result = await sendTemplateEmail({
    to: invoice.client.email,
    template: "invoice_sent",
    vars: {
      client_first_name: invoice.client.first_name,
      event_type: "your event",
      event_date: formatDate(invoice.due_date),
      total: formatCents(invoice.total_cents, invoice.currency),
      due_date: formatDate(invoice.due_date),
      invoice_link: invoiceLink,
      business_name: "Castaneda Strings",
    },
    client_id: invoice.client_id,
    invoice_id: invoice.id,
  });

  await supabase.from("invoices").update({ status: "payment_pending" }).eq("id", invoiceId);

  await logActivity({
    action: "sent",
    entity_type: "invoice",
    entity_id: invoiceId,
    description: `Invoice ${invoice.invoice_number} sent to ${invoice.client.email}`,
  });

  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");

  if (!result.success) return { error: "Invoice saved, but the email failed to send: " + result.error };
  return { success: true };
}

export async function markInvoicePaidZelleAction(input: unknown) {
  const parsed = markZellePaidSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  const supabase = await createClient();
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*, client:clients(*)")
    .eq("id", data.invoice_id)
    .single();
  if (error || !invoice) return { error: "Invoice not found." };

  if (!canTransitionInvoice(invoice.status, "paid")) {
    return { error: `Can't mark a ${invoice.status} invoice as paid.` };
  }

  const newAmountPaid = invoice.amount_paid_cents + data.amount_paid_cents;
  const balance = Math.max(0, invoice.total_cents - newAmountPaid);

  await supabase
    .from("invoices")
    .update({
      status: balance === 0 ? "paid" : invoice.status,
      amount_paid_cents: newAmountPaid,
      balance_due_cents: balance,
      payment_method: "zelle",
      zelle_reference: data.zelle_reference || null,
      paid_at: balance === 0 ? data.paid_at : null,
    })
    .eq("id", data.invoice_id);

  await logActivity({
    action: "paid",
    entity_type: "invoice",
    entity_id: data.invoice_id,
    description: `Marked ${formatCents(data.amount_paid_cents)} paid via Zelle`,
  });

  if (balance === 0 && invoice.client?.email) {
    await sendTemplateEmail({
      to: invoice.client.email,
      template: "payment_received",
      vars: {
        client_first_name: invoice.client.first_name,
        amount: formatCents(newAmountPaid, invoice.currency),
        invoice_number: invoice.invoice_number ?? "",
        event_date: formatDate(invoice.due_date),
        business_name: "Castaneda Strings",
      },
      client_id: invoice.client_id,
      invoice_id: invoice.id,
    });
  }

  revalidatePath(`/invoices/${data.invoice_id}`);
  revalidatePath("/invoices");
  return { success: true };
}

export async function sendPaymentReminderAction(invoiceId: string) {
  const supabase = await createClient();
  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, client:clients(*)")
    .eq("id", invoiceId)
    .single();
  if (!invoice?.client?.email) return { error: "No client email on file." };

  const result = await sendTemplateEmail({
    to: invoice.client.email,
    template: "payment_reminder",
    vars: {
      client_first_name: invoice.client.first_name,
      invoice_number: invoice.invoice_number ?? "",
      total: formatCents(invoice.balance_due_cents, invoice.currency),
      due_date: formatDate(invoice.due_date),
      invoice_link: `${process.env.NEXT_PUBLIC_APP_URL}/i/${invoice.public_id}`,
      business_name: "Castaneda Strings",
    },
    client_id: invoice.client_id,
    invoice_id: invoice.id,
  });
  revalidatePath(`/invoices/${invoiceId}`);
  return result;
}

/**
 * PUBLIC action — creates a Stripe Checkout session for the invoice balance.
 * Called from /i/[publicId]. Validates status before allowing payment.
 */
export async function createInvoiceCheckoutSessionPublicAction(invoicePublicId: string) {
  if (!isStripeConfigured()) return { error: "Card payments aren't set up yet. Use Zelle below." };

  const supabase = createAdminClient();
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("public_id", invoicePublicId)
    .single();
  if (error || !invoice) return { error: "Invoice not found." };
  if (!["sent", "payment_pending", "past_due"].includes(invoice.status)) {
    return { error: "This invoice can't be paid right now." };
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: invoice.currency,
          unit_amount: invoice.balance_due_cents,
          product_data: { name: `Invoice ${invoice.invoice_number}` },
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/i/${invoicePublicId}?paid=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/i/${invoicePublicId}`,
    metadata: { invoice_id: invoice.id, invoice_public_id: invoicePublicId },
  });

  await supabase
    .from("invoices")
    .update({ stripe_checkout_session_id: session.id, status: "payment_pending" })
    .eq("id", invoice.id);

  return { url: session.url };
}
