import { createAdminClient } from "./supabase/admin";
import type { CommChannel, CommDirection, CommStatus } from "./types";

export async function logCommunication(params: {
  client_id?: string | null;
  inquiry_id?: string | null;
  quote_id?: string | null;
  invoice_id?: string | null;
  contract_id?: string | null;
  channel: CommChannel;
  direction?: CommDirection;
  subject?: string | null;
  body?: string | null;
  resend_email_id?: string | null;
  status?: CommStatus;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("communications")
    .insert({
      client_id: params.client_id ?? null,
      inquiry_id: params.inquiry_id ?? null,
      quote_id: params.quote_id ?? null,
      invoice_id: params.invoice_id ?? null,
      contract_id: params.contract_id ?? null,
      channel: params.channel,
      direction: params.direction ?? "outbound",
      subject: params.subject ?? null,
      body: params.body ?? null,
      resend_email_id: params.resend_email_id ?? null,
      status: params.status ?? "logged",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
