import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { QuoteActions } from "@/components/admin/quote-actions";
import { formatCents } from "@/lib/currency";
import { formatDate, formatDateTime } from "@/lib/dates";

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("*, client:clients(*), quote_items(*)")
    .eq("id", id)
    .single();
  if (!quote) notFound();

  const { data: invoice } = await supabase.from("invoices").select("id, public_id, status").eq("quote_id", id).maybeSingle();
  const { data: contract } = await supabase.from("contracts").select("id, public_id, status").eq("quote_id", id).maybeSingle();

  return (
    <div>
      <PageHeader
        title={quote.title}
        description={`${quote.quote_number ?? ""} · ${quote.client?.full_name}`}
        action={<StatusPill status={quote.status} />}
      />

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 space-y-4">
          <Card>
            <h2 className="font-semibold mb-3">Line items</h2>
            <div className="divide-y divide-border">
              {quote.quote_items?.map((item: { id: string; name: string; description: string | null; quantity: number; unit_price_cents: number; total_cents: number }) => (
                <div key={item.id} className="py-2.5 flex justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    {item.description && <p className="text-xs text-muted">{item.description}</p>}
                    <p className="text-xs text-muted">{item.quantity} × {formatCents(item.unit_price_cents)}</p>
                  </div>
                  <p className="text-sm font-medium whitespace-nowrap">{formatCents(item.total_cents)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-border mt-2 pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{formatCents(quote.subtotal_cents)}</span></div>
              {quote.discount_cents > 0 && <div className="flex justify-between"><span className="text-muted">Discount</span><span>−{formatCents(quote.discount_cents)}</span></div>}
              {quote.tax_cents > 0 && <div className="flex justify-between"><span className="text-muted">Tax</span><span>{formatCents(quote.tax_cents)}</span></div>}
              <div className="flex justify-between font-semibold text-base pt-1"><span>Total</span><span>{formatCents(quote.total_cents)}</span></div>
            </div>
          </Card>

          {(invoice || contract) && (
            <Card>
              <h2 className="font-semibold mb-3">Generated documents</h2>
              <div className="space-y-2">
                {invoice && (
                  <a href={`/invoices/${invoice.id}`} className="flex items-center justify-between rounded-xl border border-border p-3 hover:border-brand/40">
                    <span className="text-sm font-medium">Invoice</span>
                    <StatusPill status={invoice.status} />
                  </a>
                )}
                {contract && (
                  <a href={`/contracts/${contract.id}`} className="flex items-center justify-between rounded-xl border border-border p-3 hover:border-brand/40">
                    <span className="text-sm font-medium">Contract</span>
                    <StatusPill status={contract.status} />
                  </a>
                )}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <h2 className="font-semibold mb-3">Client</h2>
            <a href={`/clients/${quote.client_id}`} className="text-sm font-medium hover:text-brand">{quote.client?.full_name}</a>
            <p className="text-sm text-muted">{quote.client?.email ?? "No email"}</p>
          </Card>
          <Card>
            <h2 className="font-semibold mb-3">Event</h2>
            <p className="text-sm">{quote.event_type ?? "—"}</p>
            <p className="text-sm text-muted">{formatDate(quote.event_date)}</p>
            <p className="text-sm text-muted">{quote.location_name ?? "—"}</p>
          </Card>
          <Card>
            <h2 className="font-semibold mb-3">Actions</h2>
            <QuoteActions quoteId={quote.id} status={quote.status} />
          </Card>
          <p className="text-xs text-muted px-1">Created {formatDateTime(quote.created_at)}</p>
        </div>
      </div>
    </div>
  );
}
