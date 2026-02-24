'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { content, contentViews, embeddings } from '@/lib/db/schema';
import type { ContentType } from '@/lib/db/schema';
import { eq, desc, and, gte, notInArray, sql, lt } from 'drizzle-orm';
import { getRecommendations } from '@/lib/ai/embeddings';
import { calculateBlendedScore } from '@/lib/recommendations';
import { checkServerActionRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export type DiscoverResult = {
  id: string;
  title: string;
  body: string | null;
  type: ContentType;
  tags: string[];
  autoTags: string[];
  url: string | null;
  createdAt: Date;
  similarity: number;
  score: number;
  lastViewedAt: Date | null;
};

export type DiscoverResponse = {
  success: boolean;
  message?: string;
  results: DiscoverResult[];
};

/**
 * Get recommendations based on user's recently viewed content.
 * Uses the 5 most recently viewed items as seeds, deduplicates,
 * excludes recently-viewed content, and applies blended scoring.
 */
export async function getActivityBasedRecommendationsAction(
  limit: number = 8
): Promise<DiscoverResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized.', results: [] };
    }

    const rateCheck = checkServerActionRateLimit(session.user.id, 'discoverActivity', RATE_LIMITS.serverActionAI);
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message, results: [] };
    }

    const userId = session.user.id;

    // Get 5 most recently viewed distinct content IDs
    const recentViewsResult = await db.execute(sql`
      SELECT DISTINCT ON (cv.content_id)
        cv.content_id as "contentId",
        cv.viewed_at as "viewedAt"
      FROM ${contentViews} cv
      WHERE cv.user_id = ${userId}
      ORDER BY cv.content_id, cv.viewed_at DESC
    `);

    const recentViews = (recentViewsResult as unknown as { contentId: string; viewedAt: Date }[])
      .sort((a, b) => new Date(b.viewedAt as unknown as string).getTime() - new Date(a.viewedAt as unknown as string).getTime())
      .slice(0, 5);

    if (recentViews.length === 0) {
      return { success: true, results: [] };
    }

    // Get all viewed content IDs in last 24h to exclude from results
    const recentlyViewedThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentlyViewedResult = await db.execute(sql`
      SELECT DISTINCT cv.content_id as "contentId"
      FROM ${contentViews} cv
      WHERE cv.user_id = ${userId}
        AND cv.viewed_at >= ${recentlyViewedThreshold}
    `);
    const recentlyViewedIds = new Set(
      (recentlyViewedResult as unknown as { contentId: string }[]).map(r => r.contentId)
    );

    // Build a map of content_id -> last viewed at for all views
    const allViewsResult = await db.execute(sql`
      SELECT DISTINCT ON (cv.content_id)
        cv.content_id as "contentId",
        cv.viewed_at as "viewedAt"
      FROM ${contentViews} cv
      WHERE cv.user_id = ${userId}
      ORDER BY cv.content_id, cv.viewed_at DESC
    `);
    const viewedAtMap = new Map<string, Date>();
    for (const row of allViewsResult as unknown as { contentId: string; viewedAt: string | Date }[]) {
      viewedAtMap.set(row.contentId, row.viewedAt instanceof Date ? row.viewedAt : new Date(row.viewedAt));
    }

    // Get recommendations for each seed
    const allResults: DiscoverResult[] = [];
    const seenIds = new Set<string>();

    // Exclude seed content IDs
    for (const view of recentViews) {
      seenIds.add(view.contentId);
    }

    const now = new Date();

    for (const view of recentViews) {
      const recs = await getRecommendations(view.contentId, userId, 6, 0.2);

      for (const rec of recs) {
        if (seenIds.has(rec.id) || recentlyViewedIds.has(rec.id)) continue;
        seenIds.add(rec.id);

        const lastViewedAt = viewedAtMap.get(rec.id) ?? null;
        const score = calculateBlendedScore(rec.similarity, rec.createdAt, lastViewedAt, now);

        allResults.push({
          ...rec,
          score,
          lastViewedAt,
        });
      }
    }

    // Sort by blended score and return top N
    const validLimit = Math.min(Math.max(1, limit), 20);
    const topResults = allResults
      .sort((a, b) => b.score - a.score)
      .slice(0, validLimit);

    return { success: true, results: topResults };
  } catch (error) {
    console.error('Error getting activity-based recommendations:', error);
    return { success: false, message: 'Failed to get recommendations.', results: [] };
  }
}

/**
 * Get content with tags not found in the user's recently viewed items (last 30d).
 * Surfaces topics the user hasn't explored.
 */
