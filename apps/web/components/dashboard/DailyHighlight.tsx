'use client';

import { useState, useEffect } from 'react';
import { Lightbulb, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getDailyHighlightAction, dismissHighlightAction } from '@/app/actions/highlights';
import { Button } from '@/components/ui/button';

type Highlight = {
  contentId: string;
  title: string;
  type: string;
  insight: string;
  tags: string[];
};

export function DailyHighlight() {
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getDailyHighlightAction().then((result) => {
      if (cancelled) return;
      if (result.success && result.highlight) {
        setHighlight(result.highlight);
      }
      setIsLoading(false);
    }).catch(() => {
      if (!cancelled) setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const handleDismiss = async () => {
    if (!highlight) return;
    setIsDismissed(true);
    await dismissHighlightAction(highlight.contentId).catch(() => {});
  };

  if (isLoading) {
    return (
      <div className="h-28 animate-pulse rounded-xl border bg-muted" />
    );
  }

  if (!highlight || isDismissed) {
    return null;
  }

  return (
    <div className="relative rounded-xl border bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-4 shadow-soft">
      <Button
        variant="ghost"
        size="sm"
        className="absolute right-2 top-2 h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
        onClick={handleDismiss}
        aria-label="Dismiss highlight"
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="flex items-start gap-3 pr-6">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
          <Lightbulb className="h-5 w-5 text-amber-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">
            Worth Revisiting
          </p>
          <h3 className="text-sm font-semibold line-clamp-1">{highlight.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {highlight.insight}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
              highlight.type === 'note'
                ? 'bg-note/10 text-note'
                : highlight.type === 'link'
                  ? 'bg-link/10 text-link'
                  : 'bg-file/10 text-file'
            }`}>
              {highlight.type}
            </span>
            <Link
              href={`/dashboard/library?highlight=${highlight.contentId}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
