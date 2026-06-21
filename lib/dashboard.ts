import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function markPastDueInvoices() {
  const supabase = createAdminClient();
  await supabase.rpc("mark_past_due_invoices");
}

export async function getDashboardData() {
  await markPastDueInvoices();
  const supabase = await createClient();

  const [
    inquiriesAwaiting,
    quotesActive,
    quotesAccepted,
    invoicesPending,
    invoicesPastDue,
    recentActivity,
    upcomingEvents,
  ] = await Promise.all([
    supabase.from("inquiries").select("id", { count: "exact", head: true }).in("status", ["new", "awaiting_response"]),
    supabase.from("quotes").select("id", { count: "exact", head: true }).in("status", ["sent", "pending"]),
    supabase.from("quotes").select("id", { count: "exact", head: true }).eq("status", "accepted"),
    supabase.from("invoices").select("id", { count: "exact", head: true }).in("status", ["sent", "payment_pending"]),
    supabase.from("invoices").select("id", { count: "exact", head: true }).eq("status", "past_due"),
    supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(8),
    supabase
      .from("quotes")
      .select("id, title, event_date, event_type, client:clients(full_name)")
      .eq("status", "accepted")
      .gte("event_date", new Date().toISOString().slice(0, 10))
      .order("event_date", { ascending: true })
      .limit(5),
  ]);

  return {
    counts: {
      inquiriesAwaiting: inquiriesAwaiting.count ?? 0,
      quotesActive: quotesActive.count ?? 0,
      quotesAccepted: quotesAccepted.count ?? 0,
      invoicesPending: invoicesPending.count ?? 0,
      invoicesPastDue: invoicesPastDue.count ?? 0,
    },
    recentActivity: recentActivity.data ?? [],
    upcomingEvents: upcomingEvents.data ?? [],
  };
}
