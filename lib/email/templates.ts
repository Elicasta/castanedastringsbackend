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
    subject: "Your quote from {{business_name}}",
    body: `Hi {{client_first_name}},

Here's your quote for {{event_type}} on {{event_date}}.

View it and accept here: {{quote_link}}

Let me know if you'd like any changes.

{{business_name}}`,
  },
  quote_accepted_admin: {
    subject: "Quote accepted: {{quote_number}}",
    body: `{{client_name}} accepted quote {{quote_number}} ({{total}}).

View it: {{admin_link}}`,
  },
  invoice_sent: {
    subject: "Invoice {{invoice_number}} from {{business_name}}",
    body: `Hi {{client_first_name}},

Here's your invoice for {{event_type}} on {{event_date}}.

Total due: {{total}}
Due date: {{due_date}}

Pay here: {{invoice_link}}

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
    subject: "Payment received — thank you",
    body: `Hi {{client_first_name}},

Got your payment of {{amount}} for invoice {{invoice_number}}. You're all set.

Looking forward to {{event_date}}.

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
