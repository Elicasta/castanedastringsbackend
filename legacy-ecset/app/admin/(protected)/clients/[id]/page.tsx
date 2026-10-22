import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { NotesEditor, TagsEditor } from '@/components/admin/ClientEditors';

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient();

  const { data: client } = await supabase.from('clients').select('*').eq('id', params.id).single();
  if (!client) notFound();

  const [{ data: inquiries }, { data: quotes }, { data: contracts }, { data: invoices }, { data: bookings }] = await Promise.all([
    supabase.from('inquiries').select('id, session_type, status, created_at').eq('client_id', client.id).order('created_at', { ascending: false }),
    supabase.from('quotes').select('id, title, status, total, created_at').eq('client_id', client.id).order('created_at', { ascending: false }),
    supabase.from('contracts').select('id, title, status, created_at').eq('client_id', client.id).order('created_at', { ascending: false }),
    supabase.from('invoices').select('id, invoice_number, payment_status, balance_due, created_at').eq('client_id', client.id).order('created_at', { ascending: false }),
    supabase.from('bookings').select('id, status, starts_at').eq('client_id', client.id).order('created_at', { ascending: false }),
  ]);

  return (
    <div className="max-w-3xl">
      <h1 className="text-lg font-semibold text-neutral-900 mb-1">{client.first_name} {client.last_name}</h1>
      <p className="text-sm text-neutral-500 mb-6">
        {client.email} {client.phone ? `· ${client.phone}` : ''} {client.instagram_handle ? `· @${client.instagram_handle}` : ''}
      </p>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">Tags</p>
          <TagsEditor clientId={client.id} initialTags={client.tags ?? []} />
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">Internal notes</p>
          <NotesEditor clientId={client.id} initialNotes={client.notes} />
        </div>
      </div>

      <div className="space-y-6">
        <HistorySection title="Inquiries" rows={inquiries} render={(i: any) => (
          <Link href={`/admin/inquiries/${i.id}`} className="hover:underline">
            {i.session_type ?? 'Inquiry'} · {i.status.replace('inquiry_', '')}
          </Link>
        )} />
        <HistorySection title="Quotes" rows={quotes} render={(q: any) => (
          <Link href={`/admin/quotes/${q.id}`} className="hover:underline">
            {q.title} · ${Number(q.total).toLocaleString()} · {q.status.replace('quote_', '')}
          </Link>
        )} />
        <HistorySection title="Contracts" rows={contracts} render={(c: any) => (
          <Link href={`/admin/contracts/${c.id}`} className="hover:underline">
            {c.title} · {c.status.replace('contract_', '')}
          </Link>
        )} />
        <HistorySection title="Invoices" rows={invoices} render={(inv: any) => (
          <Link href={`/admin/invoices/${inv.id}`} className="hover:underline">
            {inv.invoice_number} · ${Number(inv.balance_due).toLocaleString()} due · {inv.payment_status.replace('_', ' ')}
          </Link>
        )} />
        <HistorySection title="Bookings" rows={bookings} render={(b: any) => (
          <span>{b.starts_at ? new Date(b.starts_at).toLocaleString() : 'No date selected yet'} · {b.status.replace('_', ' ')}</span>
        )} />
      </div>
    </div>
  );
}

function HistorySection({ title, rows, render }: { title: string; rows: any[] | null; render: (row: any) => React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">{title}</p>
      {!rows || rows.length === 0 ? (
        <p className="text-sm text-neutral-400">None yet.</p>
      ) : (
        <ul className="rounded-lg border border-neutral-200 bg-white divide-y divide-neutral-100">
          {rows.map((row) => (
            <li key={row.id} className="px-4 py-2.5 text-sm text-neutral-800">{render(row)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
