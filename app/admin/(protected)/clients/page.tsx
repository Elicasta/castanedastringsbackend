import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';

export default async function ClientsListPage() {
  const supabase = createAdminClient();
  const { data: clients } = await supabase
    .from('clients')
    .select('id, first_name, last_name, email, phone, tags, created_at')
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900 mb-6">Clients</h1>

      <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
        {!clients || clients.length === 0 ? (
          <p className="px-5 py-8 text-sm text-neutral-500 text-center">
            No clients yet. One gets created automatically the first time someone submits an inquiry.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-2.5 font-medium">Name</th>
                <th className="text-left px-5 py-2.5 font-medium">Contact</th>
                <th className="text-left px-5 py-2.5 font-medium">Tags</th>
                <th className="text-left px-5 py-2.5 font-medium">Client since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-neutral-50">
                  <td className="px-5 py-3">
                    <Link href={`/admin/clients/${client.id}`} className="font-medium text-neutral-900 hover:underline">
                      {client.first_name} {client.last_name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-neutral-700">
                    <p>{client.email}</p>
                    {client.phone && <p className="text-xs text-neutral-500">{client.phone}</p>}
                  </td>
                  <td className="px-5 py-3">
                    {(client.tags ?? []).length === 0 ? (
                      <span className="text-xs text-neutral-400">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {(client.tags ?? []).map((tag: string) => (
                          <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">{tag}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3 text-neutral-500">{new Date(client.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
