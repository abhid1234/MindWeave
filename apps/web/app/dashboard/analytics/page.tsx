import {
  OverviewStats,
  ContentGrowthChart,
  TagDistributionChart,
  CollectionUsageChart,
  KnowledgeInsightsCard,
} from '@/components/analytics';

export const metadata = {
  title: 'Analytics | Mindweave',
  description: 'View insights and statistics about your knowledge base',
};

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="mt-2 text-muted-foreground">
          Insights and statistics about your knowledge base
        </p>
      </div>

      <OverviewStats />

      <div className="grid gap-6 lg:grid-cols-2">
        <ContentGrowthChart initialPeriod="month" />
        <TagDistributionChart />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CollectionUsageChart />
        <KnowledgeInsightsCard />
      </div>
    </div>
  );
}
