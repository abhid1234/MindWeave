import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import Header from '@/components/layout/header';
import Nav from '@/components/layout/nav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Check onboarding status
  if (session.user.id) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { onboardingCompleted: true },
    });
    if (user && !user.onboardingCompleted) {
      redirect('/onboarding');
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={session.user} />
      <div className="flex flex-1">
        <Nav />
        <main id="main-content" className="flex-1 overflow-y-auto p-4 sm:p-6" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
