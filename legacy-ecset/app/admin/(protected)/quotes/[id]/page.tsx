import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { sendQuote } from '@/lib/server-actions/quotes-admin';
import QuoteLineItemsEditor from '@/components/admin/QuoteLineItemsEditor';

export default async function QuoteDetailPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient();

  const { data: quote } = await supabase
    .from('quotes')
    .select('*, clients(first_name, last_name, email), quote_line_items(*)')
    .eq('id', params.id)
    .single();

  if (!quote) notFound();

  const client = quote.clients as any;
  const lineItems = (quote.quote_line_items as any[]).sort((a, b) => a.sort_order - b.sort_order);
  const locked = quote.status !== 'quote_drafted';

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">{quote.title}</h1>
          <p className="text-sm text-neutral-500">{client.first_name} {client.last_name} · {client.email}</p>
        </div>
        {quote.status === 'quote_drafted' ? (
          <form action={sendQuote.bind(null, quote.id)}>
            <button type="submit" className="text-sm rounded-md bg-neutral-900 text-white px-4 py-2">
              Send quote
            </button>
          </form>
        ) : (
          <span className="text-xs px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-700">
            {quote.status.replace('quote_', '')}
          </span>
        )}
      </div>

      {quote.story_intro && (
        <p className="text-sm text-neutral-600 italic mb-6 border-l-2 border-neutral-200 pl-4">{quote.story_intro}</p>
      )}

      <div className="rounded-lg border border-neutral-200 bg-white p-6 mb-4">
        <QuoteLineItemsEditor lineItems={lineItems} locked={locked} />
        <div className="flex justify-end mt-4 pt-4 border-t border-neutral-100">
          <div className="text-right">
            <p className="text-xs text-neutral-500">Total</p>
            <p className="text-xl font-semibold text-neutral-900">${Number(quote.total).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {quote.status !== 'quote_drafted' && (
        <p className="text-xs text-neutral-400">
          Public link: {process.env.NEXT_PUBLIC_SITE_URL}/quote/{quote.public_token}
        </p>
      )}
    </div>
  );
}
