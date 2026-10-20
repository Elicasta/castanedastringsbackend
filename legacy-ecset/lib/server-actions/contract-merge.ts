import 'server-only';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

/**
 * Resolves {{merge_fields}} in a contract's body against real data. Called
 * both when an admin previews a contract and when it's actually sent, so
 * the client never sees a literal "{{client_name}}" on the page.
 *
 * session_date is the one field that's genuinely unknown at this point in
 * the pipeline — contracts get signed before a booking exists (see the
 * state machine: quote accepted -> contract signed -> invoice paid ->
 * THEN booking ready -> THEN a date gets picked). Rather than leave a
 * broken placeholder or guess, it says so plainly.
 */
export async function resolveContractBody(contractId: string): Promise<string> {
  const supabase = createServiceRoleClient();

  const { data: contract } = await supabase
    .from('contracts')
    .select('body, studio_id, client_id, quote_id, inquiry_id')
    .eq('id', contractId)
    .single();

  if (!contract) return '';

  const [{ data: studio }, { data: client }, quoteResult, inquiryResult] = await Promise.all([
    supabase.from('studios').select('name').eq('id', contract.studio_id).single(),
    supabase.from('clients').select('first_name, last_name').eq('id', contract.client_id).single(),
    contract.quote_id
      ? supabase.from('quotes').select('title').eq('id', contract.quote_id).single()
      : Promise.resolve({ data: null }),
    contract.inquiry_id
      ? supabase.from('inquiries').select('session_type, inquiry_type').eq('id', contract.inquiry_id).single()
      : Promise.resolve({ data: null }),
  ]);

  const sessionType =
    (quoteResult.data as any)?.title ??
    (inquiryResult.data as any)?.session_type ??
    (inquiryResult.data as any)?.inquiry_type ??
    'your session';

  const values: Record<string, string> = {
    studio_name: studio?.name ?? 'EC Creative Studios',
    client_name: client ? `${client.first_name} ${client.last_name}` : 'Client',
    session_type: sessionType,
    session_date: 'to be scheduled once your contract is signed and invoice is paid',
  };

  return contract.body.replace(/\{\{(\w+)\}\}/g, (_match: string, key: string) => values[key] ?? `{{${key}}}`);
}
