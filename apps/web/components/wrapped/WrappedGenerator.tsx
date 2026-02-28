'use client';

import { useState, useTransition } from 'react';
import { Gift, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { generateWrappedAction } from '@/app/actions/wrapped';
import { WrappedStoryView } from './WrappedStoryView';
import { WrappedShareButton } from './WrappedShareButton';
import type { WrappedStats } from '@/types/wrapped';

interface WrappedGeneratorProps {
  existingStats?: WrappedStats | null;
  existingShareId?: string | null;
}

export function WrappedGenerator({ existingStats, existingShareId }: WrappedGeneratorProps) {
  const [stats, setStats] = useState<WrappedStats | null>(existingStats ?? null);
  const [shareId, setShareId] = useState<string | null>(existingShareId ?? null);
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateWrappedAction();

      if (result.success && result.data) {
        setStats(result.data.stats);
        setShareId(result.data.shareId);
        addToast({ title: 'Your Knowledge Wrapped is ready!', variant: 'success' });
      } else {
        addToast({ title: result.message || 'Failed to generate', variant: 'error' });
      }
    });
  }

  if (stats && shareId) {
    return (
      <div className="space-y-6">
        <WrappedStoryView stats={stats} />
        <div className="flex flex-col items-center gap-4">
          <WrappedShareButton shareId={shareId} />
          <button
            onClick={handleGenerate}
            disabled={isPending}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isPending ? 'Regenerating...' : 'Regenerate'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 py-12">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600">
        <Gift className="h-10 w-10 text-white" />
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-bold">Your Knowledge Wrapped</h2>
        <p className="mt-2 text-muted-foreground max-w-md">
          Get a beautiful summary of your knowledge base activity. See your stats, top topics, streaks, and AI-generated personality.
        </p>
      </div>
      <button
        onClick={handleGenerate}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {isPending ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate My Wrapped
          </>
        )}
      </button>
    </div>
  );
}
