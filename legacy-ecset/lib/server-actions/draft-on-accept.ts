import 'server-only';
import { nanoid } from 'nanoid';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

/**
 * Runs once, right after a quote flips to quote_accepted. Idempotent: if a
 * contract or invoice already exists for this quote_id (e.g. retry, or the
 * admin already built one manually before the client accepted), it leaves
 * that one alone instead of creating a duplicate.
 */
export async function ensureContractAndInvoiceDrafted(quoteId: string) {
  const supabase = createServiceRoleClient();

  const { data: quote } = await supabase
    .from('quotes')
    .select('id, studio_id, client_id, inquiry_id, quote_template_id, title, total')
    .eq('id', quoteId)
    .single();

  if (!quote) return;

  const [{ data: existingContract }, { data: existingInvoice }] = await Promise.all([
    supabase.from('contracts').select('id').eq('quote_id', quoteId).maybeSingle(),
    supabase.from('invoices').select('id').eq('quote_id', quoteId).maybeSingle(),
  ]);

  if (!existingContract) {
    let template = null;
    if (quote.quote_template_id) {
      const { data: quoteTemplate } = await supabase
        .from('quote_templates')
        .select('session_type')
        .eq('id', quote.quote_template_id)
        .single();

      if (quoteTemplate?.session_type) {
        const { data: matched } = await supabase
          .from('contract_templates')
          .select('id, title, body')
          .eq('studio_id', quote.studio_id)
          .eq('session_type', quoteTemplate.session_type)
          .eq('active', true)
          .limit(1)
          .maybeSingle();
        template = matched;
      }
    }

    // Fall back to the studio's first active contract template rather than
    // leaving the client with nothing to sign.
    if (!template) {
      const { data: fallback } = await supabase
        .from('contract_templates')
        .select('id, title, body')
        .eq('studio_id', quote.studio_id)
        .eq('active', true)
        .limit(1)
        .maybeSingle();
      template = fallback;
    }

    if (template) {
      await supabase.from('contracts').insert({
        studio_id: quote.studio_id,
        client_id: quote.client_id,
        inquiry_id: quote.inquiry_id,
        quote_id: quote.id,
        contract_template_id: template.id,
        title: template.title,
        body: template.body,
        status: 'contract_drafted',
        public_token: `ct_${nanoid(24)}`,
      });
    }
  }

  if (!existingInvoice) {
    const { data: invoiceTemplate } = await supabase
      .from('invoice_templates')
      .select('id, title, intro_text')
      .eq('studio_id', quote.studio_id)
      .eq('active', true)
      .limit(1)
      .maybeSingle();

    const { data: contractRow } = await supabase
      .from('contracts')
      .select('id')
      .eq('quote_id', quoteId)
      .maybeSingle();

    await supabase.from('invoices').insert({
      studio_id: quote.studio_id,
      client_id: quote.client_id,
      inquiry_id: quote.inquiry_id,
      quote_id: quote.id,
      contract_id: contractRow?.id ?? null,
      title: invoiceTemplate?.title ?? quote.title,
      intro_text: invoiceTemplate?.intro_text ?? null,
      subtotal: quote.total,
      total: quote.total,
      balance_due: quote.total,
      payment_status: 'draft',
      public_token: `iv_${nanoid(24)}`,
    });
  }
}
