import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { SearchBar } from "@/components/ui/search-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";
import Link from "next/link";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("clients")
    .select(
      "*, inquiries(count), quotes(count), invoices(count), contracts(count)"
    )
    .order("full_name");

  if (q) query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`);

  const { data: clients } = await query;

  return (
    <div>
      <PageHeader title="Clients" description="Everyone who's inquired, booked, or been quoted." />
      <div className="mb-4">
        <SearchBar placeholder="Search by name or email…" />
      </div>

      {!clients || clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Clients appear automatically as inquiries come in."
        />
      ) : (
        <div className="space-y-2">
          {clients.map((c) => {
            const inquiryCount = c.inquiries?.[0]?.count ?? 0;
            const quoteCount = c.quotes?.[0]?.count ?? 0;
            const invoiceCount = c.invoices?.[0]?.count ?? 0;
            const contractCount = c.contracts?.[0]?.count ?? 0;
            return (
              <Link key={c.id} href={`/clients/${c.id}`}>
                <Card className="flex items-center justify-between hover:border-brand/40 transition-colors">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{c.full_name}</p>
                    <p className="text-sm text-muted truncate">{c.email ?? "No email"}</p>
                  </div>
                  <div className="text-right text-xs text-muted whitespace-nowrap">
                    {inquiryCount > 0 && <span className="mr-2">{inquiryCount} inquiry</span>}
                    {quoteCount > 0 && <span className="mr-2">{quoteCount} quote</span>}
                    {invoiceCount > 0 && <span className="mr-2">{invoiceCount} invoice</span>}
                    {contractCount > 0 && <span>{contractCount} contract</span>}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
