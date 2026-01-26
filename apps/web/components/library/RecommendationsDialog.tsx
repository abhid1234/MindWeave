'use client';

import { useState, useEffect } from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { RecommendationCard } from './RecommendationCard';
import { getRecommendationsAction } from '@/app/actions/search';
import type { RecommendationResult } from '@/app/actions/search';

export type RecommendationsDialogProps = {
  contentId: string;
  contentTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function LoadingSkeleton() {
  return (
    <div className="space-y-3" data-testid="recommendations-loading">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border p-3">
          <div className="flex items-start gap-3">
            <Skeleton className="h-4 w-4 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <Skeleton className="h-3 w-full mt-2" />
              <Skeleton className="h-3 w-2/3 mt-1" />
              <div className="flex gap-1 mt-2">
                <Skeleton className="h-5 w-12 rounded" />
                <Skeleton className="h-5 w-16 rounded" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center py-8 text-center"
      data-testid="recommendations-empty"
    >
      <Sparkles className="h-10 w-10 text-muted-foreground mb-3" aria-hidden="true" />
      <h4 className="font-medium text-sm">No similar content found</h4>
      <p className="text-sm text-muted-foreground mt-1">
        Try adding more content to your knowledge base to see recommendations.
      </p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-8 text-center"
      data-testid="recommendations-error"
      role="alert"
    >
      <AlertCircle className="h-10 w-10 text-red-500 mb-3" aria-hidden="true" />
      <h4 className="font-medium text-sm text-red-600">Failed to load recommendations</h4>
      <p className="text-sm text-muted-foreground mt-1">{message}</p>
    </div>
  );
}

export function RecommendationsDialog({
  contentId,
  contentTitle,
  open,
  onOpenChange,
}: RecommendationsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);

  useEffect(() => {
    if (open && contentId) {
      setIsLoading(true);
      setError(null);
      setRecommendations([]);

      getRecommendationsAction(contentId, 5, 0.5)
        .then((result) => {
          if (result.success) {
            setRecommendations(result.recommendations);
          } else {
            setError(result.message || 'Failed to load recommendations');
          }
        })
        .catch(() => {
          setError('An unexpected error occurred');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, contentId]);

  const handleCardClick = (id: string) => {
    // Navigate to the content item
    window.location.href = `/dashboard/library?highlight=${id}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
            Similar Content
          </DialogTitle>
          <DialogDescription className="truncate">
            Content similar to &quot;{contentTitle}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {isLoading ? (
            <LoadingSkeleton />
          ) : error ? (
            <ErrorState message={error} />
          ) : recommendations.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-2" data-testid="recommendations-list">
              {recommendations.map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  id={rec.id}
                  title={rec.title}
                  type={rec.type}
                  body={rec.body}
                  tags={[...rec.tags, ...rec.autoTags]}
                  similarity={rec.similarity}
                  onClick={() => handleCardClick(rec.id)}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
