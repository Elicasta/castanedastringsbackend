import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';

const STATUS_STYLES: Record<string, string> = {
  contract_drafted: 'bg-neutral-100 text-neutral-700',
  contract_sent: 'bg-blue-50 text-blue-700',
  contract_viewed: 'bg-blue-50 text-blue-700',
  contract_signed: 'bg-green-50 text-green-700',
};

export default async function ContractsListPage() {
  const supabase = createAdminClient();
  const { data: contracts } = await supabase
    .from('contracts')
    .select('id, title, status, created_at, signed_at, clients(first_name, last_name)')
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900 mb-6">Contracts</h1>

      <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
        {!contracts || contracts.length === 0 ? (
          <p className="px-5 py-8 text-sm text-neutral-500 text-center">
            No contracts yet. One drafts automatically when a client accepts a quote.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-2.5 font-medium">Client</th>
                <th className="text-left px-5 py-2.5 font-medium">Title</th>
                <th className="text-left px-5 py-2.5 font-medium">Status</th>
                <th className="text-left px-5 py-2.5 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {contracts.map((contract: any) => (
                <tr key={contract.id} className="hover:bg-neutral-50">
                  <td className="px-5 py-3">
                    <Link href={`/admin/contracts/${contract.id}`} className="font-medium text-neutral-900 hover:underline">
                      {contract.clients?.first_name} {contract.clients?.last_name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-neutral-700">{contract.title}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES[contract.status] ?? 'bg-neutral-100 text-neutral-700'}`}>
                      {contract.status.replace('contract_', '')}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-neutral-500">{new Date(contract.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
