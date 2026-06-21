import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import { StatusTabs } from "@/components/ui/status-tabs";
import { StatusPill } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/dates";
import { Inbox, Plus } from "lucide-react";
import Link from "next/link";

// Admin tool reading live data — never serve a cached/stale version of this page.
export const dynamic = "force-dynamic";

const TABS = [
  { label: "All", value: "all" },
  { label: "New", value: "new" },
  { label: "Awaiting Response", value: "awaiting_response" },
  { label: "Quoted", value: "quoted" },
  { label: "Booked", value: "booked" },
  { label: "Cancelled", value: "cancelled" },
];

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("inquiries")
    .select("*, client:clients(*)")
    .order("created_at", { ascending: false });

  if (status && status !== "all") query = query.eq("status", status);
  if (q) query = query.or(`event_type.ilike.%${q}%,message.ilike.%${q}%`);

  const { data: inquiries } = await query;

  return (
    <div>
      <PageHeader
        title="Inquiries"
        action={
          <ButtonLink href="/inquiries/new">
            <Plus className="size-4" /> New
          </ButtonLink>
        }
      />
      <div className="space-y-3 mb-4">
        <SearchBar placeholder="Search by event type or message…" />
        <StatusTabs tabs={TABS} />
      </div>

      {!inquiries || inquiries.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No inquiries yet"
          description="When someone reaches out about booking, log it here."
          action={<ButtonLink href="/inquiries/new">Add an inquiry</ButtonLink>}
        />
      ) : (
        <div className="space-y-2">
          {inquiries.map((inq) => (
            <Link key={inq.id} href={`/inquiries/${inq.id}`}>
              <Card className="flex items-center justify-between hover:border-brand/40 transition-colors">
                <div className="min-w-0">
                  <p className="font-medium truncate">{inq.client?.full_name ?? "Unknown client"}</p>
                  <p className="text-sm text-muted truncate">
                    {inq.event_type ?? "Event type TBD"} · {formatDate(inq.event_date)}
                  </p>
                </div>
                <StatusPill status={inq.status} />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
