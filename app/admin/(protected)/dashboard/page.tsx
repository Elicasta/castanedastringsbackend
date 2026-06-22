import { createAdminClient } from '@/lib/supabase/server';

async function getCounts() {
  const supabase = createAdminClient();

  const [
    newInquiries,
    quotesPending,
    contractsPending,
    invoicesUnpaid,
    bookingReady,
    bookedSessions,
  ] = await Promise.all([
    supabase.from('inquiries').select('id', { count: 'exact', head: true }).eq('status', 'inquiry_received'),
    supabase.from('quotes').select('id', { count: 'exact', head: true }).in('status', ['quote_sent', 'quote_viewed']),
    supabase.from('contracts').select('id', { count: 'exact', head: true }).in('status', ['contract_sent', 'contract_viewed']),
    supabase.from('invoices').select('id', { count: 'exact', head: true }).in('payment_status', ['sent', 'viewed', 'payment_pending', 'past_due']),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'booking_ready'),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'booked'),
  ]);

  return {
    newInquiries: newInquiries.count ?? 0,
    quotesPending: quotesPending.count ?? 0,
    contractsPending: contractsPending.count ?? 0,
    invoicesUnpaid: invoicesUnpaid.count ?? 0,
    bookingReady: bookingReady.count ?? 0,
    bookedSessions: bookedSessions.count ?? 0,
  };
}

async function getRecentActivity() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('status_events')
    .select('id, title, event_type, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
  return data ?? [];
}

function StatCard({ label, value, href }: { label: string; value: number; href?: string }) {
  const content = (
    <>
      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-semibold text-neutral-900 mt-2">{value}</p>
    </>
  );
  if (!href) {
    return <div className="rounded-lg border border-neutral-200 bg-white p-5">{content}</div>;
  }
  return (
    <a href={href} className="block rounded-lg border border-neutral-200 bg-white p-5 hover:border-neutral-300">
      {content}
    </a>
  );
}

export default async function AdminDashboardPage() {
  const counts = await getCounts();
  const activity = await getRecentActivity();

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        <StatCard label="New inquiries" value={counts.newInquiries} href="/admin/inquiries" />
        <StatCard label="Quotes pending" value={counts.quotesPending} href="/admin/quotes" />
        <StatCard label="Contracts pending" value={counts.contractsPending} href="/admin/contracts" />
        <StatCard label="Invoices unpaid" value={counts.invoicesUnpaid} href="/admin/invoices" />
        <StatCard label="Booking ready" value={counts.bookingReady} href="/admin/calendar" />
        <StatCard label="Booked sessions" value={counts.bookedSessions} href="/admin/calendar" />
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white">
        <div className="px-5 py-3 border-b border-neutral-200">
          <h2 className="text-sm font-medium text-neutral-900">Recent activity</h2>
        </div>
        {activity.length === 0 ? (
          <p className="px-5 py-6 text-sm text-neutral-500">Nothing yet. Activity shows up here as inquiries, quotes, and bookings move forward.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {activity.map((event) => (
              <li key={event.id} className="px-5 py-3 flex items-center justify-between text-sm">
                <span className="text-neutral-800">{event.title}</span>
                <span className="text-neutral-400 text-xs">{new Date(event.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
