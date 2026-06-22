import { redirect } from 'next/navigation';

export default function QuoteShortLink({ params }: { params: { token: string } }) {
  redirect(`/quote/${params.token}`);
}
