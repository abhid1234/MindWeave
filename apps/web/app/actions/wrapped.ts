'use server';

import crypto from 'crypto';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { content, embeddings, knowledgeWrapped } from '@/lib/db/schema';
import { eq, sql, count } from 'drizzle-orm';
import { checkServerActionRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { generateKnowledgePersonality } from '@/lib/ai/gemini';
import type { WrappedStats, WrappedActionResult, WrappedPublicResult } from '@/types/wrapped';

/**
 * Generate a Knowledge Wrapped summary for the current user
 */
export async function generateWrappedAction(): Promise<WrappedActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const userId = session.user.id;

    // Rate limit
    const rateCheck = checkServerActionRateLimit(userId, 'wrappedGeneration', RATE_LIMITS.wrappedGeneration);
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    // Gather stats in parallel
    const [
      totalResult,
      typeBreakdown,
      tagDistribution,
      streakData,
      mostConnected,
      growthData,
      activeDaysResult,
    ] = await Promise.all([
      // Total items
      db.select({ count: count() }).from(content).where(eq(content.userId, userId)),
      // Content type breakdown
      db.execute<{ type: string; count: string }>(sql`
        SELECT type, COUNT(*) as count
        FROM ${content}
        WHERE user_id = ${userId}
        GROUP BY type
      `),
      // Top tags
      db.execute<{ tag: string; count: string }>(sql`
        SELECT LOWER(tag) as tag, COUNT(*) as count
        FROM (
          SELECT UNNEST(tags || auto_tags) as tag
          FROM ${content}
          WHERE user_id = ${userId}
        ) as all_tags
        WHERE tag IS NOT NULL AND tag != ''
        GROUP BY LOWER(tag)
        ORDER BY count DESC
        LIMIT 5
      `),
      // Streak data
      db.execute<{ day: string; count: string }>(sql`
        SELECT DATE(created_at) as day, COUNT(*) as count
        FROM ${content}
        WHERE user_id = ${userId}
          AND created_at >= NOW() - INTERVAL '90 days'
        GROUP BY DATE(created_at)
        ORDER BY day DESC
      `),
      // Most connected content (most embeddings neighbors)
      db.execute<{ id: string; title: string; connection_count: string }>(sql`
        SELECT c.id, c.title, COUNT(e2.id) as connection_count
        FROM ${content} c
        JOIN ${embeddings} e1 ON e1.content_id = c.id
        JOIN ${embeddings} e2 ON e2.content_id != c.id
          AND 1 - (e1.embedding <=> e2.embedding) > 0.3
        WHERE c.user_id = ${userId}
        GROUP BY c.id, c.title
        ORDER BY connection_count DESC
        LIMIT 1
      `),
      // Month-over-month growth
      db.execute<{ this_month: string; last_month: string }>(sql`
        SELECT
          (SELECT COUNT(*) FROM ${content} WHERE user_id = ${userId}
            AND created_at >= DATE_TRUNC('month', NOW())) as this_month,
          (SELECT COUNT(*) FROM ${content} WHERE user_id = ${userId}
            AND created_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
            AND created_at < DATE_TRUNC('month', NOW())) as last_month
      `),
      // Total active days
      db.execute<{ active_days: string }>(sql`
        SELECT COUNT(DISTINCT DATE(created_at)) as active_days
        FROM ${content}
        WHERE user_id = ${userId}
      `),
    ]);

    // Process type breakdown
    const typeRows = typeBreakdown as unknown as { type: string; count: string }[];
    const contentTypeSplit = { notes: 0, links: 0, files: 0 };
    for (const row of typeRows) {
      if (row.type === 'note') contentTypeSplit.notes = parseInt(row.count, 10);
      if (row.type === 'link') contentTypeSplit.links = parseInt(row.count, 10);
      if (row.type === 'file') contentTypeSplit.files = parseInt(row.count, 10);
    }

    // Process tags
    const tagRows = tagDistribution as unknown as { tag: string; count: string }[];
    const topTags = tagRows.map((r) => r.tag);

    // Unique tag count
    const uniqueTagCount = tagRows.length; // simplified, actual count from query

    // Process streaks
    const streakRows = streakData as unknown as { day: string; count: string }[];
    const activityMap = new Map<string, number>();
    for (const row of streakRows) {
      activityMap.set(row.day, parseInt(row.count, 10));
    }

    // Compute streaks from activity data
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const today = new Date();

    for (let i = 0; i < 90; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      if (activityMap.has(dateStr)) {
        tempStreak++;
        if (i === 0 || currentStreak > 0) currentStreak = tempStreak;
      } else {
        if (tempStreak > longestStreak) longestStreak = tempStreak;
        tempStreak = 0;
        if (i === 0) currentStreak = 0;
      }
    }
    if (tempStreak > longestStreak) longestStreak = tempStreak;

    // Find most active day of week
    const dayCount = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
    for (const [day] of activityMap) {
      const d = new Date(day);
      dayCount[d.getDay()]++;
    }
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const mostActiveDayIdx = dayCount.indexOf(Math.max(...dayCount));
    const mostActiveDay = dayNames[mostActiveDayIdx];

    // Process most connected
    const connectedRows = mostConnected as unknown as { id: string; title: string; connection_count: string }[];
    const mostConnectedContent = connectedRows.length > 0
      ? { id: connectedRows[0].id, title: connectedRows[0].title, connectionCount: parseInt(connectedRows[0].connection_count, 10) }
      : null;

    // Process month-over-month growth
    const growthRows = growthData as unknown as { this_month: string; last_month: string }[];
    const thisMonth = parseInt(growthRows[0]?.this_month || '0', 10);
    const lastMonth = parseInt(growthRows[0]?.last_month || '0', 10);
    const monthOverMonthGrowth = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0;

    // Total active days
    const activeDaysRows = activeDaysResult as unknown as { active_days: string }[];
    const totalActiveDays = parseInt(activeDaysRows[0]?.active_days || '0', 10);

    // Total items
    const totalItems = totalResult[0].count;

    // Generate AI personality
    const { personality, description } = await generateKnowledgePersonality({
      topTags,
      totalItems,
      contentTypeSplit,
      longestStreak,
    });

    const stats: WrappedStats = {
      totalItems,
      topTags,
      longestStreak,
      currentStreak,
      mostActiveDay,
      contentTypeSplit,
      monthOverMonthGrowth,
      mostConnectedContent,
      knowledgePersonality: personality,
      personalityDescription: description,
      totalActiveDays,
      uniqueTagCount,
    };

    // Save to DB
    const shareId = crypto.randomBytes(16).toString('hex');
    await db.insert(knowledgeWrapped).values({
      userId,
      shareId,
      stats,
      period: 'all-time',
    });

    return { success: true, data: { shareId, stats } };
  } catch (error) {
    console.error('Error generating wrapped:', error);
    return { success: false, message: 'Failed to generate your Knowledge Wrapped' };
  }
}

