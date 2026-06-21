import { Resend } from "resend";
import { EMAIL_TEMPLATES, renderTemplate, brandedHtml, type EmailTemplateKey } from "./templates";
import { logCommunication } from "../communications";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendTemplateEmailParams {
  to: string;
  template: EmailTemplateKey;
  vars: Record<string, string>;
  client_id?: string | null;
  inquiry_id?: string | null;
  quote_id?: string | null;
  invoice_id?: string | null;
  contract_id?: string | null;
}

/**
 * Sends a templated email through Resend and ALWAYS writes a communications
 * record — sent on success, failed on error. Never throws to the caller
 * without first logging the attempt.
 */
export async function sendTemplateEmail(params: SendTemplateEmailParams) {
  const tmpl = EMAIL_TEMPLATES[params.template];
  const subject = renderTemplate(tmpl.subject, params.vars);
  const body = renderTemplate(tmpl.body, params.vars);

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: params.to,
      subject,
      text: body,
      html: brandedHtml(subject, body),
    });

    if (error) throw new Error(error.message);

    await logCommunication({
      client_id: params.client_id,
      inquiry_id: params.inquiry_id,
      quote_id: params.quote_id,
      invoice_id: params.invoice_id,
      contract_id: params.contract_id,
      channel: "email",
      direction: "outbound",
      subject,
      body,
      resend_email_id: data?.id ?? null,
      status: "sent",
    });

    return { success: true as const, id: data?.id };
  } catch (err) {
    await logCommunication({
      client_id: params.client_id,
      inquiry_id: params.inquiry_id,
      quote_id: params.quote_id,
      invoice_id: params.invoice_id,
      contract_id: params.contract_id,
      channel: "email",
      direction: "outbound",
      subject,
      body,
      status: "failed",
    });

    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Email failed to send",
    };
  }
}
