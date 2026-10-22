import { createAdminClient } from '@/lib/supabase/server';

const STATUS_STYLES: Record<string, string> = {
  queued: 'bg-neutral-100 text-neutral-700',
  sent: 'bg-green-50 text-green-700',
  delivered: 'bg-green-50 text-green-700',
  failed: 'bg-red-50 text-red-700',
};

export default async function EmailLogsPage() {
  const supabase = createAdminClient();
  const { data: logs } = await supabase
    .from('email_logs')
    .select('id, to_email, subject, status, error_message, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900 mb-1">Email Logs</h1>
      <p className="text-sm text-neutral-500 mb-6">Every email the system has sent, success or failure.</p>

      <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
        {!logs || logs.length === 0 ? (
          <p className="px-5 py-8 text-sm text-neutral-500 text-center">No emails sent yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-2.5 font-medium">To</th>
                <th className="text-left px-5 py-2.5 font-medium">Subject</th>
                <th className="text-left px-5 py-2.5 font-medium">Status</th>
                <th className="text-left px-5 py-2.5 font-medium">Sent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-neutral-50">
                  <td className="px-5 py-3 text-neutral-700">{log.to_email}</td>
                  <td className="px-5 py-3 text-neutral-700">
                    {log.subject}
                    {log.error_message && <p className="text-xs text-red-500 mt-0.5">{log.error_message}</p>}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES[log.status] ?? 'bg-neutral-100 text-neutral-700'}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-neutral-500">{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-neutral-400 mt-4">
        No "resend" action here, on purpose: `email_logs` stores the subject sent but not the full body, so there's
        nothing to actually resend from this table alone. A real resend would mean re-running whatever server action
        triggered the original email (e.g. "Send quote" again from the quote page), not resending from this log.
      </p>
    </div>
  );
}
