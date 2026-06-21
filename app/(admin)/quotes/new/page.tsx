import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { QuoteForm } from "@/components/admin/quote-form";

// Admin tool reading live data — never serve a cached/stale version of this page.
export const dynamic = "force-dynamic";

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ inquiry_id?: string }>;
}) {
  const { inquiry_id } = await searchParams;
  const supabase = await createClient();

  const [{ data: clients }, { data: templates }, inquiryResult] = await Promise.all([
    supabase.from("clients").select("*").order("full_name"),
    supabase.from("quote_templates").select("*").eq("status", "active").order("sort_order"),
    inquiry_id
      ? supabase.from("inquiries").select("*").eq("id", inquiry_id).single()
      : Promise.resolve({ data: null }),
  ]);

  const inquiry = inquiryResult.data;

  return (
    <div>
      <PageHeader title="New Quote" description={inquiry ? "Pulled in from the inquiry." : "Pick a template or build from scratch."} />
      <Card className="max-w-xl">
        <QuoteForm
          clients={clients ?? []}
          templates={templates ?? []}
          defaultClientId={inquiry?.client_id ?? undefined}
          defaultInquiryId={inquiry?.id}
          defaultEventType={inquiry?.event_type}
          defaultEventDate={inquiry?.event_date}
          defaultLocation={inquiry?.location_name}
        />
      </Card>
    </div>
  );
}
