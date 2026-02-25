'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { OverviewStats } from '@/components/analytics/OverviewStats';
import { KnowledgeInsightsCard } from '@/components/analytics/KnowledgeInsightsCard';
import { AnalyticsHeader } from '@/components/analytics/AnalyticsHeader';
import { exportAnalyticsAction } from '@/app/actions/analytics';
import { useToast } from '@/components/ui/toast';

const ContentGrowthChart = dynamic(
  () => import('@/components/analytics/ContentGrowthChart').then(m => ({ default: m.ContentGrowthChart })),
  { ssr: false, loading: () => <div className="h-[350px] animate-pulse rounded-lg bg-muted" /> }
);
const TagDistributionChart = dynamic(
  () => import('@/components/analytics/TagDistributionChart').then(m => ({ default: m.TagDistributionChart })),
  { ssr: false, loading: () => <div className="h-[350px] animate-pulse rounded-lg bg-muted" /> }
);
const CollectionUsageChart = dynamic(
  () => import('@/components/analytics/CollectionUsageChart').then(m => ({ default: m.CollectionUsageChart })),
  { ssr: false, loading: () => <div className="h-[350px] animate-pulse rounded-lg bg-muted" /> }
);
const StreakCard = dynamic(
  () => import('@/components/analytics/StreakCard').then(m => ({ default: m.StreakCard })),
  { ssr: false, loading: () => <div className="h-[200px] animate-pulse rounded-lg bg-muted" /> }
);
const ContentBreakdown = dynamic(
  () => import('@/components/analytics/ContentBreakdown').then(m => ({ default: m.ContentBreakdown })),
  { ssr: false, loading: () => <div className="h-[350px] animate-pulse rounded-lg bg-muted" /> }
);
const KnowledgeGaps = dynamic(
  () => import('@/components/analytics/KnowledgeGaps').then(m => ({ default: m.KnowledgeGaps })),
  { ssr: false, loading: () => <div className="h-[350px] animate-pulse rounded-lg bg-muted" /> }
);

export function AnalyticsPageContent() {
  const [isExporting, setIsExporting] = useState(false);
  const { addToast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await exportAnalyticsAction();

      if (result.success && result.data) {
        // Create and download JSON file
        const blob = new Blob([JSON.stringify(result.data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mindweave-analytics-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        addToast({
          title: 'Export complete',
          description: 'Your analytics data has been downloaded.',
          variant: 'success',
        });
      } else {
        addToast({
          title: 'Export failed',
          description: result.message || 'Could not export analytics data.',
          variant: 'error',
        });
      }
    } catch {
      addToast({
        title: 'Export failed',
        description: 'An unexpected error occurred.',
        variant: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="animate-fade-up" style={{ animationFillMode: 'backwards' }}>
        <AnalyticsHeader onExport={handleExport} isExporting={isExporting} />
      </div>

      <div className="animate-fade-up" style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}>
        <OverviewStats />
      </div>

      <div className="animate-fade-up" style={{ animationDelay: '112ms', animationFillMode: 'backwards' }}>
        <StreakCard />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 animate-fade-up" style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}>
        <ContentGrowthChart initialPeriod="month" />
        <TagDistributionChart />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 animate-fade-up" style={{ animationDelay: '225ms', animationFillMode: 'backwards' }}>
        <CollectionUsageChart />
        <KnowledgeInsightsCard />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 animate-fade-up" style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}>
        <ContentBreakdown />
        <KnowledgeGaps />
      </div>
    </div>
  );
}
