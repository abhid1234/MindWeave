import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { FeedbackTable } from '@/components/admin/FeedbackTable';
import { getAdminFeedbackAction } from '@/app/actions/feedback';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

export default async function AdminFeedbackPage() {
  const session = await auth();

  if (!session?.user?.id || !session.user.email || !ADMIN_EMAILS.includes(session.user.email)) {
    redirect('/dashboard');
  }

  const result = await getAdminFeedbackAction();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Feedback Management</h1>
        <p className="text-muted-foreground">Review and manage user feedback</p>
      </div>
      <FeedbackTable initialItems={result.success ? result.items : []} />
    </div>
  );
}
