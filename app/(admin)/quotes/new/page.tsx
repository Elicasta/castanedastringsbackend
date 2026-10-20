import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
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

  const [{ data: clients }, { data: templates }, { data: projects }, inquiryResult] = await Promise.all([
    supabase.from("clients").select("*").order("full_name"),
    supabase.from("quote_templates").select("*").eq("status", "active").order("sort_order"),
    supabase.from("cs_quote_projects").select("id,client_id,name").order("created_at",{ascending:false}),
    inquiry_id
      ? supabase.from("inquiries").select("*").eq("id", inquiry_id).single()
      : Promise.resolve({ data: null }),
  ]);

  const inquiry = inquiryResult.data;

  return (
    <div>
      <PageHeader title="New Quote" description={inquiry ? "Pulled in from the inquiry." : "Pick a template or build from scratch."} />
      <div className="max-w-2xl mx-auto">
        <QuoteForm
          clients={clients ?? []}
          templates={templates ?? []}
          projects={projects ?? []}
          defaultClientId={inquiry?.client_id ?? undefined}
          defaultInquiryId={inquiry?.id}
          defaultEventType={inquiry?.event_type}
          defaultEventDate={inquiry?.event_date}
          defaultLocation={inquiry?.location_name}
        />
      </div>
    </div>
  );
}
