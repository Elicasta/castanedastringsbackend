'use server';

import { redirect } from 'next/navigation';
import { nanoid } from 'nanoid';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import { sendTransactionalEmail } from '@/lib/email/send';
import { suggestQuoteApproach } from '@/lib/server-actions/quote-advisor';

/**
 * Creates a draft quote for this inquiry, seeded from whichever quote
 * template the rules-based advisor (lib/server-actions/quote-advisor.ts)
 * points to. The admin still reviews/edits everything before sending —
 * this just removes the "build from a blank quote" step.
 */
export async function createQuoteFromInquiry(inquiryId: string) {
  const supabase = createAdminClient();

  const { data: inquiry } = await supabase
    .from('inquiries')
    .select('id, studio_id, client_id, inquiry_type, location_preference, vision_text')
    .eq('id', inquiryId)
    .single();

  if (!inquiry) return { ok: false as const, error: 'Inquiry not found.' };

  const advice = suggestQuoteApproach({
    inquiryType: inquiry.inquiry_type,
    locationPreference: inquiry.location_preference,
    visionText: inquiry.vision_text,
  });

  const { data: template } = await supabase
    .from('quote_templates')
    .select('id, title, story_intro, default_items')
    .eq('studio_id', inquiry.studio_id)
    .eq('name', advice.suggestedQuoteTemplateName)
    .eq('active', true)
    .maybeSingle();

  const defaultItems: Array<{ name: string; description?: string; quantity: number; unit_price: number }> =
    (template?.default_items as any) ?? [];
  const subtotal = defaultItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  const { data: quote, error } = await supabase
    .from('quotes')
    .insert({
      studio_id: inquiry.studio_id,
      client_id: inquiry.client_id,
      inquiry_id: inquiry.id,
      quote_template_id: template?.id ?? null,
      title: template?.title ?? 'Session Quote',
      story_intro: template?.story_intro ?? null,
      subtotal,
      total: subtotal,
      status: 'quote_drafted',
      public_token: `qt_${nanoid(24)}`,
    })
    .select('id')
    .single();

  if (error || !quote) return { ok: false as const, error: 'Could not create quote.' };

  if (defaultItems.length > 0) {
    await supabase.from('quote_line_items').insert(
      defaultItems.map((item, i) => ({
        quote_id: quote.id,
        name: item.name,
        description: item.description ?? null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price,
        sort_order: i,
      }))
    );
  }

  await supabase.from('inquiries').update({ status: 'inquiry_reviewed' }).eq('id', inquiryId);

  await supabase.rpc('log_status_event', {
    p_studio_id: inquiry.studio_id,
    p_entity_type: 'quote',
    p_entity_id: quote.id,
    p_event_type: 'quote_drafted',
    p_title: `Quote drafted from ${advice.suggestedQuoteTemplateName}`,
  });

  redirect(`/admin/quotes/${quote.id}`);
}

export async function updateQuoteLineItem(lineItemId: string, updates: { quantity?: number; unit_price?: number; name?: string }) {
  const supabase = createAdminClient();

  const { data: current } = await supabase
    .from('quote_line_items')
    .select('id, quote_id, quantity, unit_price')
    .eq('id', lineItemId)
    .single();
  if (!current) return { ok: false as const, error: 'Line item not found.' };

  const quantity = updates.quantity ?? current.quantity;
  const unitPrice = updates.unit_price ?? current.unit_price;

  await supabase
    .from('quote_line_items')
    .update({ ...updates, total: quantity * unitPrice })
    .eq('id', lineItemId);

  await recalculateQuoteTotal(current.quote_id);
  revalidatePath(`/admin/quotes/${current.quote_id}`);
  return { ok: true as const };
}

async function recalculateQuoteTotal(quoteId: string) {
  const supabase = createAdminClient();
  const { data: items } = await supabase.from('quote_line_items').select('total').eq('quote_id', quoteId);
  const subtotal = (items ?? []).reduce((sum, item) => sum + Number(item.total), 0);

  const { data: quote } = await supabase.from('quotes').select('discount_amount, tax_amount').eq('id', quoteId).single();
  const total = subtotal - Number(quote?.discount_amount ?? 0) + Number(quote?.tax_amount ?? 0);

  await supabase.from('quotes').update({ subtotal, total }).eq('id', quoteId);
}

export async function sendQuote(quoteId: string) {
  const supabase = createAdminClient();

  const { data: quote } = await supabase
    .from('quotes')
    .select('id, studio_id, client_id, public_token, status, clients(first_name, email)')
    .eq('id', quoteId)
    .single();

  if (!quote) return { ok: false as const, error: 'Quote not found.' };
  if (quote.status !== 'quote_drafted') return { ok: false as const, error: 'Only a drafted quote can be sent.' };

  await supabase.from('quotes').update({ status: 'quote_sent' }).eq('id', quoteId);

  await supabase.rpc('log_status_event', {
    p_studio_id: quote.studio_id,
    p_entity_type: 'quote',
    p_entity_id: quote.id,
    p_event_type: 'quote_sent',
    p_title: 'Quote sent to client',
  });

  const client = quote.clients as any;
  await sendTransactionalEmail({
    studioId: quote.studio_id,
    triggerKey: 'quote_sent',
    toEmail: client.email,
    relatedIds: { client_id: quote.client_id, quote_id: quote.id },
    data: {
      firstName: client.first_name,
      quoteUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/quote/${quote.public_token}`,
    },
  });

  revalidatePath(`/admin/quotes/${quoteId}`);
  return { ok: true as const };
}
