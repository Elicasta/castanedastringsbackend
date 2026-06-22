'use server';

import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { ensureContractAndInvoiceDrafted } from '@/lib/server-actions/draft-on-accept';

type AcceptQuoteResult =
  | { ok: true; alreadyAccepted: boolean; quoteId: string }
  | { ok: false; error: string };

/**
 * Called from the public /quote/[token] page action when the client clicks
 * "Accept Quote". Token-gated, not auth-gated — anyone with the link can
 * accept, which is the intended behavior for a client-facing quote link.
 *
 * Edge case "client accepts quote twice": if the quote is already
 * quote_accepted, this is a no-op that returns alreadyAccepted: true rather
 * than erroring or double-logging a status event.
 */
export async function acceptQuoteByToken(token: string): Promise<AcceptQuoteResult> {
  const supabase = createServiceRoleClient();

  const { data: quote, error: fetchError } = await supabase
    .from('quotes')
    .select('id, studio_id, status, expires_at')
    .eq('public_token', token)
    .single();

  if (fetchError || !quote) {
    return { ok: false, error: 'Quote not found.' };
  }

  if (quote.status === 'quote_accepted') {
    return { ok: true, alreadyAccepted: true, quoteId: quote.id };
  }

  if (quote.status === 'quote_declined' || quote.status === 'quote_expired') {
    return { ok: false, error: 'This quote is no longer active. Reach out to your studio for an updated quote.' };
  }

  if (quote.expires_at && new Date(quote.expires_at) < new Date()) {
    await supabase.from('quotes').update({ status: 'quote_expired' }).eq('id', quote.id);
    return { ok: false, error: 'This quote has expired. Reach out to your studio for an updated quote.' };
  }

  const { error: updateError } = await supabase
    .from('quotes')
    .update({ status: 'quote_accepted', accepted_at: new Date().toISOString() })
    .eq('id', quote.id);

  if (updateError) {
    return { ok: false, error: 'Could not record your acceptance. Please try again.' };
  }

  await supabase.rpc('log_status_event', {
    p_studio_id: quote.studio_id,
    p_entity_type: 'quote',
    p_entity_id: quote.id,
    p_event_type: 'quote_accepted',
    p_title: 'Client accepted quote',
  });

  // Spec: "Once quote is accepted, create or enable contract and invoice flow."
  // Chosen interpretation: auto-draft a contract + invoice from whatever
  // templates are attached to this quote's template, so the admin's next
  // action is "review and send" instead of "build from scratch."
  await ensureContractAndInvoiceDrafted(quote.id);

  return { ok: true, alreadyAccepted: false, quoteId: quote.id };
}

export async function declineQuoteByToken(token: string): Promise<AcceptQuoteResult> {
  const supabase = createServiceRoleClient();

  const { data: quote, error: fetchError } = await supabase
    .from('quotes')
    .select('id, studio_id, status')
    .eq('public_token', token)
    .single();

  if (fetchError || !quote) {
    return { ok: false, error: 'Quote not found.' };
  }

  if (quote.status === 'quote_declined') {
    return { ok: true, alreadyAccepted: false, quoteId: quote.id };
  }

  if (quote.status === 'quote_accepted') {
    return { ok: false, error: 'This quote was already accepted. Contact your studio if that was a mistake.' };
  }

  await supabase
    .from('quotes')
    .update({ status: 'quote_declined', declined_at: new Date().toISOString() })
    .eq('id', quote.id);

  await supabase.rpc('log_status_event', {
    p_studio_id: quote.studio_id,
    p_entity_type: 'quote',
    p_entity_id: quote.id,
    p_event_type: 'quote_declined',
    p_title: 'Client declined quote',
  });

  return { ok: true, alreadyAccepted: false, quoteId: quote.id };
}
