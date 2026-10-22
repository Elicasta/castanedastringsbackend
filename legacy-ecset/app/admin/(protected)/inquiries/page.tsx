import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';

const STATUS_LABELS: Record<string, string> = {
  inquiry_received: 'New',
  inquiry_reviewed: 'Reviewed',
  archived: 'Archived',
  cancelled: 'Cancelled',
};

export default async function InquiriesListPage({
  searchParams,
}: {
  searchParams: { status?: string; type?: string };
}) {
  const supabase = createAdminClient();

  let query = supabase
    .from('inquiries')
    .select('id, inquiry_type, session_type, status, created_at, vision_text, clients(first_name, last_name, email)')
    .order('created_at', { ascending: false });

  if (searchParams.status) query = query.eq('status', searchParams.status);
  if (searchParams.type) query = query.eq('inquiry_type', searchParams.type);

  const { data: inquiries } = await query;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-neutral-900">Inquiries</h1>
      </div>

      <div className="flex gap-2 mb-4">
        {['', 'inquiry_received', 'inquiry_reviewed', 'archived'].map((status) => (
          <Link
            key={status}
            href={status ? `/admin/inquiries?status=${status}` : '/admin/inquiries'}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              searchParams.status === status || (!searchParams.status && !status)
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'border-neutral-300 text-neutral-600'
            }`}
          >
            {status ? STATUS_LABELS[status] : 'All'}
          </Link>
        ))}
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
        {!inquiries || inquiries.length === 0 ? (
          <p className="px-5 py-8 text-sm text-neutral-500 text-center">No inquiries yet. They'll show up here as soon as someone submits the form at /inquire.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-2.5 font-medium">Client</th>
                <th className="text-left px-5 py-2.5 font-medium">Session type</th>
                <th className="text-left px-5 py-2.5 font-medium">Status</th>
                <th className="text-left px-5 py-2.5 font-medium">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {inquiries.map((inquiry: any) => (
                <tr key={inquiry.id} className="hover:bg-neutral-50">
                  <td className="px-5 py-3">
                    <Link href={`/admin/inquiries/${inquiry.id}`} className="font-medium text-neutral-900 hover:underline">
                      {inquiry.clients?.first_name} {inquiry.clients?.last_name}
                    </Link>
                    <p className="text-xs text-neutral-500">{inquiry.clients?.email}</p>
                  </td>
                  <td className="px-5 py-3 text-neutral-700 capitalize">{inquiry.session_type ?? inquiry.inquiry_type}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-neutral-100 text-neutral-700">
                      {STATUS_LABELS[inquiry.status] ?? inquiry.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-neutral-500">{new Date(inquiry.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
