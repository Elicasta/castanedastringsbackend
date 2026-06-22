import { notFound } from 'next/navigation';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import QuoteActions from '@/components/public/QuoteActions';

export default async function PublicQuotePage({ params }: { params: { token: string } }) {
  const supabase = createServiceRoleClient();

  const { data: quote } = await supabase
    .from('quotes')
    .select('*, clients(first_name), quote_line_items(*)')
    .eq('public_token', params.token)
    .single();

  if (!quote) notFound();

  const client = quote.clients as any;
  const lineItems = (quote.quote_line_items as any[]).sort((a, b) => a.sort_order - b.sort_order);
  const isDecided = quote.status === 'quote_accepted' || quote.status === 'quote_declined';
  const isExpired = quote.status === 'quote_expired' || (quote.expires_at && new Date(quote.expires_at) < new Date());

  return (
    <section className="min-h-screen px-6 py-20">
      <div className="max-w-xl mx-auto">
        <p className="label-text text-center mb-3">EC Creative Studios</p>
        <h1 className="display-text text-4xl md:text-5xl text-matte-dark text-center mb-6">{quote.title}</h1>

        {quote.story_intro && (
          <p className="accent-text text-lg text-stone text-center leading-relaxed mb-12 max-w-md mx-auto">
            {quote.story_intro}
          </p>
        )}

        <div className="vision-card p-8 rounded-sm mb-8">
          {lineItems.map((item) => (
            <div key={item.id} className="flex items-baseline justify-between py-3 border-b border-stone/10 last:border-0">
              <div>
                <p className="font-medium text-matte-dark" style={{ fontFamily: "'Jost',sans-serif" }}>{item.name}</p>
                {item.description && <p className="body-text text-xs">{item.description}</p>}
              </div>
              <p className="text-matte-dark" style={{ fontFamily: "'Jost',sans-serif" }}>
                ${Number(item.total).toLocaleString()}
              </p>
            </div>
          ))}
          <div className="flex items-baseline justify-between pt-5 mt-2">
            <p className="display-text text-xl text-matte-dark">Total</p>
            <p className="display-text text-2xl text-matte-dark">${Number(quote.total).toLocaleString()}</p>
          </div>
        </div>

        {quote.expires_at && !isDecided && (
          <p className="body-text text-center text-xs mb-8">
            This quote is held until {new Date(quote.expires_at).toLocaleDateString()}.
          </p>
        )}

        {isExpired && !isDecided ? (
          <p className="body-text text-center">
            This quote has expired. Reach out and we'll send an updated one.
          </p>
        ) : isDecided ? (
          quote.status === 'quote_accepted' ? (
            <p className="display-text text-2xl text-matte-dark text-center">Quote accepted — we'll be in touch.</p>
          ) : (
            <p className="display-text text-2xl text-matte-dark text-center">This quote was declined.</p>
          )
        ) : (
          <QuoteActions token={params.token} />
        )}
      </div>
    </section>
  );
}
