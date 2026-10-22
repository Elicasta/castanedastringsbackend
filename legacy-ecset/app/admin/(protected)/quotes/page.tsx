import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';

const STATUS_STYLES: Record<string, string> = {
  quote_drafted: 'bg-neutral-100 text-neutral-700',
  quote_sent: 'bg-blue-50 text-blue-700',
  quote_viewed: 'bg-blue-50 text-blue-700',
  quote_accepted: 'bg-green-50 text-green-700',
  quote_declined: 'bg-red-50 text-red-700',
  quote_expired: 'bg-neutral-100 text-neutral-500',
};

export default async function QuotesListPage() {
  const supabase = createAdminClient();
  const { data: quotes } = await supabase
    .from('quotes')
    .select('id, title, status, total, created_at, clients(first_name, last_name)')
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900 mb-6">Quotes</h1>

      <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
        {!quotes || quotes.length === 0 ? (
          <p className="px-5 py-8 text-sm text-neutral-500 text-center">
            No quotes yet. Create one from an inquiry's detail page.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-2.5 font-medium">Client</th>
                <th className="text-left px-5 py-2.5 font-medium">Title</th>
                <th className="text-left px-5 py-2.5 font-medium">Total</th>
                <th className="text-left px-5 py-2.5 font-medium">Status</th>
                <th className="text-left px-5 py-2.5 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {quotes.map((quote: any) => (
                <tr key={quote.id} className="hover:bg-neutral-50">
                  <td className="px-5 py-3">
                    <Link href={`/admin/quotes/${quote.id}`} className="font-medium text-neutral-900 hover:underline">
                      {quote.clients?.first_name} {quote.clients?.last_name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-neutral-700">{quote.title}</td>
                  <td className="px-5 py-3 text-neutral-700">${Number(quote.total).toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES[quote.status] ?? 'bg-neutral-100 text-neutral-700'}`}>
                      {quote.status.replace('quote_', '')}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-neutral-500">{new Date(quote.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
