"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generatePublicId } from "@/lib/ids";
import { logActivity } from "@/lib/activity";
import { newQuoteSchema } from "@/lib/schemas";
import { sumLineItems, formatCents } from "@/lib/currency";
import { formatDate } from "@/lib/dates";
import { sendTemplateEmail } from "@/lib/email/resend";
import { canTransitionQuote, InvalidTransitionError } from "@/lib/status";
import { quoteUrl, portalUrl, adminQuoteUrl } from "@/lib/urls";
import { generateInvoiceFromQuoteAction } from "@/lib/actions/invoices";
import { generateContractFromQuoteAction } from "@/lib/actions/contracts";
import type { QuoteStatus } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createQuoteAction(input: unknown) {
  const parsed = newQuoteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the quote and try again." };
  }
  const data = parsed.data;
  const supabase = await createClient();

  const subtotal = sumLineItems(data.items);
  const total = Math.max(0, subtotal - data.discount_cents + data.tax_cents);

  const { data: numberRow } = await supabase.rpc("next_quote_number");
  const quote_number = (numberRow as string) ?? null;

  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({
      public_id: generatePublicId("q"),
      inquiry_id: data.inquiry_id || null,
      client_id: data.client_id,
      quote_number,
      title: data.title,
      event_type: data.event_type || null,
      event_date: data.event_date || null,
      location_name: data.location_name || null,
      subtotal_cents: subtotal,
      discount_cents: data.discount_cents,
      tax_cents: data.tax_cents,
      total_cents: total,
      valid_until: data.valid_until || null,
      notes_to_client: data.notes_to_client || null,
      internal_notes: data.internal_notes || null,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) return { error: "Couldn't create the quote. " + error.message };

  const items = data.items.map((item, i) => ({
    quote_id: quote.id,
    name: item.name,
    description: item.description || null,
    quantity: item.quantity,
    unit_price_cents: item.unit_price_cents,
    total_cents: Math.round(item.quantity * item.unit_price_cents),
    sort_order: i,
  }));
  const { error: itemsError } = await supabase.from("quote_items").insert(items);
  if (itemsError) return { error: "Saved the quote but couldn't save line items." };

  await logActivity({
    action: "created",
    entity_type: "quote",
    entity_id: quote.id,
    description: `Quote ${quote_number} created`,
  });

  if (data.send) {
    try {
      await sendQuoteAction(quote.id);
    } catch {
      // creation already succeeded — if the send fails, the admin can still
      // hit Send from the quote page. Don't block on it here.
    }
  }

  revalidatePath("/quotes");
  redirect(`/quotes/${quote.id}`);
}

export async function sendQuoteAction(quoteId: string) {
  const supabase = await createClient();
  const { data: quote, error } = await supabase
    .from("quotes")
    .select("*, client:clients(*)")
    .eq("id", quoteId)
    .single();
  if (error || !quote) throw new Error("Quote not found");

  if (!canTransitionQuote(quote.status, "pending")) {
    throw new InvalidTransitionError("quote", quote.status, "pending");
  }
  if (!quote.client?.email) {
    return { error: "This client doesn't have an email on file yet." };
  }

  const quoteLink = quoteUrl(quote.public_id);

  const result = await sendTemplateEmail({
    to: quote.client.email,
    template: "quote_sent",
    vars: {
      client_first_name: quote.client.first_name,
      event_type: quote.event_type ?? "your event",
      event_date: formatDate(quote.event_date),
      quote_link: quoteLink,
      portal_link: portalUrl(quote.client.portal_public_id) ?? "",
      business_name: "Castaneda Strings",
    },
    client_id: quote.client_id,
    inquiry_id: quote.inquiry_id,
    quote_id: quote.id,
  });

  await supabase.from("quotes").update({ status: "pending" }).eq("id", quoteId);
  if (quote.inquiry_id) {
    await supabase.from("inquiries").update({ status: "quoted" }).eq("id", quote.inquiry_id);
  }

  await logActivity({
    action: "sent",
    entity_type: "quote",
    entity_id: quoteId,
    description: `Quote ${quote.quote_number} sent to ${quote.client.email}`,
  });

  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath("/quotes");
  revalidatePath("/inquiries");

  if (!result.success) return { error: "Quote saved, but the email failed to send: " + result.error };
  return { success: true };
}

export async function cancelQuoteAction(quoteId: string) {
  const supabase = await createClient();
  const { data: quote } = await supabase.from("quotes").select("status").eq("id", quoteId).single();
  if (!quote) throw new Error("Quote not found");
  if (!canTransitionQuote(quote.status as QuoteStatus, "cancelled")) {
    throw new InvalidTransitionError("quote", quote.status, "cancelled");
  }
  await supabase
    .from("quotes")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", quoteId);

  await logActivity({ action: "cancelled", entity_type: "quote", entity_id: quoteId });
  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath("/quotes");
}

/**
 * Called from the PUBLIC quote page. Uses the service-role client because the
 * person accepting isn't authenticated — we manually validate public_id and
 * the current status before writing anything.
 */
export async function respondToQuotePublicAction(
  quotePublicId: string,
  decision: "accepted" | "declined"
) {
  const supabase = createAdminClient();

  const { data: quote, error } = await supabase
    .from("quotes")
    .select("*, client:clients(*)")
    .eq("public_id", quotePublicId)
    .single();

  if (error || !quote) return { error: "Quote not found." };
  if (!canTransitionQuote(quote.status, decision)) {
    return { error: `This quote is already ${quote.status} and can't be changed.` };
  }

  const update: Record<string, unknown> = { status: decision };
  if (decision === "accepted") update.accepted_at = new Date().toISOString();

  await supabase.from("quotes").update(update).eq("id", quote.id);

  if (quote.inquiry_id) {
    await supabase
      .from("inquiries")
      .update({ status: decision === "accepted" ? "booked" : "quoted" })
      .eq("id", quote.inquiry_id);
  }

  await logActivity({
    action: decision,
    entity_type: "quote",
    entity_id: quote.id,
    description: `Client ${decision} quote ${quote.quote_number}`,
  });

  let invoicePublicId: string | null = null;
  let contractPublicId: string | null = null;

  if (decision === "accepted") {
    const invoiceResult = await generateInvoiceFromQuoteAction(quote.id);
    if ("public_id" in invoiceResult) invoicePublicId = invoiceResult.public_id;

    const contractResult = await generateContractFromQuoteAction(quote.id);
    if (contractResult && "public_id" in contractResult) contractPublicId = contractResult.public_id;

    if (quote.client?.email) {
      await sendTemplateEmail({
        to: process.env.RESEND_FROM_EMAIL!,
        template: "quote_accepted_admin",
        vars: {
          client_name: quote.client.full_name,
          quote_number: quote.quote_number ?? "",
          total: formatCents(quote.total_cents, quote.currency),
          admin_link: adminQuoteUrl(quote.id),
        },
        quote_id: quote.id,
      });
    }
  }

  revalidatePath(`/q/${quotePublicId}`);
  return { success: true, invoicePublicId, contractPublicId };
}
