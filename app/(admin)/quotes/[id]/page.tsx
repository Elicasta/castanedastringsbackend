import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { BookingConfirm } from "@/components/admin/booking-confirm";
import { ReviseSentQuoteButton } from "@/components/admin/revise-sent-quote-button";
import { Pencil, Lock, MessageSquare } from "lucide-react";
import { canConfirmBooking } from "@/lib/booking-rules";
import { QuoteActions } from "@/components/admin/quote-actions";
import { formatCents } from "@/lib/currency";
import { formatDate, formatDateTime } from "@/lib/dates";

// Admin tool reading live data — never serve a cached/stale version of this page.
export const dynamic = "force-dynamic";

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
  const {data: existingBooking}=await supabase.from("cs_bookings").select("id").eq("quote_id",id).eq("status","confirmed").maybeSingle();
  const { data: events } = await supabase.from("activity_logs").select("id,action,description,created_at").eq("entity_type","quote").eq("entity_id",id).order("created_at",{ascending:false}).limit(30);

  return (
    <div>
      <PageHeader
        title={quote.title}
        description={`${quote.quote_number ?? ""} · ${quote.client?.full_name}`}
        action={<div className="flex flex-wrap items-center justify-end gap-2">{quote.status==="draft"&&<Link href={`/quotes/${quote.id}/edit`} className="rounded-xl border border-brand px-4 py-2 text-brand font-semibold text-sm inline-flex items-center gap-2"><Pencil size={16}/> Edit</Link>}{["pending","sent"].includes(quote.status)&&<ReviseSentQuoteButton id={quote.id}/>}<StatusPill status={quote.status}/></div>}
      />

      {quote.status!=="draft"&&<div className="mb-5 flex items-start gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-600"><Lock size={17} className="shrink-0 mt-0.5"/>This is the saved client version of this quote. All items, notes, dates, and totals are read-only. To change a sent quote, tap Edit and explicitly create a replacement draft. Accepted quotes cannot be rewritten.</div>}
      {quote.revision_of&&<p className="text-xs text-amber-700 mb-4">This quote is a revision of an earlier client quote. The earlier version is retained in history.</p>}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 space-y-4">
          <Card>
            <h2 className="font-semibold mb-3">Line items</h2>
            <div className="divide-y divide-border">
              {quote.quote_items?.sort((a:{sort_order:number},b:{sort_order:number})=>a.sort_order-b.sort_order).map((item: { id: string; name: string; description: string | null; quantity: number; unit_price_cents: number; total_cents: number; item_kind?:string; range_max_cents?:number|null }) => (
                <div key={item.id} className="py-2.5 flex justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    {item.description && <p className="text-xs text-muted">{item.description}</p>}
                    {item.item_kind && item.item_kind!=="standard" && <p className="text-xs text-brand capitalize">{item.item_kind.replace("_"," ")} · Client choice</p>}
                    {item.range_max_cents!=null && <p className="text-xs text-muted">Range up to {formatCents(item.range_max_cents)}</p>}
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

          {quote.notes_to_client&&<Card><h2 className="font-semibold mb-2">Message to client</h2><p className="text-sm whitespace-pre-wrap">{quote.notes_to_client}</p></Card>}
          <Card>
            <h2 className="font-semibold mb-3">Timeline</h2>
            {(events??[]).length===0?<p className="text-sm text-muted">No activity recorded yet.</p>:<ol className="space-y-3">{events?.map((e:any)=><li key={e.id} className="border-l-2 border-neutral-200 pl-4"><p className="text-sm font-medium">{e.description??e.action}</p><p className="text-xs text-muted">{formatDateTime(e.created_at)}</p></li>)}</ol>}
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
            {quote.client_id&&<Link href={`/communications/client/${quote.client_id}`} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#087b68]"><MessageSquare size={15}/> Open conversation</Link>}
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
          {quote.status==="accepted"&&<Card><h2 className="font-semibold mb-3">Confirmed booking</h2><BookingConfirm quoteId={quote.id} eventDate={quote.event_date} eligible={canConfirmBooking(quote.status,invoice?.status??null,contract?.status??null)} existingBooking={existingBooking}/></Card>}
          <Card><h2 className="font-semibold mb-2">Document settings</h2><p className="text-sm">Invoice on acceptance: {quote.auto_create_invoice?"On":"Off"}</p><p className="text-sm">Expiry: {quote.valid_until?formatDate(quote.valid_until):"Off"}</p><p className="text-sm">Reminders: {quote.reminders_enabled?"Enabled":"Off"}</p><p className="text-sm text-muted">Currency: {quote.currency?.toUpperCase()??"USD"}</p></Card>
          <p className="text-xs text-muted px-1">Created {formatDateTime(quote.created_at)}</p>
        </div>
      </div>
    </div>
  );
}
