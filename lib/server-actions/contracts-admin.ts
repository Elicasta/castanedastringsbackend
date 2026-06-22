'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import { sendTransactionalEmail } from '@/lib/email/send';

export async function sendContract(contractId: string) {
  const supabase = createAdminClient();

  const { data: contract } = await supabase
    .from('contracts')
    .select('id, studio_id, client_id, public_token, status, clients(first_name, email)')
    .eq('id', contractId)
    .single();

  if (!contract) return { ok: false as const, error: 'Contract not found.' };
  if (contract.status !== 'contract_drafted') {
    return { ok: false as const, error: 'Only a drafted contract can be sent.' };
  }

  await supabase.from('contracts').update({ status: 'contract_sent' }).eq('id', contractId);

  await supabase.rpc('log_status_event', {
    p_studio_id: contract.studio_id,
    p_entity_type: 'contract',
    p_entity_id: contract.id,
    p_event_type: 'contract_sent',
    p_title: 'Contract sent to client',
  });

  const client = contract.clients as any;
  await sendTransactionalEmail({
    studioId: contract.studio_id,
    triggerKey: 'contract_sent',
    toEmail: client.email,
    relatedIds: { client_id: contract.client_id, contract_id: contract.id },
    data: {
      firstName: client.first_name,
      contractUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/contract/${contract.public_token}`,
    },
  });

  revalidatePath(`/admin/contracts/${contractId}`);
  return { ok: true as const };
}
