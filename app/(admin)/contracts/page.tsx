import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button";
import { StatusTabs } from "@/components/ui/status-tabs";
import { StatusPill } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { FileSignature } from "lucide-react";
import Link from "next/link";

const TABS = [
  { label: "All", value: "all" },
  { label: "Sent", value: "sent" },
  { label: "Pending", value: "pending" },
  { label: "Signed", value: "signed" },
];

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("contracts").select("*, client:clients(*)").order("created_at", { ascending: false });
  if (status && status !== "all") query = query.eq("status", status);
  const { data: contracts } = await query;

  return (
    <div>
      <PageHeader
        title="Contracts"
        action={
          <ButtonLink href="/contracts/templates" variant="secondary">
            Templates
          </ButtonLink>
        }
      />
      <div className="mb-4"><StatusTabs tabs={TABS} /></div>

      {!contracts || contracts.length === 0 ? (
        <EmptyState
          icon={FileSignature}
          title="No contracts yet"
          description="Contracts generate automatically when a quote is accepted, if you have an active template."
          action={<ButtonLink href="/contracts/templates">Set up a template</ButtonLink>}
        />
      ) : (
        <div className="space-y-2">
          {contracts.map((c) => (
            <Link key={c.id} href={`/contracts/${c.id}`}>
              <Card className="flex items-center justify-between hover:border-brand/40 transition-colors">
                <div className="min-w-0">
                  <p className="font-medium truncate">{c.title}</p>
                  <p className="text-sm text-muted truncate">{c.client?.full_name}</p>
                </div>
                <StatusPill status={c.status} />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
