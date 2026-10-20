import { redirect } from 'next/navigation';

export default function InvoiceShortLink({ params }: { params: { token: string } }) {
  redirect(`/invoice/${params.token}`);
}
