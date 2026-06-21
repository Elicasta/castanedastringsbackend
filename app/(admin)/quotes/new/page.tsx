import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { QuoteForm } from "@/components/admin/quote-form";

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ inquiry_id?: string }>;
}) {
  const { inquiry_id } = await searchParams;
  const supabase = await createClient();

  const [{ data: clients }, inquiryResult] = await Promise.all([
    supabase.from("clients").select("*").order("full_name"),
    inquiry_id
      ? supabase.from("inquiries").select("*").eq("id", inquiry_id).single()
      : Promise.resolve({ data: null }),
  ]);

  const inquiry = inquiryResult.data;

  return (
    <div>
      <PageHeader title="New Quote" description={inquiry ? "Pulled in from the inquiry." : "Build a quote from scratch."} />
      <Card className="max-w-xl">
        <QuoteForm
          clients={clients ?? []}
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
