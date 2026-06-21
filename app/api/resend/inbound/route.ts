import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity";
import { sendTemplateEmail } from "@/lib/email/resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

function extractEmailAddress(value: string): string {
  const match = value.match(/<([^>]+)>/);
  return (match ? match[1] : value).trim().toLowerCase();
}

/**
 * Resend Inbound webhook — fires when someone replies to (or emails) your
 * sending address. Requires RESEND_WEBHOOK_SECRET (separate from the API
 * key) and the inbound address/domain set up in the Resend dashboard.
 *
 * The webhook event only carries metadata; the actual body has to be
 * fetched separately via resend.emails.receiving.get().
 */
export async function POST(req: Request) {
  const payload = await req.text();
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!process.env.RESEND_WEBHOOK_SECRET || !svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  let event;
  try {
    event = resend.webhooks.verify({
      payload,
      headers: { id: svixId, timestamp: svixTimestamp, signature: svixSignature },
      webhookSecret: process.env.RESEND_WEBHOOK_SECRET,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Signature verification failed: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  if (event.type !== "email.received") {
    return NextResponse.json({ received: true });
  }

  const { data: fullEmail, error: fetchError } = await resend.emails.receiving.get(event.data.email_id);
  if (fetchError || !fullEmail) {
    console.error("Couldn't fetch inbound email body:", fetchError);
    return NextResponse.json({ received: true });
  }

  const fromEmail = extractEmailAddress(fullEmail.from);
  const supabase = createAdminClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("email", fromEmail)
    .maybeSingle();

  const { data: comm, error: insertError } = await supabase
    .from("communications")
    .insert({
      client_id: client?.id ?? null,
      channel: "email",
      direction: "inbound",
      subject: fullEmail.subject,
      body: fullEmail.text ?? fullEmail.html ?? "",
      status: "received",
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("Couldn't log inbound email:", insertError);
    return NextResponse.json({ received: true });
  }

  await logActivity({
    action: "received",
    entity_type: "communication",
    entity_id: comm.id,
    description: `Email reply from ${fullEmail.from}${client ? ` (${client.full_name})` : " (unknown sender)"}`,
  });

  // best-effort heads-up to the admin — never block the webhook response on this
  sendTemplateEmail({
    to: process.env.RESEND_FROM_EMAIL!,
    template: "inbound_reply_admin",
    vars: {
      from_name: client?.full_name ?? fullEmail.from,
      subject: fullEmail.subject ?? "(no subject)",
      snippet: (fullEmail.text ?? "").slice(0, 200),
    },
    client_id: client?.id ?? null,
  }).catch(() => {});

  return NextResponse.json({ received: true });
}
