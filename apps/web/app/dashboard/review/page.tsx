'use client';

import { useState, useEffect, useCallback } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { getReviewQueueAction, markReviewedAction } from '@/app/actions/review';
import { rateFlashcardAction } from '@/app/actions/flashcards';
import { dismissReminderAction, snoozeReminderAction } from '@/app/actions/reminders';
import { ReviewCard } from '@/components/review/ReviewCard';
import { ReviewProgress } from '@/components/review/ReviewProgress';
import { ReviewComplete } from '@/components/review/ReviewComplete';
import { useToast } from '@/components/ui/toast';
import type { ReviewQueueItem } from '@/app/actions/review';

type PageState = 'loading' | 'reviewing' | 'complete';

export default function ReviewPage() {
  const [state, setState] = useState<PageState>('loading');
  const [queue, setQueue] = useState<ReviewQueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0);
  const { addToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    getReviewQueueAction().then((result) => {
      if (cancelled) return;
      if (result.success && result.queue.length > 0) {
        setQueue(result.queue);
        setState('reviewing');
      } else if (result.success) {
        setState('complete');
      } else {
        addToast({ variant: 'error', title: result.message ?? 'Failed to load queue' });
        setState('complete');
      }
    });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const advance = useCallback(() => {
    setReviewedCount((c) => c + 1);
    if (currentIndex + 1 >= queue.length) {
      setState('complete');
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, queue.length]);

  const skip = useCallback(() => {
    if (currentIndex + 1 >= queue.length) {
      setState('complete');
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, queue.length]);

  const handleRate = useCallback(async (rating: 'again' | 'hard' | 'easy') => {
    const item = queue[currentIndex];
    if (!item?.flashcardId) return;

    const result = await rateFlashcardAction({ cardId: item.flashcardId, rating });
    if (result.success) {
      await markReviewedAction(item.contentId);
      advance();
    } else {
      addToast({ variant: 'error', title: result.message });
    }
  }, [queue, currentIndex, advance, addToast]);

  const handleDismissReminder = useCallback(async () => {
    const item = queue[currentIndex];
    if (!item?.reminderId) return;

    const result = await dismissReminderAction(item.reminderId);
    if (result.success) {
      await markReviewedAction(item.contentId);
      advance();
    } else {
      addToast({ variant: 'error', title: result.message });
    }
  }, [queue, currentIndex, advance, addToast]);

  const handleSnoozeReminder = useCallback(async (duration: '1d' | '3d' | '7d') => {
    const item = queue[currentIndex];
    if (!item?.reminderId) return;

    const result = await snoozeReminderAction({ reminderId: item.reminderId, duration });
    if (result.success) {
      advance();
    } else {
      addToast({ variant: 'error', title: result.message });
    }
  }, [queue, currentIndex, advance, addToast]);

  const handleMarkReviewed = useCallback(async () => {
    const item = queue[currentIndex];
    if (!item) return;

    const result = await markReviewedAction(item.contentId);
    if (result.success) {
      advance();
    } else {
      addToast({ variant: 'error', title: result.message });
    }
  }, [queue, currentIndex, advance, addToast]);

  if (state === 'loading') {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-muted" />
        </div>
        <div className="rounded-xl border bg-card p-6">
          <div className="h-40 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <ClipboardCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Daily Review</h1>
          <p className="text-sm text-muted-foreground">Review your knowledge queue</p>
        </div>
      </div>

      {state === 'reviewing' && (
        <>
          <ReviewProgress current={reviewedCount} total={queue.length} />
          <ReviewCard
            item={queue[currentIndex]}
            onRate={handleRate}
            onMarkReviewed={handleMarkReviewed}
            onDismissReminder={handleDismissReminder}
            onSnoozeReminder={handleSnoozeReminder}
            onSkip={skip}
          />
        </>
      )}

      {state === 'complete' && (
        <ReviewComplete reviewedCount={reviewedCount} />
      )}
    </div>
  );
}
