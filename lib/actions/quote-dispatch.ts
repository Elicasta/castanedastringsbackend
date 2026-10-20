"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logCommunication } from "@/lib/communications";
import { brandedHtml } from "@/lib/email/templates";
import { quoteUrl } from "@/lib/urls";
import { revalidatePath } from "next/cache";

const emailDraftSchema = z.object({
  quoteId: z.string().uuid(),
  subject: z.string().trim().min(3).max(180),
  body: z.string().trim().min(5).max(12000),
  sendCopy: z.boolean().default(true),
});

export async function sendComposedQuoteAction(input: unknown) {
  const parsed = emailDraftSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your email." };
  const { quoteId, subject, body, sendCopy } = parsed.data;
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const base = process.env.NEXT_PUBLIC_APP_URL;
  if (!key || !from) return { error: "Resend is not configured. Your quote is still saved as a draft." };
  if (!base || !/^https:\/\//i.test(base)) return { error: "Configure NEXT_PUBLIC_APP_URL before sending client links." };

  const session = createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return { error: "Sign in to send a quote." };
  const { data: member } = await session.from("cs_admin_members").select("role").eq("auth_user_id", user.id).maybeSingle();
  if (!member || member.role === "viewer") return { error: "You do not have permission to send quotes." };
  const { data: quote } = await session.from("quotes").select("id,public_id,status,quote_number,client_id,inquiry_id,client:clients(email,full_name)").eq("id",quoteId).maybeSingle();
  if (!quote || quote.status !== "draft") return { error: "This quote is no longer an unsent draft." };

  const copyEmail = sendCopy ? (process.env.RESEND_COPY_EMAIL || from.match(/<([^>]+)>/)?.[1] || from).trim() : null;
  const recipient = (quote.client as { email?: string | null } | null)?.email?.trim() || "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) return { error: "Your client needs a valid email address." };
  const cc = copyEmail?.toLowerCase() === recipient.toLowerCase() ? null : copyEmail;

  // Always include the server-generated quote URL outside the editable text.
  const link = quoteUrl(quote.public_id);
  const fullBody = `${body}\n\nReview and respond to your quote:\n${link}`;
  if (fullBody.length > 14000) return { error: "Email body is too long." };

  // The DB transaction serializes concurrent send taps. Only one request
  // claims a draft. Retries use the same Resend Idempotency-Key and content.
  const { data: idempotencyKey, error: claimError } = await session.rpc("cs_claim_quote_dispatch", {
    p_quote_id: quoteId, p_subject: subject, p_message: body, p_copy_email: cc,
  });
  if (claimError || !idempotencyKey) return { error: claimError?.message || "Could not start sending." };
  const admin = createAdminClient();
  let providerId: string | null = null;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST", cache: "no-store",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "Idempotency-Key": String(idempotencyKey),
      },
      body: JSON.stringify({
        from, to: [recipient], ...(cc ? { cc: [cc] } : {}),
        subject, text: fullBody, html: brandedHtml(subject, fullBody),
      }),
    });
    const result = await response.json().catch(() => ({})) as { id?: string; message?: string; name?: string };
    if (!response.ok || !result.id) throw new Error(result.message || `Resend returned HTTP ${response.status}`);
    providerId = result.id;
    const {error: sentError} = await admin.from("cs_quote_dispatches").update({
      status: "sent", provider_email_id: providerId, sent_at: new Date().toISOString(), last_error: null,
    }).eq("quote_id",quoteId).eq("status","processing");
    if (sentError) throw new Error("Email was accepted by Resend, but delivery bookkeeping needs attention. Do not resend yet.");
    const {error: statusError} = await admin.from("quotes").update({status:"pending"}).eq("id",quoteId).eq("status","draft");
    if (statusError) throw new Error("Email was accepted by Resend, but quote status requires repair.");
    try {
      await logCommunication({
        client_id:quote.client_id,inquiry_id:quote.inquiry_id,quote_id:quoteId,
        channel:"email",direction:"outbound",subject,body:fullBody,
        resend_email_id:providerId,status:"sent",
      });
    } catch (logError) { console.error("Quote email delivered but communication logging failed", logError); }
    if (quote.inquiry_id) await admin.from("inquiries").update({status:"quoted"}).eq("id",quote.inquiry_id);
    revalidatePath("/quotes");
    revalidatePath(`/quotes/${quoteId}`);
    revalidatePath("/communications");
    return {success:true, providerId};
  } catch (err) {
    const message = err instanceof Error ? err.message : "Email service unavailable";
    // An accepted provider request must never be marked safely retryable.
    if (!providerId) {
      await admin.from("cs_quote_dispatches").update({status:"failed",last_error:message.slice(0,500)}).eq("quote_id",quoteId).eq("status","processing");
      try {await logCommunication({client_id:quote.client_id,inquiry_id:quote.inquiry_id,quote_id:quoteId,channel:"email",direction:"outbound",subject,body:fullBody,status:"failed"});}catch{}
    }
    return {error:providerId ? "Resend accepted the email. Do not send again until delivery status is reconciled." : message};
  }
}
