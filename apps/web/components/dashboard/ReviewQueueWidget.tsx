'use client';

import { useState, useEffect } from 'react';
import { ClipboardCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getReviewQueueAction } from '@/app/actions/review';

export function ReviewQueueWidget() {
  const [count, setCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getReviewQueueAction()
      .then((result) => {
        if (cancelled) return;
        if (result.success) {
          setCount(result.queue.length);
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="h-14 animate-pulse rounded-xl border bg-muted" />
    );
  }

  if (count === null || count === 0) {
    return null;
  }

  return (
    <Link
      href="/dashboard/review"
      className="group flex items-center gap-3 rounded-xl border bg-card p-3 transition-all duration-200 hover:shadow-soft-md hover:-translate-y-0.5 hover:border-primary/30"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <ClipboardCheck className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          {count} {count === 1 ? 'item' : 'items'} to review
        </p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
    </Link>
  );
}
