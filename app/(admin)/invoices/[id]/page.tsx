import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { InvoiceActions } from "@/components/admin/invoice-actions";
import { formatCents } from "@/lib/currency";
import { formatDate, formatDateTime } from "@/lib/dates";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, client:clients(*), invoice_items(*)")
    .eq("id", id)
    .single();
  if (!invoice) notFound();

  return (
    <div>
      <PageHeader
        title={invoice.invoice_number ?? "Invoice"}
        description={invoice.client?.full_name}
        action={<StatusPill status={invoice.status} />}
      />

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 space-y-4">
          <Card>
            <h2 className="font-semibold mb-3">Line items</h2>
            <div className="divide-y divide-border">
              {invoice.invoice_items?.map((item: { id: string; name: string; quantity: number; unit_price_cents: number; total_cents: number }) => (
                <div key={item.id} className="py-2.5 flex justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted">{item.quantity} × {formatCents(item.unit_price_cents)}</p>
                  </div>
                  <p className="text-sm font-medium whitespace-nowrap">{formatCents(item.total_cents)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-border mt-2 pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted">Total</span><span>{formatCents(invoice.total_cents)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Paid</span><span>{formatCents(invoice.amount_paid_cents)}</span></div>
              <div className="flex justify-between font-semibold text-base pt-1"><span>Balance due</span><span>{formatCents(invoice.balance_due_cents)}</span></div>
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold mb-3">Payment</h2>
            <p className="text-sm text-muted">Method: {invoice.payment_method ?? "Not paid yet"}</p>
            {invoice.zelle_reference && <p className="text-sm text-muted">Zelle ref: {invoice.zelle_reference}</p>}
            {invoice.paid_at && <p className="text-sm text-muted">Paid {formatDateTime(invoice.paid_at)}</p>}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <h2 className="font-semibold mb-3">Client</h2>
            <a href={`/clients/${invoice.client_id}`} className="text-sm font-medium hover:text-brand">{invoice.client?.full_name}</a>
            <p className="text-sm text-muted">{invoice.client?.email ?? "No email"}</p>
          </Card>
          <Card>
            <h2 className="font-semibold mb-3">Due date</h2>
            <p className="text-sm">{formatDate(invoice.due_date)}</p>
          </Card>
          <Card>
            <h2 className="font-semibold mb-3">Actions</h2>
            <InvoiceActions invoiceId={invoice.id} status={invoice.status} balanceDueCents={invoice.balance_due_cents} />
          </Card>
        </div>
      </div>
    </div>
  );
}