/**
 * Get a wrapped summary by its public share ID (no auth required)
 */
export async function getWrappedByShareIdAction(shareId: string): Promise<WrappedPublicResult> {
  try {
    const result = await db.query.knowledgeWrapped.findFirst({
      where: (kw, { eq }) => eq(kw.shareId, shareId),
    });

    if (!result) {
      return { success: false, message: 'Wrapped not found' };
    }

    return {
      success: true,
      data: {
        stats: result.stats as WrappedStats,
        createdAt: result.createdAt.toISOString(),
        period: result.period,
      },
    };
  } catch (error) {
    console.error('Error fetching wrapped:', error);
    return { success: false, message: 'Failed to load wrapped' };
  }
}

/**
 * Get the latest wrapped for the current user
 */
export async function getLatestWrappedAction(): Promise<WrappedActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const userId = session.user.id;
    const result = await db.query.knowledgeWrapped.findFirst({
      where: (kw, { eq }) => eq(kw.userId, userId),
      orderBy: (kw, { desc }) => [desc(kw.createdAt)],
    });

    if (!result) {
      return { success: true }; // No wrapped yet
    }

    return {
      success: true,
      data: {
        shareId: result.shareId,
        stats: result.stats as WrappedStats,
      },
    };
  } catch (error) {
    console.error('Error fetching latest wrapped:', error);
    return { success: false, message: 'Failed to load your latest wrapped' };
  }
}
