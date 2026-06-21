import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { formatCents } from "@/lib/currency";
import { formatDate } from "@/lib/dates";
import { FileText, Receipt, FileSignature } from "lucide-react";

export default async function ClientPortalPage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const supabase = createAdminClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("portal_public_id", publicId)
    .single();
  if (!client) notFound();

  const [{ data: quotes }, { data: invoices }, { data: contracts }] = await Promise.all([
    supabase
      .from("quotes")
      .select("*")
      .eq("client_id", client.id)
      .neq("status", "draft")
      .order("created_at", { ascending: false }),
    supabase
      .from("invoices")
      .select("*")
      .eq("client_id", client.id)
      .neq("status", "draft")
      .order("created_at", { ascending: false }),
    supabase
      .from("contracts")
      .select("*")
      .eq("client_id", client.id)
      .neq("status", "draft")
      .order("created_at", { ascending: false }),
  ]);

  const nothingYet = !quotes?.length && !invoices?.length && !contracts?.length;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <p className="text-sm text-muted">Castaneda Strings</p>
          <h1 className="text-2xl font-semibold mt-1">Hi {client.first_name}</h1>
          <p className="text-sm text-muted mt-1">Everything for your event, in one place.</p>
        </div>

        {nothingYet && (
          <Card className="text-center text-sm text-muted">
            Nothing here yet — check back once your quote is ready.
          </Card>
        )}

        {!!quotes?.length && (
          <PortalSection title="Quotes" icon={FileText}>
            {quotes.map((q) => (
              <a
                key={q.id}
                href={`/q/${q.public_id}`}
                className="flex items-center justify-between rounded-xl border border-border p-3 hover:border-brand/40 bg-white"
              >
                <div>
                  <p className="text-sm font-medium">{q.title}</p>
                  <p className="text-xs text-muted">{formatDate(q.event_date)} · {formatCents(q.total_cents)}</p>
                </div>
                <StatusPill status={q.status} />
              </a>
            ))}
          </PortalSection>
        )}

        {!!invoices?.length && (
          <PortalSection title="Invoices" icon={Receipt}>
            {invoices.map((inv) => (
              <a
                key={inv.id}
                href={`/i/${inv.public_id}`}
                className="flex items-center justify-between rounded-xl border border-border p-3 hover:border-brand/40 bg-white"
              >
                <div>
                  <p className="text-sm font-medium">{inv.invoice_number}</p>
                  <p className="text-xs text-muted">Balance {formatCents(inv.balance_due_cents)}</p>
                </div>
                <StatusPill status={inv.status} />
              </a>
            ))}
          </PortalSection>
        )}

        {!!contracts?.length && (
          <PortalSection title="Contracts" icon={FileSignature}>
            {contracts.map((c) => (
              <a
                key={c.id}
                href={`/c/${c.public_id}`}
                className="flex items-center justify-between rounded-xl border border-border p-3 hover:border-brand/40 bg-white"
              >
                <p className="text-sm font-medium">{c.title}</p>
                <StatusPill status={c.status} />
              </a>
            ))}
          </PortalSection>
        )}

        <p className="text-center text-xs text-muted">
          Questions? Just reply to any of our emails.
        </p>
      </div>
    </div>
  );
}

function PortalSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 px-1">
        <Icon className="size-4 text-brand" />
        <h2 className="font-semibold text-sm">{title}</h2>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
