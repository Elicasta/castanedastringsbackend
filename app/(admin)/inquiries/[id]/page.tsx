import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { ButtonLink } from "@/components/ui/button";
import { InquiryActions } from "@/components/admin/inquiry-actions";
import { formatDate, formatDateTime } from "@/lib/dates";
import { FileText } from "lucide-react";

export default async function InquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: inquiry } = await supabase
    .from("inquiries")
    .select("*, client:clients(*)")
    .eq("id", id)
    .single();

  if (!inquiry) notFound();

  const { data: quotes } = await supabase
    .from("quotes")
    .select("*")
    .eq("inquiry_id", id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title={inquiry.client?.full_name ?? "Inquiry"}
        description={`${inquiry.event_type ?? "Event type TBD"} · ${formatDate(inquiry.event_date)}`}
        action={<StatusPill status={inquiry.status} />}
      />

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 space-y-4">
          <Card>
            <h2 className="font-semibold mb-3">Event Details</h2>
            <dl className="text-sm space-y-2">
              <Row label="Venue" value={inquiry.location_name} />
              <Row label="Address" value={inquiry.location_address} />
              <Row label="Time" value={inquiry.event_start_time ? `${inquiry.event_start_time} – ${inquiry.event_end_time ?? ""}` : null} />
              <Row label="Guests" value={inquiry.guest_count?.toString()} />
              <Row label="Requested services" value={inquiry.requested_services} />
              <Row label="Source" value={inquiry.source} />
            </dl>
          </Card>

          {inquiry.message && (
            <Card>
              <h2 className="font-semibold mb-2">Client Message</h2>
              <p className="text-sm whitespace-pre-wrap">{inquiry.message}</p>
            </Card>
          )}

          <Card>
            <h2 className="font-semibold mb-2">Internal Notes</h2>
            <p className="text-sm whitespace-pre-wrap text-muted">
              {inquiry.internal_notes || "No notes yet."}
            </p>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Quotes</h2>
              <ButtonLink href={`/quotes/new?inquiry_id=${inquiry.id}`} variant="secondary">
                <FileText className="size-4" /> New quote
              </ButtonLink>
            </div>
            {!quotes || quotes.length === 0 ? (
              <p className="text-sm text-muted">No quotes yet.</p>
            ) : (
              <div className="space-y-2">
                {quotes.map((q) => (
                  <a key={q.id} href={`/quotes/${q.id}`} className="flex items-center justify-between rounded-xl border border-border p-3 hover:border-brand/40">
                    <span className="text-sm font-medium">{q.quote_number}</span>
                    <StatusPill status={q.status} />
                  </a>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <h2 className="font-semibold mb-3">Client</h2>
            <a href={`/clients/${inquiry.client_id}`} className="text-sm font-medium hover:text-brand">{inquiry.client?.full_name}</a>
            <p className="text-sm text-muted">{inquiry.client?.email ?? "No email"}</p>
            <p className="text-sm text-muted">{inquiry.client?.phone ?? "No phone"}</p>
          </Card>
          <Card>
            <h2 className="font-semibold mb-3">Actions</h2>
            <InquiryActions inquiryId={inquiry.id} status={inquiry.status} />
          </Card>
          <p className="text-xs text-muted px-1">Created {formatDateTime(inquiry.created_at)}</p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
