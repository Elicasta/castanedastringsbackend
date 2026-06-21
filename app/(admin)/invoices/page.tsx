import { createClient } from "@/lib/supabase/server";
import { markPastDueInvoices } from "@/lib/dashboard";
import { PageHeader } from "@/components/ui/page-header";
import { SearchBar } from "@/components/ui/search-bar";
import { StatusTabs } from "@/components/ui/status-tabs";
import { StatusPill } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { formatCents } from "@/lib/currency";
import { formatDate } from "@/lib/dates";
import { Receipt } from "lucide-react";
import Link from "next/link";

const TABS = [
  { label: "All", value: "all" },
  { label: "Payment Pending", value: "payment_pending" },
  { label: "Paid", value: "paid" },
  { label: "Past Due", value: "past_due" },
  { label: "Cancelled", value: "cancelled" },
];

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await markPastDueInvoices();
  const { q, status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("invoices")
    .select("*, client:clients(*)")
    .order("created_at", { ascending: false });

  if (status && status !== "all") query = query.eq("status", status);
  if (q) query = query.or(`invoice_number.ilike.%${q}%`);

  const { data: invoices } = await query;

  return (
    <div>
      <PageHeader title="Invoices" />
      <div className="space-y-3 mb-4">
        <SearchBar placeholder="Search by invoice number…" />
        <StatusTabs tabs={TABS} />
      </div>

      {!invoices || invoices.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No invoices yet"
          description="Invoices show up here once a quote is accepted, or you create one manually."
        />
      ) : (
        <div className="space-y-2">
          {invoices.map((inv) => (
            <Link key={inv.id} href={`/invoices/${inv.id}`}>
              <Card className="flex items-center justify-between hover:border-brand/40 transition-colors">
                <div className="min-w-0">
                  <p className="font-medium truncate">{inv.invoice_number}</p>
                  <p className="text-sm text-muted truncate">
                    {inv.client?.full_name} · Due {formatDate(inv.due_date)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">{formatCents(inv.balance_due_cents)}</p>
                  <StatusPill status={inv.status} className="mt-1" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
