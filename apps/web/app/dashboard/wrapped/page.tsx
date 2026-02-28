import type { Metadata } from 'next';
import { Gift } from 'lucide-react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { WrappedGenerator } from '@/components/wrapped/WrappedGenerator';
import { getLatestWrappedAction } from '@/app/actions/wrapped';

export const metadata: Metadata = {
  title: 'Knowledge Wrapped | Mindweave',
  description: 'See your personalized knowledge base summary',
};

export default async function WrappedPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Fetch existing wrapped if available
  const latest = await getLatestWrappedAction();

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Gift className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Knowledge Wrapped</h1>
            <p className="text-muted-foreground">
              Your personalized knowledge base summary
            </p>
          </div>
        </div>
      </div>

      {/* Generator */}
      <div className="animate-fade-up" style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}>
        <WrappedGenerator
          existingStats={latest.data?.stats}
          existingShareId={latest.data?.shareId}
        />
      </div>
    </div>
  );
}
