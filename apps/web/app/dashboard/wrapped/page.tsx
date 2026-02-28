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

      {/* How it works */}
      <div className="mb-6 animate-fade-up rounded-lg border border-border bg-muted/40 px-5 py-4 text-sm text-muted-foreground" style={{ animationDelay: '50ms', animationFillMode: 'backwards' }}>
        <p className="mb-2 font-medium text-foreground">How it works</p>
        <p>
          Knowledge Wrapped analyzes everything you&apos;ve saved — notes, links, and files — to create a
          personalized summary of your knowledge journey. You&apos;ll see your top topics, capture streaks,
          and an AI-generated &quot;knowledge personality.&quot; Hit <span className="font-medium text-foreground">Generate</span> to
          create yours, then share it on LinkedIn to show the world what you&apos;ve been learning.
        </p>
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
