import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { formatCents } from "@/lib/currency";
import { formatDate, formatDateTime } from "@/lib/dates";
import { CopyButton } from "@/components/admin/copy-button";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase.from("clients").select("*").eq("id", id).single();
  if (!client) notFound();

  const [{ data: inquiries }, { data: quotes }, { data: invoices }, { data: contracts }] = await Promise.all([
    supabase.from("inquiries").select("*").eq("client_id", id).order("created_at", { ascending: false }),
    supabase.from("quotes").select("*").eq("client_id", id).order("created_at", { ascending: false }),
    supabase.from("invoices").select("*").eq("client_id", id).order("created_at", { ascending: false }),
    supabase.from("contracts").select("*").eq("client_id", id).order("created_at", { ascending: false }),
  ]);

  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/portal/${client.portal_public_id}`;

  return (
    <div>
      <PageHeader title={client.full_name} description={client.email ?? "No email on file"} />

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 space-y-4">
          <ClientSection title="Inquiries" emptyLabel="No inquiries yet.">
            {inquiries?.map((i) => (
              <a key={i.id} href={`/inquiries/${i.id}`} className="flex items-center justify-between rounded-xl border border-border p-3 hover:border-brand/40">
                <div>
                  <p className="text-sm font-medium">{i.event_type ?? "Event type TBD"}</p>
                  <p className="text-xs text-muted">{formatDate(i.event_date)}</p>
                </div>
                <StatusPill status={i.status} />
              </a>
            ))}
          </ClientSection>

          <ClientSection title="Quotes" emptyLabel="No quotes yet.">
            {quotes?.map((q) => (
              <a key={q.id} href={`/quotes/${q.id}`} className="flex items-center justify-between rounded-xl border border-border p-3 hover:border-brand/40">
                <div>
                  <p className="text-sm font-medium">{q.title}</p>
                  <p className="text-xs text-muted">{q.quote_number} · {formatCents(q.total_cents)}</p>
                </div>
                <StatusPill status={q.status} />
              </a>
            ))}
          </ClientSection>

          <ClientSection title="Invoices" emptyLabel="No invoices yet.">
            {invoices?.map((inv) => (
              <a key={inv.id} href={`/invoices/${inv.id}`} className="flex items-center justify-between rounded-xl border border-border p-3 hover:border-brand/40">
                <div>
                  <p className="text-sm font-medium">{inv.invoice_number}</p>
                  <p className="text-xs text-muted">Balance {formatCents(inv.balance_due_cents)}</p>
                </div>
                <StatusPill status={inv.status} />
              </a>
            ))}
          </ClientSection>

          <ClientSection title="Contracts" emptyLabel="No contracts yet.">
            {contracts?.map((c) => (
              <a key={c.id} href={`/contracts/${c.id}`} className="flex items-center justify-between rounded-xl border border-border p-3 hover:border-brand/40">
                <p className="text-sm font-medium">{c.title}</p>
                <StatusPill status={c.status} />
              </a>
            ))}
          </ClientSection>
        </div>

        <div className="space-y-4">
          <Card>
            <h2 className="font-semibold mb-3">Contact</h2>
            <p className="text-sm">{client.email ?? "No email"}</p>
            <p className="text-sm text-muted">{client.phone ?? "No phone"}</p>
            {client.instagram_handle && <p className="text-sm text-muted">@{client.instagram_handle}</p>}
          </Card>

          <Card>
            <h2 className="font-semibold mb-2">Client portal</h2>
            <p className="text-xs text-muted mb-2">
              One link with all of this client&apos;s quotes, invoices, and contracts. No login needed.
            </p>
            <div className="flex items-center gap-2 rounded-xl border border-border p-2 text-xs">
              <span className="truncate flex-1">{portalUrl}</span>
              <CopyButton value={portalUrl} />
            </div>
          </Card>

          {client.notes && (
            <Card>
              <h2 className="font-semibold mb-2">Notes</h2>
              <p className="text-sm whitespace-pre-wrap text-muted">{client.notes}</p>
            </Card>
          )}

          <p className="text-xs text-muted px-1">Client since {formatDateTime(client.created_at)}</p>
        </div>
      </div>
    </div>
  );
}

function ClientSection({
  title,
  emptyLabel,
  children,
}: {
  title: string;
  emptyLabel: string;
  children: React.ReactNode;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <Card>
      <h2 className="font-semibold mb-3">{title}</h2>
      {hasChildren ? <div className="space-y-2">{children}</div> : <p className="text-sm text-muted">{emptyLabel}</p>}
    </Card>
  );
}
