'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getKnowledgeGapsAction } from '@/app/actions/analytics';
import type { KnowledgeGap } from '@/types/analytics';

export function KnowledgeGaps() {
  const [gaps, setGaps] = useState<KnowledgeGap[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const result = await getKnowledgeGapsAction();
        if (result.success && result.data) {
          setGaps(result.data);
        }
      } catch {
        // Silently fail
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) {
    return <div className="h-[350px] animate-pulse rounded-lg bg-muted" data-testid="knowledge-gaps-skeleton" />;
  }

  if (!gaps) return null;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sparse = gaps.filter((g) => g.count < 3);
  const stale = gaps.filter((g) => new Date(g.lastAdded) < thirtyDaysAgo);

  const formatDate = (d: Date) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Knowledge Gaps
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sparse.length === 0 && stale.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No knowledge gaps detected. Great job!
          </p>
        ) : (
          <div className="space-y-4">
            {sparse.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2">
                  Sparse Topics ({sparse.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {sparse.map((gap) => (
                    <span
                      key={`sparse-${gap.tag}`}
                      className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs dark:border-amber-800 dark:bg-amber-950/30"
                    >
                      {gap.tag}
                      <span className="text-[10px] text-muted-foreground">
                        ({gap.count})
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {stale.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Stale Topics ({stale.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {stale.map((gap) => (
                    <span
                      key={`stale-${gap.tag}`}
                      className="inline-flex items-center gap-1 rounded-full border border-muted bg-muted/50 px-2.5 py-1 text-xs"
                    >
                      {gap.tag}
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(gap.lastAdded)}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Link
              href="/dashboard/capture?template=learning-journal"
              className="inline-flex items-center text-xs text-primary hover:underline"
            >
              Capture more knowledge →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
