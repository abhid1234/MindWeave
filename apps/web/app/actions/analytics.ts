'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { content, collections, contentCollections } from '@/lib/db/schema';
import { eq, sql, gte, and, count } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { unstable_cache } from 'next/cache';
import { checkServerActionRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import type {
  OverviewStats,
  ContentGrowthData,
  TagDistributionData,
  CollectionUsageData,
  KnowledgeInsight,
  GrowthPeriod,
  AnalyticsActionResult,
} from '@/types/analytics';
import { CacheDuration, CacheTags } from '@/lib/cache';
import { extractInsights } from '@/lib/ai/insights';

/**
 * Invalidate analytics cache - call this when content changes
 */
export async function invalidateAnalyticsCache() {
  revalidateTag(CacheTags.ANALYTICS);
}

// Cached internal function for overview stats
const getCachedOverviewStats = unstable_cache(
  async (userId: string): Promise<OverviewStats> => {
    // Get total items count
    const [totalResult] = await db
      .select({ count: count() })
      .from(content)
      .where(eq(content.userId, userId));

    // Get items created this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [thisMonthResult] = await db
      .select({ count: count() })
      .from(content)
      .where(
        and(
          eq(content.userId, userId),
          gte(content.createdAt, startOfMonth)
        )
      );

    // Get total collections count
    const [collectionsResult] = await db
      .select({ count: count() })
      .from(collections)
      .where(eq(collections.userId, userId));

    // Get unique tags count using subquery
    const tagsResult = await db.execute<{ tag_count: string }>(sql`
      SELECT COUNT(DISTINCT tag) as tag_count
      FROM (
        SELECT UNNEST(tags || auto_tags) as tag
        FROM ${content}
        WHERE user_id = ${userId}
      ) as all_tags
      WHERE tag IS NOT NULL AND tag != ''
    `);

    const tagCountRow = (tagsResult as unknown as { tag_count: string }[])[0];
    const uniqueTagCount = tagCountRow ? parseInt(tagCountRow.tag_count, 10) : 0;

    return {
      totalItems: totalResult.count,
      itemsThisMonth: thisMonthResult.count,
      totalCollections: collectionsResult.count,
      totalTags: uniqueTagCount,
    };
  },
  ['analytics', 'overview'],
  { revalidate: CacheDuration.MEDIUM, tags: [CacheTags.ANALYTICS] }
);

/**
 * Get overview stats for the analytics dashboard
 */
export async function getOverviewStatsAction(): Promise<AnalyticsActionResult<OverviewStats>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const data = await getCachedOverviewStats(session.user.id);

    return { success: true, data };
  } catch (error) {
    console.error('Error getting overview stats:', error);
    return { success: false, message: 'Failed to fetch overview stats' };
  }
}

/**
 * Get content growth data for time-series charts
 */
export async function getContentGrowthAction(
  period: GrowthPeriod = 'month'
): Promise<AnalyticsActionResult<ContentGrowthData[]>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    // Convert dates to ISO strings for SQL
    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();

    // Query content grouped by date and type
    // Use different SQL based on period to avoid parameterized format string issues
    let result: unknown[];

    if (period === 'year') {
      result = await db.execute<{
        date: string;
        type: string;
        count: string;
      }>(sql`
        SELECT
          TO_CHAR(created_at, 'YYYY-MM') as date,
          type,
          COUNT(*) as count
        FROM ${content}
        WHERE user_id = ${session.user.id}
          AND created_at >= ${startDateStr}::timestamp
          AND created_at <= ${endDateStr}::timestamp
        GROUP BY TO_CHAR(created_at, 'YYYY-MM'), type
        ORDER BY date ASC
      `);
    } else {
      result = await db.execute<{
        date: string;
        type: string;
        count: string;
      }>(sql`
        SELECT
          TO_CHAR(created_at, 'YYYY-MM-DD') as date,
          type,
          COUNT(*) as count
        FROM ${content}
        WHERE user_id = ${session.user.id}
          AND created_at >= ${startDateStr}::timestamp
          AND created_at <= ${endDateStr}::timestamp
        GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD'), type
        ORDER BY date ASC
      `);
    }

    // Process results into the expected format
    const dataMap = new Map<string, ContentGrowthData>();
    const rows = result as unknown as { date: string; type: string; count: string }[];

    rows.forEach((row) => {
      if (!dataMap.has(row.date)) {
        dataMap.set(row.date, {
          date: row.date,
          notes: 0,
          links: 0,
          files: 0,
          total: 0,
        });
      }

      const entry = dataMap.get(row.date)!;
      const countNum = parseInt(row.count, 10);

      switch (row.type) {
        case 'note':
          entry.notes = countNum;
          break;
        case 'link':
          entry.links = countNum;
          break;
        case 'file':
          entry.files = countNum;
          break;
      }
      entry.total = entry.notes + entry.links + entry.files;
    });

    // Fill in missing dates with zero values
    const data: ContentGrowthData[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr =
        period === 'year'
          ? currentDate.toISOString().slice(0, 7)
          : currentDate.toISOString().slice(0, 10);

      if (dataMap.has(dateStr)) {
        data.push(dataMap.get(dateStr)!);
      } else {
        data.push({
          date: dateStr,
          notes: 0,
          links: 0,
          files: 0,
          total: 0,
        });
      }

      if (period === 'year') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error getting content growth data:', error);
    return { success: false, message: 'Failed to fetch content growth data' };
  }
}

