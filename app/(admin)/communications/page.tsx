import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { AddNoteForm } from "@/components/admin/add-note-form";
import { formatDateTime } from "@/lib/dates";
import { MessageSquare, Mail, FileText, StickyNote } from "lucide-react";

const CHANNEL_ICON = { email: Mail, note: StickyNote, system: FileText, phone: MessageSquare, text: MessageSquare };

export default async function CommunicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ channel?: string }>;
}) {
  const { channel } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("communications")
    .select("*, client:clients(*)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (channel) query = query.eq("channel", channel);
  const { data: comms } = await query;

  return (
    <div>
      <PageHeader title="Communications" description="Every email sent and note logged, in order." />

      <Card className="mb-4">
        <AddNoteForm />
      </Card>

      {!comms || comms.length === 0 ? (
        <EmptyState icon={MessageSquare} title="Nothing logged yet" />
      ) : (
        <div className="space-y-2">
          {comms.map((c) => {
            const Icon = CHANNEL_ICON[c.channel as keyof typeof CHANNEL_ICON] ?? MessageSquare;
            return (
              <Card key={c.id} className="flex gap-3">
                <div className="rounded-full bg-brand-light p-2 h-fit"><Icon className="size-4 text-brand" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">{c.subject ?? c.client?.full_name ?? "Note"}</p>
                    <span className="text-xs text-muted whitespace-nowrap">{formatDateTime(c.created_at)}</span>
                  </div>
                  {c.body && <p className="text-sm text-muted mt-1 whitespace-pre-wrap">{c.body}</p>}
                  <p className="text-xs text-muted mt-1 capitalize">{c.channel} · {c.status}</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
