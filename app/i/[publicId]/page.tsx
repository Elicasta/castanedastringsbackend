import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { InvoicePay } from "@/components/public/invoice-pay";
import { formatCents } from "@/lib/currency";
import { formatDate } from "@/lib/dates";

export default async function PublicInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ publicId: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const { publicId } = await params;
  const { paid } = await searchParams;
  const supabase = createAdminClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, invoice_items(*)")
    .eq("public_id", publicId)
    .single();
  if (!invoice) notFound();

  const { data: settings } = await supabase.from("settings").select("*").limit(1).single();

  const payable = ["sent", "payment_pending", "past_due"].includes(invoice.status);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="text-center">
          <p className="text-sm text-muted">Castaneda Strings</p>
          <h1 className="text-2xl font-semibold mt-1">{invoice.invoice_number}</h1>
          <div className="mt-2"><StatusPill status={invoice.status} /></div>
        </div>

        {paid && (
          <div className="rounded-xl bg-emerald-50 text-emerald-700 text-sm p-3 text-center">
            Payment received — thank you!
          </div>
        )}

        <Card>
          <div className="divide-y divide-border">
            {invoice.invoice_items?.map((item: { id: string; name: string; quantity: number; unit_price_cents: number; total_cents: number }) => (
              <div key={item.id} className="py-2.5 flex justify-between gap-3">
                <p className="text-sm">{item.name} <span className="text-muted">× {item.quantity}</span></p>
                <p className="text-sm font-medium">{formatCents(item.total_cents)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-2 pt-3 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted">Total</span><span>{formatCents(invoice.total_cents)}</span></div>
            <div className="flex justify-between"><span className="text-muted">Paid</span><span>{formatCents(invoice.amount_paid_cents)}</span></div>
            <div className="flex justify-between font-semibold text-base pt-1"><span>Balance due</span><span>{formatCents(invoice.balance_due_cents)}</span></div>
          </div>
          <p className="text-xs text-muted mt-2">Due {formatDate(invoice.due_date)}</p>
        </Card>

        {payable ? (
          <InvoicePay
            publicId={publicId}
            zelleName={settings?.zelle_name}
            zelleEmail={settings?.zelle_email}
            zellePhone={settings?.zelle_phone}
          />
        ) : (
          <p className="text-center text-sm text-muted">This invoice is {invoice.status}.</p>
        )}
      </div>
    </div>
  );
}
