import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { QuoteResponse } from "@/components/public/quote-response";
import { formatCents } from "@/lib/currency";
import { formatDate } from "@/lib/dates";

export default async function PublicQuotePage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const supabase = createAdminClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("*, quote_items(*), client:clients(*)")
    .eq("public_id", publicId)
    .single();

  if (!quote) notFound();

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="text-center">
          <p className="text-sm text-muted">Castaneda Strings</p>
          <h1 className="text-2xl font-semibold mt-1">{quote.title}</h1>
          <div className="mt-2"><StatusPill status={quote.status} /></div>
        </div>

        <Card>
          <h2 className="font-semibold mb-2 text-sm text-muted">Event</h2>
          <p className="font-medium">{quote.event_type}</p>
          <p className="text-sm text-muted">{formatDate(quote.event_date)}{quote.location_name ? ` · ${quote.location_name}` : ""}</p>
        </Card>

        <Card>
          <h2 className="font-semibold mb-3">Line items</h2>
          <div className="divide-y divide-border">
            {quote.quote_items?.map((item: { id: string; name: string; quantity: number; unit_price_cents: number; total_cents: number }) => (
              <div key={item.id} className="py-2.5 flex justify-between gap-3">
                <p className="text-sm">{item.name} <span className="text-muted">× {item.quantity}</span></p>
                <p className="text-sm font-medium">{formatCents(item.total_cents)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-2 pt-3 flex justify-between font-semibold">
            <span>Total</span><span>{formatCents(quote.total_cents)}</span>
          </div>
        </Card>

        {quote.notes_to_client && (
          <Card>
            <p className="text-sm whitespace-pre-wrap">{quote.notes_to_client}</p>
          </Card>
        )}

        {quote.status === "pending" ? (
          <QuoteResponse publicId={publicId} />
        ) : (
          <p className="text-center text-sm text-muted">This quote is {quote.status}.</p>
        )}
      </div>
    </div>
  );
}