// Cached internal function for tag distribution
const getCachedTagDistribution = unstable_cache(
  async (userId: string): Promise<TagDistributionData[]> => {
    // Get tag counts using SQL (case-insensitive grouping)
    const result = await db.execute<{ tag: string; count: string }>(sql`
      SELECT LOWER(tag) as tag, COUNT(*) as count
      FROM (
        SELECT UNNEST(tags || auto_tags) as tag
        FROM ${content}
        WHERE user_id = ${userId}
      ) as all_tags
      WHERE tag IS NOT NULL AND tag != ''
      GROUP BY LOWER(tag)
      ORDER BY count DESC
      LIMIT 10
    `);

    const rows = result as unknown as { tag: string; count: string }[];

    // Calculate total for percentages
    const total = rows.reduce((sum, row) => sum + parseInt(row.count, 10), 0);

    return rows.map((row) => ({
      tag: row.tag,
      count: parseInt(row.count, 10),
      percentage: total > 0 ? Math.round((parseInt(row.count, 10) / total) * 100) : 0,
    }));
  },
  ['analytics', 'tags'],
  { revalidate: CacheDuration.LONG, tags: [CacheTags.ANALYTICS] }
);

/**
 * Get tag distribution data for pie charts
 */
export async function getTagDistributionAction(): Promise<
  AnalyticsActionResult<TagDistributionData[]>
> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const data = await getCachedTagDistribution(session.user.id);

    return { success: true, data };
  } catch (error) {
    console.error('Error getting tag distribution:', error);
    return { success: false, message: 'Failed to fetch tag distribution' };
  }
}

// Cached internal function for collection usage (with N+1 fix using JOIN)
const getCachedCollectionUsage = unstable_cache(
  async (userId: string): Promise<CollectionUsageData[]> => {
    // Single query with LEFT JOIN and COUNT to avoid N+1 problem
    const result = await db
      .select({
        id: collections.id,
        name: collections.name,
        color: collections.color,
        itemCount: sql<number>`cast(count(${contentCollections.contentId}) as int)`,
      })
      .from(collections)
      .leftJoin(
        contentCollections,
        eq(collections.id, contentCollections.collectionId)
      )
      .where(eq(collections.userId, userId))
      .groupBy(collections.id)
      .orderBy(sql`count(${contentCollections.contentId}) DESC`);

    return result;
  },
  ['analytics', 'collections'],
  { revalidate: CacheDuration.LONG, tags: [CacheTags.ANALYTICS] }
);

/**
 * Get collection usage data for bar charts
 */
export async function getCollectionUsageAction(): Promise<
  AnalyticsActionResult<CollectionUsageData[]>
> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const data = await getCachedCollectionUsage(session.user.id);

    return { success: true, data };
  } catch (error) {
    console.error('Error getting collection usage:', error);
    return { success: false, message: 'Failed to fetch collection usage' };
  }
}

/**
 * Get AI-generated knowledge insights
 * Combines basic statistics insights with advanced AI analysis
 */
export async function getKnowledgeInsightsAction(): Promise<
  AnalyticsActionResult<KnowledgeInsight[]>
> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    // Rate limit (AI-intensive)
    const rateCheck = checkServerActionRateLimit(session.user.id, 'knowledgeInsights', RATE_LIMITS.serverActionAI);
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    // Gather basic stats and advanced insights in parallel
    const [overviewResult, tagResult, advancedInsights] = await Promise.all([
      getOverviewStatsAction(),
      getTagDistributionAction(),
      extractInsights(session.user.id),
    ]);

    const insights: KnowledgeInsight[] = [];

    // Generate basic insights from stats
    if (overviewResult.success && overviewResult.data) {
      const stats = overviewResult.data;

      // Achievement insight for total items
      if (stats.totalItems >= 100) {
        insights.push({
          type: 'achievement',
          title: 'Knowledge Champion',
          description: `You've captured ${stats.totalItems} items in your knowledge base. Keep building!`,
          icon: 'trophy',
        });
      } else if (stats.totalItems >= 50) {
        insights.push({
          type: 'achievement',
          title: 'Growing Library',
          description: `${stats.totalItems} items saved. You're building a valuable knowledge base!`,
          icon: 'trophy',
        });
      }

      // Add a suggestion if user has no collections
      if (stats.totalCollections === 0 && stats.totalItems >= 5) {
        insights.push({
          type: 'suggestion',
          title: 'Organize with Collections',
          description:
            'Create collections to group related items together and find them faster.',
          icon: 'lightbulb',
        });
      }
    }

    // Tag insights
    if (tagResult.success && tagResult.data && tagResult.data.length > 0) {
      const topTag = tagResult.data[0];
      insights.push({
        type: 'pattern',
        title: 'Top Focus Area',
        description: `"${topTag.tag}" is your most common topic with ${topTag.count} items tagged.`,
        icon: 'tag',
      });
    }

    // Add advanced AI-powered insights
    for (const insight of advancedInsights) {
      // Convert advanced insight format to KnowledgeInsight
      insights.push({
        type: insight.type,
        title: insight.title,
        description: insight.description,
        icon: insight.icon as KnowledgeInsight['icon'],
        relatedContentIds: insight.relatedContentIds,
        confidence: insight.confidence,
      });
    }

    // Ensure we always return at least one insight
    if (insights.length === 0) {
      insights.push({
        type: 'suggestion',
        title: 'Start Capturing Knowledge',
        description:
          'Add notes, links, and files to build your personal knowledge base.',
        icon: 'zap',
      });
    }

    // Sort by confidence (if available) and limit to 5
    insights.sort((a, b) => (b.confidence ?? 0.5) - (a.confidence ?? 0.5));
    return { success: true, data: insights.slice(0, 5) };
  } catch (error) {
    console.error('Error getting knowledge insights:', error);
    return { success: false, message: 'Failed to generate insights' };
  }
}

/**
 * Export analytics data as JSON
 */
export async function exportAnalyticsAction(): Promise<
  AnalyticsActionResult<{
    overview: OverviewStats | null;
    contentGrowth: ContentGrowthData[] | null;
    tagDistribution: TagDistributionData[] | null;
    collectionUsage: CollectionUsageData[] | null;
    exportedAt: string;
  }>
> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    // Fetch all analytics data in parallel
    const [overviewResult, growthResult, tagResult, collectionResult] = await Promise.all([
      getOverviewStatsAction(),
      getContentGrowthAction('year'),
      getTagDistributionAction(),
      getCollectionUsageAction(),
    ]);

    return {
      success: true,
      data: {
        overview: overviewResult.success ? overviewResult.data ?? null : null,
        contentGrowth: growthResult.success ? growthResult.data ?? null : null,
        tagDistribution: tagResult.success ? tagResult.data ?? null : null,
        collectionUsage: collectionResult.success ? collectionResult.data ?? null : null,
        exportedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Error exporting analytics:', error);
    return { success: false, message: 'Failed to export analytics data' };
  }
}

