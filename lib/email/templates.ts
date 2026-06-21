// Plain, clean copy. No corporate tone. {{var}} merge fields get filled by send().

export const EMAIL_TEMPLATES = {
  inquiry_response: {
    subject: "Got your inquiry — here's what's next",
    body: `Hi {{client_first_name}},

Thanks for reaching out about {{event_type}} on {{event_date}}. I'll put together pricing and send it your way shortly.

If there's anything else useful to know about the event (timing, location, style of music), just reply here.

Talk soon,
{{business_name}}`,
  },
  quote_sent: {
    subject: "Your Quote is Ready",
    body: `Hi {{client_first_name}},

Your quote for {{event_type}} on {{event_date}} is ready.

View it and accept here: {{quote_link}}

You can also see everything for your event — quotes, invoices, and contracts — in one place here: {{portal_link}}

Let me know if you'd like any changes.

{{business_name}}`,
  },
  quote_accepted_admin: {
    subject: "Quote accepted: {{quote_number}}",
    body: `{{client_name}} accepted quote {{quote_number}} ({{total}}).

View it: {{admin_link}}`,
  },
  invoice_sent: {
    subject: "Your Invoice is Ready",
    body: `Hi {{client_first_name}},

Your invoice for {{event_type}} on {{event_date}} is ready.

Total due: {{total}}
Due date: {{due_date}}

Pay here: {{invoice_link}}

Everything for your event is also here: {{portal_link}}

{{business_name}}`,
  },
  payment_reminder: {
    subject: "Reminder: invoice {{invoice_number}} is due",
    body: `Hi {{client_first_name}},

Quick reminder that invoice {{invoice_number}} ({{total}}) is due {{due_date}}.

Pay here: {{invoice_link}}

{{business_name}}`,
  },
  payment_received: {
    subject: "Your Date is Confirmed!",
    body: `Hi {{client_first_name}},

Got your payment of {{amount}} for invoice {{invoice_number}}. You're all set, your date is officially confirmed.

Looking forward to {{event_date}}.

Everything for your event is here any time: {{portal_link}}

{{business_name}}`,
  },
  contract_sent: {
    subject: "Please sign: {{contract_title}}",
    body: `Hi {{client_first_name}},

Please review and sign the agreement for {{event_type}} on {{event_date}}.

Sign here: {{contract_link}}

{{business_name}}`,
  },
  contract_signed_admin: {
    subject: "Contract signed: {{contract_title}}",
    body: `{{client_name}} signed "{{contract_title}}" at {{signed_at}}.

View it: {{admin_link}}`,
  },
} as const;

export type EmailTemplateKey = keyof typeof EMAIL_TEMPLATES;

export function renderTemplate(body: string, vars: Record<string, string>): string {
  return body.replace(/{{(\w+)}}/g, (_, key) => vars[key] ?? "");
}

/**
 * Wraps plain-text email body in a simple branded HTML shell — teal accent,
 * cream/white card, matching the admin app's look. No image assets required,
 * so it works even before a logo file is wired up.
 */
export function brandedHtml(subject: string, plainBody: string): string {
  const paragraphs = plainBody
    .split("\n\n")
    .map((block) =>
      block
        .split("\n")
        .map((line) => escapeHtml(line))
        .join("<br/>")
    )
    .map((block) => `<p style="margin:0 0 16px 0;">${linkify(block)}</p>`)
    .join("");

  return `
<div style="background:#f8f7f4;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e7e9e8;">
    <tr>
      <td style="background:#0f6e5e;padding:24px 28px;">
        <p style="margin:0;color:#ffffff;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;">Castaneda Strings</p>
      </td>
    </tr>
    <tr>
      <td style="padding:28px;">
        <h1 style="margin:0 0 16px 0;font-size:20px;color:#14201d;">${escapeHtml(subject)}</h1>
        <div style="font-size:15px;line-height:1.6;color:#14201d;">${paragraphs}</div>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 28px 24px 28px;border-top:1px solid #e7e9e8;">
        <p style="margin:0;font-size:12px;color:#6b7670;">Castaneda Strings · Live violin for weddings &amp; events</p>
      </td>
    </tr>
  </table>
</div>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function linkify(text: string): string {
  return text.replace(
    /(https?:\/\/[^\s<]+)/g,
    (url) => `<a href="${url}" style="color:#0f6e5e;">${url}</a>`
  );
}
