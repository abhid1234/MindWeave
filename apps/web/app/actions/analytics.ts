'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { content, collections, contentCollections } from '@/lib/db/schema';
import { eq, sql, gte, and, count } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';
import type {
  OverviewStats,
  ContentGrowthData,
  TagDistributionData,
  CollectionUsageData,
  KnowledgeInsight,
  GrowthPeriod,
  AnalyticsActionResult,
} from '@/types/analytics';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/**
 * Get overview stats for the analytics dashboard
 */
export async function getOverviewStatsAction(): Promise<AnalyticsActionResult<OverviewStats>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    // Get total items count
    const [totalResult] = await db
      .select({ count: count() })
      .from(content)
      .where(eq(content.userId, session.user.id));

    // Get items created this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [thisMonthResult] = await db
      .select({ count: count() })
      .from(content)
      .where(
        and(
          eq(content.userId, session.user.id),
          gte(content.createdAt, startOfMonth)
        )
      );

    // Get total collections count
    const [collectionsResult] = await db
      .select({ count: count() })
      .from(collections)
      .where(eq(collections.userId, session.user.id));

    // Get unique tags count using subquery
    const tagsResult = await db.execute<{ tag_count: string }>(sql`
      SELECT COUNT(DISTINCT tag) as tag_count
      FROM (
        SELECT UNNEST(tags || auto_tags) as tag
        FROM ${content}
        WHERE user_id = ${session.user.id}
      ) as all_tags
      WHERE tag IS NOT NULL AND tag != ''
    `);

    const tagCountRow = (tagsResult as unknown as { tag_count: string }[])[0];
    const uniqueTagCount = tagCountRow ? parseInt(tagCountRow.tag_count, 10) : 0;

    return {
      success: true,
      data: {
        totalItems: totalResult.count,
        itemsThisMonth: thisMonthResult.count,
        totalCollections: collectionsResult.count,
        totalTags: uniqueTagCount,
      },
    };
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

    // Get tag counts using SQL
    const result = await db.execute<{ tag: string; count: string }>(sql`
      SELECT tag, COUNT(*) as count
      FROM (
        SELECT UNNEST(tags || auto_tags) as tag
        FROM ${content}
        WHERE user_id = ${session.user.id}
      ) as all_tags
      WHERE tag IS NOT NULL AND tag != ''
      GROUP BY tag
      ORDER BY count DESC
      LIMIT 10
    `);

    const rows = result as unknown as { tag: string; count: string }[];

    // Calculate total for percentages
    const total = rows.reduce((sum, row) => sum + parseInt(row.count, 10), 0);

    const data: TagDistributionData[] = rows.map((row) => ({
      tag: row.tag,
      count: parseInt(row.count, 10),
      percentage: total > 0 ? Math.round((parseInt(row.count, 10) / total) * 100) : 0,
    }));

    return { success: true, data };
  } catch (error) {
    console.error('Error getting tag distribution:', error);
    return { success: false, message: 'Failed to fetch tag distribution' };
  }
}

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

    // Get all collections for the user
    const userCollections = await db
      .select({
        id: collections.id,
        name: collections.name,
        color: collections.color,
      })
      .from(collections)
      .where(eq(collections.userId, session.user.id))
      .orderBy(collections.name);

    // Get content counts for each collection
    const data: CollectionUsageData[] = await Promise.all(
      userCollections.map(async (collection) => {
        const [countResult] = await db
          .select({ count: count() })
          .from(contentCollections)
          .where(eq(contentCollections.collectionId, collection.id));

        return {
          id: collection.id,
          name: collection.name,
          color: collection.color,
          itemCount: countResult.count,
        };
      })
    );

    // Sort by item count descending
    data.sort((a, b) => b.itemCount - a.itemCount);

    return { success: true, data };
  } catch (error) {
    console.error('Error getting collection usage:', error);
    return { success: false, message: 'Failed to fetch collection usage' };
  }
}

/**
 * Get AI-generated knowledge insights
 */
export async function getKnowledgeInsightsAction(): Promise<
  AnalyticsActionResult<KnowledgeInsight[]>
> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    // Gather data for insights
    const [overviewResult, tagResult, growthResult] = await Promise.all([
      getOverviewStatsAction(),
      getTagDistributionAction(),
      getContentGrowthAction('month'),
    ]);

    const insights: KnowledgeInsight[] = [];

    // Generate insights based on data
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

      // Monthly activity insight
      if (stats.itemsThisMonth > 0) {
        insights.push({
          type: 'pattern',
          title: 'Active This Month',
          description: `You've added ${stats.itemsThisMonth} item${stats.itemsThisMonth !== 1 ? 's' : ''} this month. Great progress!`,
          icon: 'calendar',
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

    // Growth pattern insight
    if (growthResult.success && growthResult.data && growthResult.data.length >= 7) {
      const recentData = growthResult.data.slice(-7);
      const totalRecent = recentData.reduce((sum, d) => sum + d.total, 0);
      const previousData = growthResult.data.slice(-14, -7);
      const totalPrevious = previousData.reduce((sum, d) => sum + d.total, 0);

      if (totalRecent > totalPrevious) {
        insights.push({
          type: 'pattern',
          title: 'Momentum Building',
          description: 'Your activity is increasing! You added more content this week than last week.',
          icon: 'trending-up',
        });
      }
    }

    // Generate AI insight if we have enough content
    if (
      process.env.ANTHROPIC_API_KEY &&
      overviewResult.success &&
      overviewResult.data &&
      overviewResult.data.totalItems >= 10 &&
      tagResult.success &&
      tagResult.data &&
      tagResult.data.length >= 3
    ) {
      try {
        const topTags = tagResult.data.slice(0, 5).map((t) => t.tag);
        const aiInsight = await generateAIInsight(
          overviewResult.data.totalItems,
          topTags
        );
        if (aiInsight) {
          insights.push(aiInsight);
        }
      } catch {
        // AI insight is optional, don't fail if it errors
      }
    }

    // Add a suggestion if user has no collections
    if (
      overviewResult.success &&
      overviewResult.data &&
      overviewResult.data.totalCollections === 0 &&
      overviewResult.data.totalItems >= 5
    ) {
      insights.push({
        type: 'suggestion',
        title: 'Organize with Collections',
        description:
          'Create collections to group related items together and find them faster.',
        icon: 'lightbulb',
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

    return { success: true, data: insights.slice(0, 5) }; // Limit to 5 insights
  } catch (error) {
    console.error('Error getting knowledge insights:', error);
    return { success: false, message: 'Failed to generate insights' };
  }
}

/**
 * Generate an AI-powered insight using Claude
 */
async function generateAIInsight(
  totalItems: number,
  topTags: string[]
): Promise<KnowledgeInsight | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return null;
  }

  try {
    const prompt = `Based on a user's knowledge base with ${totalItems} items and top topics: ${topTags.join(', ')}, suggest one brief, actionable insight about their learning patterns or a way to get more value from their knowledge base. Keep it to 1-2 sentences max. Be encouraging and specific.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 100,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = message.content[0];
    if (textContent.type === 'text' && textContent.text.trim()) {
      return {
        type: 'suggestion',
        title: 'AI Insight',
        description: textContent.text.trim(),
        icon: 'lightbulb',
      };
    }

    return null;
  } catch (error) {
    console.error('Error generating AI insight:', error);
    return null;
  }
}
