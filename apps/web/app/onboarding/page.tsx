import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import OnboardingFlow from '@/components/onboarding/OnboardingFlow';

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { onboardingCompleted: true, onboardingStep: true },
  });

  if (user?.onboardingCompleted) {
    redirect('/dashboard');
  }

  return <OnboardingFlow initialStep={user?.onboardingStep ?? 0} />;
}
