'use client';

import { useState, useTransition } from 'react';
import { Calendar, Sparkles, Copy, Check } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { generateWeeklyBriefingAction } from '@/app/actions/weekly-briefing';

interface WeeklyBriefingButtonProps {
  onGenerated?: (postContent: string) => void;
}

export function WeeklyBriefingButton({ onGenerated }: WeeklyBriefingButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ postContent: string; themes: string[] } | null>(null);
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  function handleGenerate() {
    startTransition(async () => {
      const res = await generateWeeklyBriefingAction();
      if (res.success && res.data) {
        setResult({ postContent: res.data.postContent, themes: res.data.themes });
        onGenerated?.(res.data.postContent);
        addToast({ title: 'Weekly briefing generated!', variant: 'success' });
      } else {
        addToast({ title: res.message || 'Failed to generate', variant: 'error' });
      }
    });
  }

  async function handleCopy() {
    if (result) {
      await navigator.clipboard.writeText(result.postContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (result) {
    return (
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Calendar className="h-4 w-4" />
            This Week&apos;s Briefing
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-medium hover:bg-accent"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleGenerate}
              disabled={isPending}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Regenerate
            </button>
          </div>
        </div>
        {result.themes.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {result.themes.map((theme) => (
              <span key={theme} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                {theme}
              </span>
            ))}
          </div>
        )}
        <p className="text-sm text-foreground whitespace-pre-line line-clamp-6">{result.postContent}</p>
      </div>
    );
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={isPending}
      className="w-full rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 text-left transition-colors hover:border-primary/50 hover:bg-primary/10 disabled:opacity-50"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          {isPending ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          ) : (
            <Sparkles className="h-5 w-5 text-primary" />
          )}
        </div>
        <div>
          <p className="font-medium text-sm">
            {isPending ? 'Generating weekly briefing...' : 'Auto-generate from this week'}
          </p>
          <p className="text-xs text-muted-foreground">
            Create a &ldquo;This Week I Learned&rdquo; LinkedIn post from your recent captures
          </p>
        </div>
      </div>
    </button>
  );
}
