'use server';

import { headers } from 'next/headers';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { checkAndPromoteToBookingReady } from '@/lib/server-actions/bookings';

type SignContractInput = {
  token: string;
  signedName: string;
  signedEmail: string;
  signatureData: string; // typed full name, treated as a clickwrap-style signature
};

type SignContractResult =
  | { ok: true; alreadySigned: boolean; contractId: string }
  | { ok: false; error: string };

export async function signContractByToken(input: SignContractInput): Promise<SignContractResult> {
  const supabase = createServiceRoleClient();

  const { data: contract, error: fetchError } = await supabase
    .from('contracts')
    .select('id, studio_id, quote_id, status')
    .eq('public_token', input.token)
    .single();

  if (fetchError || !contract) {
    return { ok: false, error: 'Contract not found.' };
  }

  // Edge case "client signs contract twice": already-signed contracts are
  // returned as a success with alreadySigned: true. We never overwrite an
  // existing signature, timestamp, or IP with a second submission.
  if (contract.status === 'contract_signed') {
    return { ok: true, alreadySigned: true, contractId: contract.id };
  }

  const headerList = headers();
  const ipAddress = headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const userAgent = headerList.get('user-agent') ?? 'unknown';

  const { error: updateError } = await supabase
    .from('contracts')
    .update({
      status: 'contract_signed',
      signed_name: input.signedName,
      signed_email: input.signedEmail,
      signature_data: input.signatureData,
      ip_address: ipAddress,
      user_agent: userAgent,
      signed_at: new Date().toISOString(),
    })
    .eq('id', contract.id)
    .eq('status', contract.status); // optimistic guard against a race with another signing request

  if (updateError) {
    return { ok: false, error: 'Could not record signature. Please try again.' };
  }

  await supabase.rpc('log_status_event', {
    p_studio_id: contract.studio_id,
    p_entity_type: 'contract',
    p_entity_id: contract.id,
    p_event_type: 'contract_signed',
    p_title: 'Client signed contract',
    p_metadata: { signed_name: input.signedName, ip_address: ipAddress },
  });

  if (contract.quote_id) {
    await checkAndPromoteToBookingReady(contract.quote_id);
  }

  return { ok: true, alreadySigned: false, contractId: contract.id };
}
