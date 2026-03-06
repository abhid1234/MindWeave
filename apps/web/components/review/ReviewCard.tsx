'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, SkipForward, ExternalLink } from 'lucide-react';
import type { ReviewQueueItem } from '@/app/actions/review';

interface ReviewCardProps {
  item: ReviewQueueItem;
  onRate?: (rating: 'again' | 'hard' | 'easy') => void;
  onMarkReviewed?: () => void;
  onDismissReminder?: () => void;
  onSnoozeReminder?: (duration: '1d' | '3d' | '7d') => void;
  onSkip?: () => void;
}

const SOURCE_COLORS: Record<string, string> = {
  flashcard: 'bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300',
  reminder: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  stale: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
  rediscovery: 'bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300',
};

export function ReviewCard({
  item,
  onRate,
  onMarkReviewed,
  onDismissReminder,
  onSnoozeReminder,
  onSkip,
}: ReviewCardProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="rounded-xl border bg-card p-6 shadow-soft">
      {/* Header with source label */}
      <div className="mb-4 flex items-center justify-between">
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${SOURCE_COLORS[item.source] ?? ''}`}>
          {item.label}
        </span>
        {item.contentType && (
          <span className="text-xs text-muted-foreground capitalize">{item.contentType}</span>
        )}
      </div>

      {/* Flashcard view */}
      {item.type === 'flashcard' && (
        <div>
          <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
          <div
            className="mb-4 cursor-pointer rounded-lg border bg-muted/50 p-4 transition-colors hover:bg-muted"
            onClick={() => setFlipped(!flipped)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setFlipped(!flipped);
              }
            }}
            aria-label={flipped ? 'Show question' : 'Flip to see answer'}
          >
            {!flipped ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Question</p>
                <p>{item.question}</p>
                <p className="mt-2 text-xs text-muted-foreground">Click to flip</p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Answer</p>
                <p>{item.answer}</p>
              </div>
            )}
          </div>
          {flipped && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onRate?.('again')} className="flex-1">
                Again
              </Button>
              <Button variant="outline" size="sm" onClick={() => onRate?.('hard')} className="flex-1">
                Hard
              </Button>
              <Button size="sm" onClick={() => onRate?.('easy')} className="flex-1">
                Easy
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Reminder view */}
      {item.type === 'reminder' && (
        <div>
          <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
          {item.body && (
            <p className="mb-4 line-clamp-4 text-sm text-muted-foreground">{item.body}</p>
          )}
          {item.tags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={onDismissReminder}>
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              Reviewed
            </Button>
            <Button variant="outline" size="sm" onClick={() => onSnoozeReminder?.('1d')}>
              Snooze 1d
            </Button>
            <Button variant="outline" size="sm" onClick={() => onSnoozeReminder?.('3d')}>
              Snooze 3d
            </Button>
            <Button variant="outline" size="sm" onClick={() => onSnoozeReminder?.('7d')}>
              Snooze 7d
            </Button>
          </div>
        </div>
      )}

      {/* Content view (stale/rediscovery) */}
      {item.type === 'content' && (
        <div>
          <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
          {item.body && (
            <p className="mb-4 line-clamp-4 text-sm text-muted-foreground">{item.body}</p>
          )}
          {item.tags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={onMarkReviewed}>
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              Mark Reviewed
            </Button>
            <Button variant="outline" size="sm" onClick={onSkip}>
              <SkipForward className="mr-1.5 h-3.5 w-3.5" />
              Skip
            </Button>
            <a
              href={`/dashboard/library?highlight=${item.contentId}`}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-all duration-200 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 text-xs"
            >
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Open
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
