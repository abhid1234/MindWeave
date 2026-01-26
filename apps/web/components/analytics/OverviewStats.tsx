'use client';

import { useEffect, useState } from 'react';
import { FileText, Calendar, FolderOpen, Tag } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getOverviewStatsAction } from '@/app/actions/analytics';
import type { OverviewStats as OverviewStatsType } from '@/types/analytics';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  description?: string;
}

function StatCard({ title, value, icon, description }: StatCardProps) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="text-muted-foreground">{icon}</div>
      </div>
      <div className="mt-2">
        <p className="text-3xl font-bold">{value.toLocaleString()}</p>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-4" />
      </div>
      <div className="mt-2">
        <Skeleton className="h-9 w-16" />
        <Skeleton className="mt-1 h-3 w-24" />
      </div>
    </div>
  );
}

export function OverviewStats() {
  const [stats, setStats] = useState<OverviewStatsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getOverviewStatsAction();
        if (result.success && result.data) {
          setStats(result.data);
        } else {
          setError(result.message || 'Failed to load stats');
        }
      } catch {
        setError('Failed to load stats');
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-testid="overview-stats-loading">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center text-destructive" data-testid="overview-stats-error">
        {error}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-testid="overview-stats">
      <StatCard
        title="Total Items"
        value={stats.totalItems}
        icon={<FileText className="h-4 w-4" />}
        description="Notes, links & files"
      />
      <StatCard
        title="This Month"
        value={stats.itemsThisMonth}
        icon={<Calendar className="h-4 w-4" />}
        description="Items added this month"
      />
      <StatCard
        title="Collections"
        value={stats.totalCollections}
        icon={<FolderOpen className="h-4 w-4" />}
        description="Organized groups"
      />
      <StatCard
        title="Tags"
        value={stats.totalTags}
        icon={<Tag className="h-4 w-4" />}
        description="Unique tags used"
      />
    </div>
  );
}
