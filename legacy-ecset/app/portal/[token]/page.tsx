import { redirect } from 'next/navigation';

export default function PortalShortLink({ params }: { params: { token: string } }) {
  redirect(`/client/${params.token}`);
}
