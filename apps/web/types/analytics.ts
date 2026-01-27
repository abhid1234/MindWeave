/**
 * Analytics types for the dashboard
 */

/**
 * Overview statistics for the analytics dashboard
 */
export interface OverviewStats {
  totalItems: number;
  itemsThisMonth: number;
  totalCollections: number;
  totalTags: number;
}

/**
 * Content growth data point for time-series charts
 */
export interface ContentGrowthData {
  date: string;
  notes: number;
  links: number;
  files: number;
  total: number;
}

/**
 * Tag distribution data for pie charts
 */
export interface TagDistributionData {
  tag: string;
  count: number;
  percentage: number;
}

/**
 * Collection usage data for bar charts
 */
export interface CollectionUsageData {
  id: string;
  name: string;
  itemCount: number;
  color: string | null;
}

/**
 * AI-generated knowledge insight
 */
export interface KnowledgeInsight {
  type: 'pattern' | 'suggestion' | 'achievement' | 'connection' | 'gap';
  title: string;
  description: string;
  icon: 'trending-up' | 'lightbulb' | 'trophy' | 'calendar' | 'tag' | 'zap' | 'link' | 'pie-chart';
  relatedContentIds?: string[];
  confidence?: number;
}

/**
 * Period options for content growth chart
 */
export type GrowthPeriod = 'week' | 'month' | 'year';

/**
 * Result type for analytics actions
 */
export interface AnalyticsActionResult<T> {
  success: boolean;
  data?: T;
  message?: string;
}
