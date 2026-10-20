import { redirect } from 'next/navigation';

export default function ContractShortLink({ params }: { params: { token: string } }) {
  redirect(`/contract/${params.token}`);
}
