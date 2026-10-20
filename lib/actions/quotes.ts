"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generatePublicId } from "@/lib/ids";
import { logActivity } from "@/lib/activity";
import { newQuoteSchema } from "@/lib/schemas";
import { formatCents } from "@/lib/currency";
import { quoteSubtotal } from "@/lib/quote-builder";
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

  const subtotal = quoteSubtotal(data.items);
  const total = Math.max(0, subtotal - data.discount_cents + data.tax_cents);
  if (data.items.some(i => i.range_max_cents != null && i.range_max_cents < i.unit_price_cents)) return {error:"An item range maximum cannot be below its minimum."};
  if (data.cs_project_id) {
    const {data: project} = await supabase.from("cs_quote_projects").select("id").eq("id",data.cs_project_id).eq("client_id",data.client_id).maybeSingle();
    if (!project) return {error:"The project must belong to the selected client."};
  }

  const { data: numberRow } = await supabase.rpc("next_quote_number");
  const quote_number = (numberRow as string) ?? null;

  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({
      public_id: generatePublicId("q"),
      inquiry_id: data.inquiry_id || null,
      client_id: data.client_id,
      cs_project_id: data.cs_project_id || null,
      auto_create_invoice: data.auto_create_invoice,
      reminders_enabled: data.reminders_enabled,
      reminder_days_before: data.reminder_days_before,
      currency: data.currency,
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
    item_kind: item.item_kind,
    selected: item.item_kind === "standard" ? true : Boolean(item.selected),
    selection_group: item.item_kind === "client_selection" ? item.selection_group || "default" : null,
    range_max_cents: item.range_max_cents ?? null,
    taxable: item.taxable,
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

  const {data: lines, error: linesError} = await supabase.from("quote_items").select("id").eq("quote_id",quoteId).limit(1);
  if (linesError || !lines?.length) return {error:"Add at least one item before sending this quote."};
  if (quote.valid_until && quote.valid_until < new Date().toISOString().slice(0,10)) return {error:"Choose a future expiry date before sending."};
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

  if (!result.success) return { error: "Quote saved, but email failed: " + result.error };
  const {data: moved} = await supabase.from("quotes").update({ status: "pending" }).eq("id", quoteId).in("status",["draft","sent"]).select("id").maybeSingle();
  if (!moved) return {error:"Quote was already sent or changed while sending. Check its status."};
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
  decision: "accepted" | "declined",
  selectedItemIds: string[] = []
) {
  const supabase = createAdminClient();

  // DB-side row lock prevents two quick taps from accepting twice or changing totals.
  const {data: quoteId, error: acceptError} = decision === "accepted"
    ? await supabase.rpc("accept_cs_quote", {p_public_id:quotePublicId,p_selected_item_ids:selectedItemIds})
    : {data:null,error:null};
  if (acceptError) return {error:acceptError.message.includes("expired")?"This quote has expired. Request a new one.":"This quote cannot be accepted again."};

  const {data: quote, error} = await supabase.from("quotes").select("*,client:clients(*)").eq("public_id",quotePublicId).single();
  if (error || !quote) return {error:"Quote not found."};

  if (decision === "declined") {
    if (quote.status !== "pending" || (quote.valid_until && quote.valid_until < new Date().toISOString().slice(0,10))) return {error:"This quote cannot be declined now."};
    const {data:changed} = await supabase.from("quotes").update({status:"declined"}).eq("id",quote.id).eq("status","pending").select("id").maybeSingle();
    if (!changed) return {error:"Quote has already been answered."};
  } else if (!quoteId || quote.id !== quoteId) return {error:"The quote could not be accepted."};

  if (quote.inquiry_id) {
    await supabase.from("inquiries").update({status:"quoted"}).eq("id",quote.inquiry_id);
  }

  await logActivity({action:decision,entity_type:"quote",entity_id:quote.id,description:`Client ${decision} quote ${quote.quote_number}`});
  let invoicePublicId: string|null = null;
  let contractPublicId: string|null = null;
  if (decision === "accepted") {
    if (quote.auto_create_invoice) {
      const invoiceResult = await generateInvoiceFromQuoteAction(quote.id);
      if ("public_id" in invoiceResult) invoicePublicId = invoiceResult.public_id;
    }
    const contractResult = await generateContractFromQuoteAction(quote.id);
    if (contractResult && "public_id" in contractResult) contractPublicId = contractResult.public_id;
    if (quote.client?.email && process.env.RESEND_FROM_EMAIL) {
      await sendTemplateEmail({
        to:process.env.RESEND_FROM_EMAIL,template:"quote_accepted_admin",
        vars:{client_name:quote.client.full_name,quote_number:quote.quote_number??"",total:formatCents(quote.total_cents,quote.currency),admin_link:adminQuoteUrl(quote.id)},
        quote_id:quote.id
      });
    }
  }

  revalidatePath(`/q/${quotePublicId}`);
  return { success: true, invoicePublicId, contractPublicId };
}
