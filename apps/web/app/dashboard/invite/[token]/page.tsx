import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AcceptInvitationClient } from './AcceptInvitationClient';

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const session = await auth();
  const { token } = await params;

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/dashboard/invite/${token}`);
  }

  return <AcceptInvitationClient token={token} />;
}
