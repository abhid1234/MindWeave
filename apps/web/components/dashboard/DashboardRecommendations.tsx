'use client';

import { useState, useEffect } from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { RecommendationCard } from '@/components/library/RecommendationCard';
import { getDashboardRecommendationsAction } from '@/app/actions/search';
import type { RecommendationResult } from '@/app/actions/search';

function LoadingSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="dashboard-recommendations-loading">
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
      className="rounded-lg border border-dashed p-8 text-center"
      data-testid="dashboard-recommendations-empty"
    >
      <Sparkles className="mx-auto h-8 w-8 text-muted-foreground mb-2" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">
        Add more content to see personalized recommendations
      </p>
      <Link
        href="/dashboard/capture"
        className="mt-3 inline-block text-sm text-primary hover:underline"
      >
        Capture something new
      </Link>
    </div>
  );
}

function ErrorState() {
  return (
    <div
      className="rounded-lg border border-red-200 bg-red-50 p-4 text-center"
      data-testid="dashboard-recommendations-error"
      role="alert"
    >
      <AlertCircle className="mx-auto h-6 w-6 text-red-500 mb-2" aria-hidden="true" />
      <p className="text-sm text-red-600">Failed to load recommendations</p>
    </div>
  );
}

export function DashboardRecommendations() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);

  useEffect(() => {
    let isMounted = true;

    getDashboardRecommendationsAction()
      .then((result) => {
        if (!isMounted) return;
        if (result.success) {
          setRecommendations(result.recommendations);
        } else {
          setError(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError(true);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCardClick = (id: string) => {
    window.location.href = `/dashboard/library?highlight=${id}`;
  };

  // Don't render the section if there's nothing to show
  if (!isLoading && !error && recommendations.length === 0) {
    return null;
  }

  return (
    <section className="mt-8" aria-labelledby="recommendations-heading">
      <div className="mb-4 flex items-center justify-between">
        <h2 id="recommendations-heading" className="text-xl font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
          Recommended for You
        </h2>
        {recommendations.length > 0 && (
          <Link
            href="/dashboard/library"
            className="text-sm text-primary hover:underline"
          >
            View Library
          </Link>
        )}
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState />
      ) : recommendations.length === 0 ? (
        <EmptyState />
      ) : (
        <div
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          data-testid="dashboard-recommendations-list"
        >
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
    </section>
  );
}
