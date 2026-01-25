import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
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

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={session.user} />
      <div className="flex flex-1">
        <Nav />
        <main id="main-content" className="flex-1 overflow-y-auto p-6" tabIndex={-1}>{children}</main>
      </div>
    </div>
  );
}