export async function getUnexploredTopicsAction(
  limit: number = 8
): Promise<DiscoverResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized.', results: [] };
    }

    const rateCheck = checkServerActionRateLimit(session.user.id, 'discoverUnexplored', RATE_LIMITS.serverAction);
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message, results: [] };
    }

    const userId = session.user.id;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get tags from recently viewed content (last 30d)
    const viewedContentResult = await db.execute(sql`
      SELECT DISTINCT c.tags, c.auto_tags as "autoTags"
      FROM ${contentViews} cv
      INNER JOIN ${content} c ON cv.content_id = c.id
      WHERE cv.user_id = ${userId}
        AND cv.viewed_at >= ${thirtyDaysAgo}
    `);

    const viewedTags = new Set<string>();
    for (const row of viewedContentResult as unknown as { tags: string[]; autoTags: string[] }[]) {
      for (const tag of [...(row.tags ?? []), ...(row.autoTags ?? [])]) {
        viewedTags.add(tag.toLowerCase());
      }
    }

    // If no viewed tags, return recent content the user hasn't seen
    if (viewedTags.size === 0) {
      return { success: true, results: [] };
    }

    // Get all user content not viewed in 30d
    const validLimit = Math.min(Math.max(1, limit), 20);
    const viewedIdsResult = await db.execute(sql`
      SELECT DISTINCT cv.content_id as "contentId"
      FROM ${contentViews} cv
      WHERE cv.user_id = ${userId}
        AND cv.viewed_at >= ${thirtyDaysAgo}
    `);
    const viewedIds = (viewedIdsResult as unknown as { contentId: string }[]).map(r => r.contentId);

    let candidateQuery;
    if (viewedIds.length > 0) {
      candidateQuery = await db.execute(sql`
        SELECT
          c.id,
          c.title,
          c.body,
          c.type,
          c.tags,
          c.auto_tags as "autoTags",
          c.url,
          c.created_at as "createdAt"
        FROM ${content} c
        WHERE c.user_id = ${userId}
          AND c.id NOT IN ${sql`(${sql.join(viewedIds.map(id => sql`${id}`), sql`, `)})`}
        ORDER BY c.created_at DESC
        LIMIT ${validLimit * 3}
      `);
    } else {
      candidateQuery = await db.execute(sql`
        SELECT
          c.id,
          c.title,
          c.body,
          c.type,
          c.tags,
          c.auto_tags as "autoTags",
          c.url,
          c.created_at as "createdAt"
        FROM ${content} c
        WHERE c.user_id = ${userId}
        ORDER BY c.created_at DESC
        LIMIT ${validLimit * 3}
      `);
    }

    const candidates = candidateQuery as unknown as Record<string, unknown>[];

    // Filter to content whose tags don't overlap with viewed tags
    const unexplored: DiscoverResult[] = [];
    for (const row of candidates) {
      const rowTags = [...((row.tags as string[]) ?? []), ...((row.autoTags as string[]) ?? [])];
      const hasOverlap = rowTags.some(t => viewedTags.has(t.toLowerCase()));

      if (!hasOverlap && rowTags.length > 0) {
        const createdAt = row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt as string);
        unexplored.push({
          id: row.id as string,
          title: row.title as string,
          body: row.body as string | null,
          type: row.type as ContentType,
          tags: row.tags as string[],
          autoTags: row.autoTags as string[],
          url: row.url as string | null,
          createdAt,
          similarity: 0,
          score: calculateBlendedScore(0.5, createdAt, null, new Date()),
          lastViewedAt: null,
        });
      }
    }

    return {
      success: true,
      results: unexplored.slice(0, validLimit),
    };
  } catch (error) {
    console.error('Error getting unexplored topics:', error);
    return { success: false, message: 'Failed to get unexplored topics.', results: [] };
  }
}

/**
 * Get old content (>30d) not viewed in 30d that is similar to recent views.
 * Helps users rediscover forgotten knowledge.
 */
