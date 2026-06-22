import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-neutral-100 text-neutral-700',
  sent: 'bg-blue-50 text-blue-700',
  viewed: 'bg-blue-50 text-blue-700',
  payment_pending: 'bg-amber-50 text-amber-700',
  paid: 'bg-green-50 text-green-700',
  past_due: 'bg-red-50 text-red-700',
  cancelled: 'bg-neutral-100 text-neutral-500',
  refunded: 'bg-neutral-100 text-neutral-500',
};

export default async function InvoicesListPage() {
  const supabase = createAdminClient();
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, title, payment_status, total, balance_due, zelle_reference, created_at, clients(first_name, last_name)')
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900 mb-6">Invoices</h1>

      <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
        {!invoices || invoices.length === 0 ? (
          <p className="px-5 py-8 text-sm text-neutral-500 text-center">
            No invoices yet. One drafts automatically when a client accepts a quote.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-2.5 font-medium">Client</th>
                <th className="text-left px-5 py-2.5 font-medium">Invoice #</th>
                <th className="text-left px-5 py-2.5 font-medium">Balance</th>
                <th className="text-left px-5 py-2.5 font-medium">Status</th>
                <th className="text-left px-5 py-2.5 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {invoices.map((invoice: any) => (
                <tr key={invoice.id} className="hover:bg-neutral-50">
                  <td className="px-5 py-3">
                    <Link href={`/admin/invoices/${invoice.id}`} className="font-medium text-neutral-900 hover:underline">
                      {invoice.clients?.first_name} {invoice.clients?.last_name}
                    </Link>
                    {invoice.zelle_reference && invoice.payment_status !== 'paid' && (
                      <p className="text-xs text-amber-600 mt-0.5">Zelle ref submitted — needs confirmation</p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-neutral-700">{invoice.invoice_number}</td>
                  <td className="px-5 py-3 text-neutral-700">${Number(invoice.balance_due).toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES[invoice.payment_status] ?? 'bg-neutral-100 text-neutral-700'}`}>
                      {invoice.payment_status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-neutral-500">{new Date(invoice.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
