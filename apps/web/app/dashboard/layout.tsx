import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import Header from '@/components/layout/header';
import Nav from '@/components/layout/nav';
import { BottomNav } from '@/components/layout/BottomNav';
import { CommandPalette } from '@/components/ui/command-palette';
import { KeyboardShortcutsProvider } from '@/components/keyboard-shortcuts-provider';
import { ViewTransition } from '@/components/layout/ViewTransition';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { FeedbackWidget } from '@/components/feedback/FeedbackWidget';
import { QuickCaptureDialog } from '@/components/layout/QuickCaptureDialog';
import { BadgeUnlockToast } from '@/components/badges/BadgeUnlockToast';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
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
      <div className="relative flex flex-1">
        {/* Gradient mesh background */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <div className="bg-primary/[0.07] animate-drift absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full blur-3xl" />
          <div className="bg-file/[0.06] animate-drift drift-delay-1 absolute -right-1/4 top-1/3 h-[500px] w-[500px] rounded-full blur-3xl" />
          <div className="bg-link/[0.05] animate-drift drift-delay-2 absolute -bottom-1/4 left-1/3 h-[550px] w-[550px] rounded-full blur-3xl" />
        </div>
        <Nav />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto p-4 pb-24 sm:p-6 lg:pb-6"
          tabIndex={-1}
        >
          <Breadcrumbs />
          {children}
        </main>
      </div>
      <BottomNav />
      <ScrollToTop />
      <CommandPalette />
      <KeyboardShortcutsProvider />
      <ViewTransition />
      <FeedbackWidget />
      <QuickCaptureDialog />
      <BadgeUnlockToast />
    </div>
  );
}
