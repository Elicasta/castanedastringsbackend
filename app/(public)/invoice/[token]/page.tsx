import { notFound } from 'next/navigation';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import InvoicePaymentActions from '@/components/public/InvoicePaymentActions';

export default async function PublicInvoicePage({ params }: { params: { token: string } }) {
  const supabase = createServiceRoleClient();

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, studios(zelle_instructions)')
    .eq('public_token', params.token)
    .single();

  if (!invoice) notFound();

  const studio = invoice.studios as any;
  const isPaid = invoice.payment_status === 'paid';

  if (invoice.payment_status === 'sent') {
    await supabase.from('invoices').update({ payment_status: 'viewed' }).eq('id', invoice.id);
  }

  return (
    <section className="min-h-screen px-6 py-20">
      <div className="max-w-lg mx-auto">
        <p className="label-text text-center mb-3">EC Creative Studios</p>
        <h1 className="display-text text-4xl md:text-5xl text-matte-dark text-center mb-2">{invoice.title}</h1>
        <p className="body-text text-center mb-12">Invoice {invoice.invoice_number}</p>

        <div className="vision-card p-8 rounded-sm mb-8">
          <div className="flex justify-between text-sm mb-3" style={{ fontFamily: "'Jost',sans-serif" }}>
            <span className="text-stone">Total</span>
            <span className="text-matte-dark">${Number(invoice.total).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm mb-3" style={{ fontFamily: "'Jost',sans-serif" }}>
            <span className="text-stone">Paid</span>
            <span className="text-matte-dark">${Number(invoice.amount_paid).toLocaleString()}</span>
          </div>
          <div className="flex justify-between pt-4 mt-2 border-t border-stone/10">
            <p className="display-text text-xl text-matte-dark">Balance due</p>
            <p className="display-text text-2xl text-matte-dark">${Number(invoice.balance_due).toLocaleString()}</p>
          </div>
        </div>

        {isPaid ? (
          <p className="display-text text-2xl text-matte-dark text-center">Paid in full. Thank you.</p>
        ) : (
          <InvoicePaymentActions token={params.token} zelleInstructions={studio?.zelle_instructions ?? null} />
        )}
      </div>
    </section>
  );
}
