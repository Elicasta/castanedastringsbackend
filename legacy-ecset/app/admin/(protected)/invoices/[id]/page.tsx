import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { sendInvoice } from '@/lib/server-actions/invoices';
import AdminZelleConfirm from '@/components/admin/AdminZelleConfirm';

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-neutral-100 text-neutral-700',
  sent: 'bg-blue-50 text-blue-700',
  viewed: 'bg-blue-50 text-blue-700',
  payment_pending: 'bg-amber-50 text-amber-700',
  paid: 'bg-green-50 text-green-700',
  past_due: 'bg-red-50 text-red-700',
};

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient();

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, clients(first_name, last_name, email)')
    .eq('id', params.id)
    .single();

  if (!invoice) notFound();

  const client = invoice.clients as any;
  const needsZelleConfirmation = invoice.zelle_reference && invoice.payment_status !== 'paid';

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">{invoice.invoice_number} — {invoice.title}</h1>
          <p className="text-sm text-neutral-500">{client.first_name} {client.last_name} · {client.email}</p>
        </div>
        {invoice.payment_status === 'draft' ? (
          <form action={sendInvoice.bind(null, invoice.id)}>
            <button type="submit" className="text-sm rounded-md bg-neutral-900 text-white px-4 py-2">
              Send invoice
            </button>
          </form>
        ) : (
          <span className={`text-xs px-3 py-1.5 rounded-full ${STATUS_STYLES[invoice.payment_status] ?? 'bg-neutral-100 text-neutral-700'}`}>
            {invoice.payment_status.replace('_', ' ')}
          </span>
        )}
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-6 mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-neutral-500">Total</span>
          <span className="text-neutral-900 font-medium">${Number(invoice.total).toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-neutral-500">Paid</span>
          <span className="text-neutral-900 font-medium">${Number(invoice.amount_paid).toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm pt-2 border-t border-neutral-100">
          <span className="text-neutral-500">Balance due</span>
          <span className="text-neutral-900 font-semibold">${Number(invoice.balance_due).toLocaleString()}</span>
        </div>
        {invoice.payment_method && (
          <p className="text-xs text-neutral-400 mt-3">Paid via {invoice.payment_method}{invoice.paid_at ? ` on ${new Date(invoice.paid_at).toLocaleDateString()}` : ''}</p>
        )}
      </div>

      {needsZelleConfirmation && (
        <div className="mb-4">
          <AdminZelleConfirm invoiceId={invoice.id} prefillReference={invoice.zelle_reference} />
        </div>
      )}

      {invoice.payment_status !== 'draft' && (
        <p className="text-xs text-neutral-400">
          Public link: {process.env.NEXT_PUBLIC_SITE_URL}/invoice/{invoice.public_token}
        </p>
      )}
    </div>
  );
}
