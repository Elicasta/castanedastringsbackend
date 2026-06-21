import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import { StatusTabs } from "@/components/ui/status-tabs";
import { StatusPill } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { formatCents } from "@/lib/currency";
import { formatDate } from "@/lib/dates";
import { FileText, Plus } from "lucide-react";
import Link from "next/link";

const TABS = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Accepted", value: "accepted" },
  { label: "Cancelled", value: "cancelled" },
];

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("quotes")
    .select("*, client:clients(*)")
    .order("created_at", { ascending: false });

  if (status && status !== "all") query = query.eq("status", status);
  if (q) query = query.or(`title.ilike.%${q}%,event_type.ilike.%${q}%`);

  const { data: quotes } = await query;

  return (
    <div>
      <PageHeader
        title="Quotes"
        action={
          <div className="flex gap-2">
            <ButtonLink href="/quotes/templates" variant="secondary">
              Templates
            </ButtonLink>
            <ButtonLink href="/quotes/new">
              <Plus className="size-4" /> New
            </ButtonLink>
          </div>
        }
      />
      <div className="space-y-3 mb-4">
        <SearchBar placeholder="Search by client or event…" />
        <StatusTabs tabs={TABS} />
      </div>

      {!quotes || quotes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No quotes yet"
          description="Create one from an inquiry, or start fresh."
          action={<ButtonLink href="/quotes/new">New quote</ButtonLink>}
        />
      ) : (
        <div className="space-y-2">
          {quotes.map((quote) => (
            <Link key={quote.id} href={`/quotes/${quote.id}`}>
              <Card className="flex items-center justify-between hover:border-brand/40 transition-colors">
                <div className="min-w-0">
                  <p className="font-medium truncate">{quote.title}</p>
                  <p className="text-sm text-muted truncate">
                    {quote.client?.full_name} · {formatDate(quote.event_date)} · {formatCents(quote.total_cents)}
                  </p>
                </div>
                <StatusPill status={quote.status} />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
