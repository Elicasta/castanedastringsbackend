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

// Admin tool reading live data — never serve a cached/stale version of this page.
export const dynamic = "force-dynamic";

const TABS = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Sent", value: "sent" },
  { label: "Accepted", value: "accepted" },
  { label: "Declined", value: "declined" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Expired", value: "expired" },
];

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { q, status, page: pageParam } = await searchParams;
  const page=Math.min(100000,Math.max(1,Number.parseInt(pageParam??"1",10)||1));
  const pageSize=30;
  const supabase = await createClient();

  let query = supabase
    .from("quotes")
    .select("*, client:clients(*)",{count:"exact"})
    .order("created_at", { ascending: false });

  if (status === "sent") query = query.in("status", ["sent", "pending"]);
  else if (TABS.some(tab=>tab.value===status && status!=="all")) query=query.eq("status",status!);
  if (q) {
    const safe=q.slice(0,80).replace(/[,.()%"\\]/g,"").trim();
    if(safe){
      const {data:clients}=await supabase.from("clients").select("id").ilike("full_name",`%${safe}%`).limit(100);
      const extra=(clients??[]).map(c=>c.id).filter(Boolean);
      const predicates=[`title.ilike.%${safe}%`,`event_type.ilike.%${safe}%`,`quote_number.ilike.%${safe}%`];
      if(extra.length)predicates.push(`client_id.in.(${extra.join(",")})`);
      query=query.or(predicates.join(","));
    }
  }
  const {data:quotes,count,error}=await query.range((page-1)*pageSize,page*pageSize-1);
  const totalPages=Math.max(1,Math.ceil((count??0)/pageSize));
  const makeLink=(p:number)=>{
    const params=new URLSearchParams();
    if(q)params.set("q",q);
    if(status&&status!=="all")params.set("status",status);
    params.set("page",String(p));
    return `/quotes?${params.toString()}`;
  };

  return (
    <div>
      <PageHeader
        title="Quotes"
        description="All quote drafts, deliveries, client responses, and cancellations."
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

      {error&&<p className="rounded-xl bg-red-50 text-red-700 p-3 text-sm">Unable to load quotes. Check your database and admin access.</p>}
      {!quotes || quotes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No quotes yet"
          description="Create one from an inquiry, or start fresh."
          action={<ButtonLink href="/quotes/new">New quote</ButtonLink>}
        />
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted">{count??0} quote{count===1?"":"s"} found · Page {page} of {totalPages}</p>
          {quotes.map((quote) => (
            <Link key={quote.id} href={`/quotes/${quote.id}`}>
              <Card className="flex items-center justify-between hover:border-brand/40 transition-colors">
                <div className="min-w-0">
                  <p className="font-medium truncate">{quote.title}</p>
                  <p className="text-sm text-muted truncate">
                    {quote.quote_number??"Draft"} · {quote.client?.full_name} · {formatDate(quote.event_date)} · {formatCents(quote.total_cents)}
                  </p>
                </div>
                <StatusPill status={quote.status} />
              </Card>
            </Link>
          ))}
          {totalPages>1&&<nav aria-label="Quote pages" className="flex items-center justify-between pt-4 text-sm"><span>{page>1?<Link href={makeLink(page-1)} className="text-brand font-semibold">← Previous</Link>:<span className="text-neutral-400">Previous</span>}</span><span>{page} / {totalPages}</span><span>{page<totalPages?<Link href={makeLink(page+1)} className="text-brand font-semibold">Next →</Link>:<span className="text-neutral-400">Next</span>}</span></nav>}
        </div>
      )}
    </div>
  );
}
