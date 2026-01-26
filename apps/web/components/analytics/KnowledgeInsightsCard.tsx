'use client';

import { useEffect, useState } from 'react';
import {
  TrendingUp,
  Lightbulb,
  Trophy,
  Calendar,
  Tag,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getKnowledgeInsightsAction } from '@/app/actions/analytics';
import type { KnowledgeInsight } from '@/types/analytics';

const ICON_MAP: Record<KnowledgeInsight['icon'], LucideIcon> = {
  'trending-up': TrendingUp,
  lightbulb: Lightbulb,
  trophy: Trophy,
  calendar: Calendar,
  tag: Tag,
  zap: Zap,
};

const TYPE_STYLES: Record<KnowledgeInsight['type'], { bg: string; border: string; icon: string }> = {
  pattern: {
    bg: 'bg-blue-50 dark:bg-blue-950',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  suggestion: {
    bg: 'bg-amber-50 dark:bg-amber-950',
    border: 'border-amber-200 dark:border-amber-800',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  achievement: {
    bg: 'bg-green-50 dark:bg-green-950',
    border: 'border-green-200 dark:border-green-800',
    icon: 'text-green-600 dark:text-green-400',
  },
};

interface InsightItemProps {
  insight: KnowledgeInsight;
}

function InsightItem({ insight }: InsightItemProps) {
  const Icon = ICON_MAP[insight.icon];
  const styles = TYPE_STYLES[insight.type];

  return (
    <div
      className={`rounded-lg border p-4 ${styles.bg} ${styles.border}`}
      data-testid="insight-item"
    >
      <div className="flex gap-3">
        <div className={`mt-0.5 ${styles.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-medium">{insight.title}</h4>
          <p className="mt-1 text-sm text-muted-foreground">{insight.description}</p>
        </div>
      </div>
    </div>
  );
}

function InsightSkeleton() {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex gap-3">
        <Skeleton className="h-5 w-5" />
        <div className="flex-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-2 h-4 w-full" />
        </div>
      </div>
    </div>
  );
}

export function KnowledgeInsightsCard() {
  const [insights, setInsights] = useState<KnowledgeInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInsights() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getKnowledgeInsightsAction();
        if (result.success && result.data) {
          setInsights(result.data);
        } else {
          setError(result.message || 'Failed to load insights');
        }
      } catch {
        setError('Failed to load insights');
      } finally {
        setIsLoading(false);
      }
    }

    fetchInsights();
  }, []);

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm" data-testid="knowledge-insights-card">
      <h3 className="mb-4 text-lg font-semibold">Knowledge Insights</h3>

      {isLoading ? (
        <div className="space-y-3" data-testid="insights-loading">
          <InsightSkeleton />
          <InsightSkeleton />
          <InsightSkeleton />
        </div>
      ) : error ? (
        <div className="flex h-[200px] items-center justify-center text-destructive" data-testid="insights-error">
          {error}
        </div>
      ) : insights.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center text-muted-foreground" data-testid="insights-empty">
          No insights available yet
        </div>
      ) : (
        <div className="space-y-3" data-testid="insights-content">
          {insights.map((insight, index) => (
            <InsightItem key={`${insight.type}-${insight.title}-${index}`} insight={insight} />
          ))}
        </div>
      )}
    </div>
  );
}
