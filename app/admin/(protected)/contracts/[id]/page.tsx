import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { sendContract } from '@/lib/server-actions/contracts-admin';
import { resolveContractBody } from '@/lib/server-actions/contract-merge';

export default async function ContractDetailPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient();

  const { data: contract } = await supabase
    .from('contracts')
    .select('*, clients(first_name, last_name, email)')
    .eq('id', params.id)
    .single();

  if (!contract) notFound();

  const client = contract.clients as any;
  const resolvedBody = await resolveContractBody(contract.id);

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">{contract.title}</h1>
          <p className="text-sm text-neutral-500">{client.first_name} {client.last_name} · {client.email}</p>
        </div>
        {contract.status === 'contract_drafted' ? (
          <form action={sendContract.bind(null, contract.id)}>
            <button type="submit" className="text-sm rounded-md bg-neutral-900 text-white px-4 py-2">
              Send contract
            </button>
          </form>
        ) : (
          <span className="text-xs px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-700">
            {contract.status.replace('contract_', '')}
          </span>
        )}
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-6 mb-4">
        <p className="text-sm text-neutral-800 whitespace-pre-wrap leading-relaxed">{resolvedBody}</p>
      </div>

      {contract.status === 'contract_signed' && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-5 text-sm text-green-900">
          <p className="font-medium mb-1">Signed</p>
          <p>{contract.signed_name} · {contract.signed_email}</p>
          <p className="text-green-700 text-xs mt-1">
            {new Date(contract.signed_at).toLocaleString()} · IP {contract.ip_address}
          </p>
        </div>
      )}

      {contract.status !== 'contract_drafted' && (
        <p className="text-xs text-neutral-400 mt-4">
          Public link: {process.env.NEXT_PUBLIC_SITE_URL}/contract/{contract.public_token}
        </p>
      )}
    </div>
  );
}
