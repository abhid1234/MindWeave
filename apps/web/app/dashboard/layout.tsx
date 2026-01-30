import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import Header from '@/components/layout/header';
import Nav from '@/components/layout/nav';
import { BottomNav } from '@/components/layout/BottomNav';
import { CommandPalette } from '@/components/ui/command-palette';
import { ViewTransition } from '@/components/layout/ViewTransition';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ScrollToTop } from '@/components/layout/ScrollToTop';

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
      <div className="flex flex-1 relative">
        {/* Gradient mesh background */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-1/4 -left-1/4 h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl animate-drift" />
          <div className="absolute top-1/3 -right-1/4 h-[500px] w-[500px] rounded-full bg-purple-500/5 blur-3xl animate-drift drift-delay-1" />
          <div className="absolute -bottom-1/4 left-1/3 h-[550px] w-[550px] rounded-full bg-green-500/5 blur-3xl animate-drift drift-delay-2" />
        </div>
        <Nav />
        <main id="main-content" className="flex-1 overflow-y-auto p-4 pb-20 sm:p-6 lg:pb-6" tabIndex={-1}>
          <Breadcrumbs />
          {children}
        </main>
      </div>
      <BottomNav />
      <ScrollToTop />
      <CommandPalette />
      <ViewTransition />
    </div>
  );
}
