"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generatePublicId } from "@/lib/ids";
import { logActivity } from "@/lib/activity";
import { newContractTemplateSchema, signContractSchema, contractDetailsSchema } from "@/lib/schemas";
import { formatCents } from "@/lib/currency";
import { formatDate, formatDateTime } from "@/lib/dates";
import { sendTemplateEmail } from "@/lib/email/resend";
import { canTransitionContract, InvalidTransitionError } from "@/lib/status";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

function renderMergeFields(body: string, vars: Record<string, string>): string {
  return body.replace(/{{(\w+)}}/g, (_, key) => vars[key] ?? "");
}

export async function createContractTemplateAction(formData: FormData) {
  const parsed = newContractTemplateSchema.safeParse({
    name: formData.get("name"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    redirect(`/contracts/templates?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Check the template and try again.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("contract_templates").insert(parsed.data);
  if (error) redirect(`/contracts/templates?error=${encodeURIComponent("Couldn't save the template. " + error.message)}`);

  revalidatePath("/contracts/templates");
  redirect("/contracts/templates");
}

/**
 * Generates a contract from the first active template for a given quote.
 * Called automatically when a client accepts a quote. Uses service-role
 * because it may run from the public flow.
 */
export async function generateContractFromQuoteAction(quoteId: string) {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("contracts")
    .select("id, public_id")
    .eq("quote_id", quoteId)
    .maybeSingle();
  if (existing) return existing;

  const { data: template } = await supabase
    .from("contract_templates")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!template) return null; // no default template — that's fine, contracts are optional

  const { data: quote } = await supabase
    .from("quotes")
    .select("*, client:clients(*)")
    .eq("id", quoteId)
    .single();
  if (!quote) return null;

  const { data: invoice } = await supabase
    .from("invoices")
    .select("invoice_number")
    .eq("quote_id", quoteId)
    .maybeSingle();

  const mergeVars = {
    client_name: quote.client?.full_name ?? "",
    client_email: quote.client?.email ?? "",
    event_type: quote.event_type ?? "",
    event_date: formatDate(quote.event_date),
    event_time: "",
    location: quote.location_name ?? "",
    quote_total: formatCents(quote.total_cents, quote.currency),
    invoice_number: invoice?.invoice_number ?? "",
    business_name: "Castaneda Strings",
  };

  const { data: contract, error } = await supabase
    .from("contracts")
    .insert({
      public_id: generatePublicId("c"),
      contract_template_id: template.id,
      inquiry_id: quote.inquiry_id,
      quote_id: quote.id,
      client_id: quote.client_id,
      title: template.name,
      body: renderMergeFields(template.body, mergeVars),
      status: "draft",
    })
    .select("id, public_id")
    .single();

  if (error) return null;

  await logActivity({
    action: "created",
    entity_type: "contract",
    entity_id: contract.id,
    description: `Contract generated from template "${template.name}"`,
  });

  return contract;
}

export async function sendContractAction(contractId: string) {
  const supabase = await createClient();
  const { data: contract, error } = await supabase
    .from("contracts")
    .select("*, client:clients(*)")
    .eq("id", contractId)
    .single();
  if (error || !contract) throw new Error("Contract not found");

  if (!canTransitionContract(contract.status, "pending")) {
    throw new InvalidTransitionError("contract", contract.status, "pending");
  }
  if (!contract.client?.email) return { error: "This client doesn't have an email on file yet." };

  const result = await sendTemplateEmail({
    to: contract.client.email,
    template: "contract_sent",
    vars: {
      client_first_name: contract.client.first_name,
      event_type: "your event",
      event_date: formatDate(new Date().toISOString()),
      contract_link: `${process.env.NEXT_PUBLIC_APP_URL}/c/${contract.public_id}`,
      business_name: "Castaneda Strings",
    },
    client_id: contract.client_id,
    contract_id: contract.id,
  });

  await supabase
    .from("contracts")
    .update({ status: "pending", sent_at: new Date().toISOString() })
    .eq("id", contractId);

  await logActivity({
    action: "sent",
    entity_type: "contract",
    entity_id: contractId,
    description: `Contract sent to ${contract.client.email}`,
  });

  revalidatePath(`/contracts/${contractId}`);
  revalidatePath("/contracts");

  if (!result.success) return { error: "Saved, but the email failed to send: " + result.error };
  return { success: true };
}

/**
 * PUBLIC action — records a typed signature. No legal-compliance claim,
 * just a clean acknowledgement trail (name, email, IP, user agent, timestamp).
 */
export async function signContractPublicAction(input: unknown) {
  const parsed = signContractSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const userAgent = hdrs.get("user-agent") ?? "unknown";

  const supabase = createAdminClient();
  const { data: contract, error } = await supabase
    .from("contracts")
    .select("*, client:clients(*)")
    .eq("public_id", data.contract_public_id)
    .single();
  if (error || !contract) return { error: "Contract not found." };

  if (!canTransitionContract(contract.status, "signed")) {
    return { error: `This contract is already ${contract.status}.` };
  }

  await supabase
    .from("contracts")
    .update({
      status: "signed",
      signed_at: new Date().toISOString(),
      signer_name: data.signer_name,
      signer_email: data.signer_email,
      signature_text: data.signer_name,
      client_signature: data.signer_name,
      signer_ip: ip,
      signer_user_agent: userAgent,
    })
    .eq("id", contract.id);

  await logActivity({
    action: "signed",
    entity_type: "contract",
    entity_id: contract.id,
    description: `Signed by ${data.signer_name}`,
  });

  await sendTemplateEmail({
    to: process.env.RESEND_FROM_EMAIL!,
    template: "contract_signed_admin",
    vars: {
      client_name: contract.client?.full_name ?? data.signer_name,
      contract_title: contract.title,
      signed_at: formatDateTime(new Date().toISOString()),
      admin_link: `${process.env.ADMIN_APP_URL}/contracts/${contract.id}`,
    },
    contract_id: contract.id,
  });

  revalidatePath(`/c/${data.contract_public_id}`);
  return { success: true };
}

export async function updateContractDetailsAction(input: unknown) {
  const parsed = contractDetailsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { contract_id, ...rest } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("contracts").update(rest).eq("id", contract_id);
  if (error) return { error: "Couldn't save contract details." };

  revalidatePath(`/contracts/${contract_id}`);
  return { success: true };
}