// Cached internal function for streak data
const getCachedStreakData = unstable_cache(
  async (userId: string) => {
    // Get daily activity for last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const result = await db.execute<{ day: string; count: string }>(sql`
      SELECT DATE(created_at) as day, COUNT(*) as count
      FROM ${content}
      WHERE user_id = ${userId}
        AND created_at >= ${ninetyDaysAgo.toISOString()}::timestamp
      GROUP BY DATE(created_at)
      ORDER BY day DESC
    `);

    const rows = result as unknown as { day: string; count: string }[];

    // Build heatmap
    const heatmap: { date: string; count: number }[] = [];
    const activityMap = new Map<string, number>();
    for (const row of rows) {
      activityMap.set(row.day, parseInt(row.count, 10));
    }

    // Fill 90 days
    const today = new Date();
    for (let i = 89; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      heatmap.push({ date: dateStr, count: activityMap.get(dateStr) || 0 });
    }

    // Compute streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let totalActiveDays = 0;

    // Walk heatmap from most recent to oldest
    for (let i = heatmap.length - 1; i >= 0; i--) {
      if (heatmap[i].count > 0) {
        totalActiveDays++;
        tempStreak++;
        if (i === heatmap.length - 1 || (i < heatmap.length - 1 && heatmap[i + 1].count > 0)) {
          // continuing a streak from the end
        }
      } else {
        if (tempStreak > longestStreak) longestStreak = tempStreak;
        tempStreak = 0;
      }
    }
    if (tempStreak > longestStreak) longestStreak = tempStreak;

    // Current streak: count from today backwards
    currentStreak = 0;
    for (let i = heatmap.length - 1; i >= 0; i--) {
      if (heatmap[i].count > 0) {
        currentStreak++;
      } else {
        break;
      }
    }

    return { currentStreak, longestStreak, totalActiveDays, heatmap };
  },
  ['analytics', 'streaks'],
  { revalidate: CacheDuration.MEDIUM, tags: [CacheTags.ANALYTICS] }
);

/**
 * Get streak data for the analytics dashboard
 */
export async function getStreakDataAction(): Promise<AnalyticsActionResult<import('@/types/analytics').StreakData>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const data = await getCachedStreakData(session.user.id);
    return { success: true, data };
  } catch (error) {
    console.error('Error getting streak data:', error);
    return { success: false, message: 'Failed to fetch streak data' };
  }
}

// Cached internal function for knowledge gaps
const getCachedKnowledgeGaps = unstable_cache(
  async (userId: string) => {
    const result = await db.execute<{ tag: string; count: string; last_added: string }>(sql`
      SELECT LOWER(tag) as tag, COUNT(*) as count, MAX(created_at) as last_added
      FROM (
        SELECT UNNEST(tags || auto_tags) as tag, created_at
        FROM ${content}
        WHERE user_id = ${userId}
      ) as all_tags
      WHERE tag IS NOT NULL AND tag != ''
      GROUP BY LOWER(tag)
      HAVING COUNT(*) < 3
         OR MAX(created_at) < NOW() - INTERVAL '30 days'
      ORDER BY count ASC, last_added ASC
      LIMIT 20
    `);

    const rows = result as unknown as { tag: string; count: string; last_added: string }[];
    return rows.map((row) => ({
      tag: row.tag,
      count: parseInt(row.count, 10),
      lastAdded: new Date(row.last_added),
    }));
  },
  ['analytics', 'knowledge-gaps'],
  { revalidate: CacheDuration.LONG, tags: [CacheTags.ANALYTICS] }
);

/**
 * Get knowledge gaps - tags with sparse or stale content
 */
export async function getKnowledgeGapsAction(): Promise<AnalyticsActionResult<import('@/types/analytics').KnowledgeGap[]>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const data = await getCachedKnowledgeGaps(session.user.id);
    return { success: true, data };
  } catch (error) {
    console.error('Error getting knowledge gaps:', error);
    return { success: false, message: 'Failed to fetch knowledge gaps' };
  }
}

// Cached internal function for content type breakdown
const getCachedContentTypeBreakdown = unstable_cache(
  async (userId: string) => {
    const result = await db.execute<{ type: string; count: string }>(sql`
      SELECT type, COUNT(*) as count
      FROM ${content}
      WHERE user_id = ${userId}
      GROUP BY type
    `);

    const rows = result as unknown as { type: string; count: string }[];
    const breakdown = { notes: 0, links: 0, files: 0 };
    for (const row of rows) {
      switch (row.type) {
        case 'note':
          breakdown.notes = parseInt(row.count, 10);
          break;
        case 'link':
          breakdown.links = parseInt(row.count, 10);
          break;
        case 'file':
          breakdown.files = parseInt(row.count, 10);
          break;
      }
    }
    return breakdown;
  },
  ['analytics', 'content-type-breakdown'],
  { revalidate: CacheDuration.MEDIUM, tags: [CacheTags.ANALYTICS] }
);

/**
 * Get content type breakdown
 */
export async function getContentTypeBreakdownAction(): Promise<AnalyticsActionResult<import('@/types/analytics').ContentTypeBreakdown>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const data = await getCachedContentTypeBreakdown(session.user.id);
    return { success: true, data };
  } catch (error) {
    console.error('Error getting content type breakdown:', error);
    return { success: false, message: 'Failed to fetch content type breakdown' };
  }
}