export async function getRediscoverAction(
  limit: number = 8
): Promise<DiscoverResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized.', results: [] };
    }

    const rateCheck = checkServerActionRateLimit(session.user.id, 'discoverRediscover', RATE_LIMITS.serverActionAI);
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message, results: [] };
    }

    const userId = session.user.id;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get 3 most recently viewed content IDs as seeds
    const recentViewsResult = await db.execute(sql`
      SELECT DISTINCT ON (cv.content_id)
        cv.content_id as "contentId",
        cv.viewed_at as "viewedAt"
      FROM ${contentViews} cv
      WHERE cv.user_id = ${userId}
      ORDER BY cv.content_id, cv.viewed_at DESC
    `);

    const recentViews = (recentViewsResult as unknown as { contentId: string; viewedAt: Date }[])
      .sort((a, b) => new Date(b.viewedAt as unknown as string).getTime() - new Date(a.viewedAt as unknown as string).getTime())
      .slice(0, 3);

    if (recentViews.length === 0) {
      return { success: true, results: [] };
    }

    // Get IDs of content viewed in last 30d
    const recentlyViewedResult = await db.execute(sql`
      SELECT DISTINCT cv.content_id as "contentId"
      FROM ${contentViews} cv
      WHERE cv.user_id = ${userId}
        AND cv.viewed_at >= ${thirtyDaysAgo}
    `);
    const recentlyViewedIds = new Set(
      (recentlyViewedResult as unknown as { contentId: string }[]).map(r => r.contentId)
    );

    // Get recommendations from seeds, filtering to old content not recently viewed
    const allResults: DiscoverResult[] = [];
    const seenIds = new Set<string>();
    const now = new Date();

    for (const view of recentViews) {
      seenIds.add(view.contentId);
    }

    for (const view of recentViews) {
      const recs = await getRecommendations(view.contentId, userId, 8, 0.2);

      for (const rec of recs) {
        if (seenIds.has(rec.id)) continue;
        seenIds.add(rec.id);

        // Must be old content (>30d) and not viewed in 30d
        const ageMs = now.getTime() - rec.createdAt.getTime();
        const isOld = ageMs > 30 * 24 * 60 * 60 * 1000;
        const notRecentlyViewed = !recentlyViewedIds.has(rec.id);

        if (isOld && notRecentlyViewed) {
          const score = calculateBlendedScore(rec.similarity, rec.createdAt, null, now);
          allResults.push({
            ...rec,
            score,
            lastViewedAt: null,
          });
        }
      }
    }

    const validLimit = Math.min(Math.max(1, limit), 20);
    const topResults = allResults
      .sort((a, b) => b.score - a.score)
      .slice(0, validLimit);

    return { success: true, results: topResults };
  } catch (error) {
    console.error('Error getting rediscover content:', error);
    return { success: false, message: 'Failed to get rediscover content.', results: [] };
  }
}

/**
 * Enhanced dashboard recommendations with blended scoring.
 * Uses recent content + view history for better recommendations.
 */
export async function getBlendedRecommendationsAction(
  limit: number = 6
): Promise<DiscoverResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized.', results: [] };
    }

    const rateCheck = checkServerActionRateLimit(session.user.id, 'discoverBlended', RATE_LIMITS.serverActionAI);
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message, results: [] };
    }

    const userId = session.user.id;

    // Get user's 3 most recent content items as seeds
    const recentContent = await db
      .select({ id: content.id })
      .from(content)
      .where(eq(content.userId, userId))
      .orderBy(desc(content.createdAt))
      .limit(3);

    if (recentContent.length === 0) {
      return { success: true, results: [] };
    }

    // Get view history map for blended scoring
    const allViewsResult = await db.execute(sql`
      SELECT DISTINCT ON (cv.content_id)
        cv.content_id as "contentId",
        cv.viewed_at as "viewedAt"
      FROM ${contentViews} cv
      WHERE cv.user_id = ${userId}
      ORDER BY cv.content_id, cv.viewed_at DESC
    `);
    const viewedAtMap = new Map<string, Date>();
    for (const row of allViewsResult as unknown as { contentId: string; viewedAt: string | Date }[]) {
      viewedAtMap.set(row.contentId, row.viewedAt instanceof Date ? row.viewedAt : new Date(row.viewedAt));
    }

    const allResults: DiscoverResult[] = [];
    const seenIds = new Set<string>();
    const now = new Date();

    for (const item of recentContent) {
      seenIds.add(item.id);
    }

    for (const item of recentContent) {
      const recs = await getRecommendations(item.id, userId, 4, 0.3);

      for (const rec of recs) {
        if (seenIds.has(rec.id)) continue;
        seenIds.add(rec.id);

        const lastViewedAt = viewedAtMap.get(rec.id) ?? null;
        const score = calculateBlendedScore(rec.similarity, rec.createdAt, lastViewedAt, now);

        allResults.push({
          ...rec,
          score,
          lastViewedAt,
        });
      }
    }

    const validLimit = Math.min(Math.max(1, limit), 20);
    const topResults = allResults
      .sort((a, b) => b.score - a.score)
      .slice(0, validLimit);

    return { success: true, results: topResults };
  } catch (error) {
    console.error('Error getting blended recommendations:', error);
    return { success: false, message: 'Failed to get recommendations.', results: [] };
  }
}
