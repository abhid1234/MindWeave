import { db } from '@/lib/db/client';
import {
  content,
  collections,
  contentCollections,
  contentViews,
  marketplaceListings,
  tilPosts,
  userBadges,
  flashcards,
  learningPaths,
  learningPathItems,
  learningPathProgress,
} from '@/lib/db/schema';
import { eq, and, sql, count, countDistinct, max } from 'drizzle-orm';
import { getBadgesByTrigger } from './definitions';
import type { BadgeTrigger, BadgeDefinition } from '@/types/badges';

type CheckerFn = (userId: string) => Promise<number>;

function getCheckerKey(badge: BadgeDefinition): string {
  // Group badges that share the same query
  if (badge.category === 'creator') return 'creator_count';
  if (badge.category === 'streak') return 'streak_longest';
  if (badge.category === 'sharer' && badge.id !== 'sharer-viral') return 'sharer_count';
  if (badge.id === 'sharer-viral') return 'sharer_viral';
  if (badge.category === 'curator' && badge.id !== 'curator-mega') return 'curator_count';
  if (badge.id === 'curator-mega') return 'curator_mega';
  if (badge.id === 'community-published') return 'community_published';
  if (badge.id === 'community-popular') return 'community_popular';
  if (badge.id === 'community-influencer') return 'community_influencer';
  if (badge.id === 'explorer-diverse') return 'explorer_diverse';
  if (badge.id === 'explorer-tags') return 'explorer_tags';
  if (badge.id === 'explorer-views') return 'explorer_views';
  if (badge.category === 'scholar' && badge.id !== 'scholar-streak') return 'scholar_reviews';
  if (badge.id === 'scholar-streak') return 'scholar_streak';
  if (badge.id === 'pathfinder-creator') return 'pathfinder_created';
  if (badge.id === 'pathfinder-first-complete' || badge.id === 'pathfinder-5-complete')
    return 'pathfinder_completed';
  if (badge.category === 'alchemist') return 'alchemist_count';
  if (badge.category === 'reviewer') return 'reviewer_days';
  return badge.id;
}

function getChecker(key: string): CheckerFn {
  const checkers: Record<string, CheckerFn> = {
    creator_count: async (userId) => {
      const result = await db
        .select({ value: count() })
        .from(content)
        .where(eq(content.userId, userId));
      return result[0]?.value ?? 0;
    },

    streak_longest: async (userId) => {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const result = await db.execute<{ day: string }>(sql`
        SELECT DATE(created_at) as day
        FROM ${content}
        WHERE user_id = ${userId}
          AND created_at >= ${ninetyDaysAgo.toISOString()}::timestamp
        GROUP BY DATE(created_at)
        ORDER BY day DESC
      `);

      const rows = result as unknown as { day: string }[];
      if (rows.length === 0) return 0;

      // Build activity set and compute longest streak
      const activityDates = new Set(rows.map((r) => r.day));
      const today = new Date();
      let longestStreak = 0;
      let tempStreak = 0;

      for (let i = 89; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        if (activityDates.has(dateStr)) {
          tempStreak++;
          if (tempStreak > longestStreak) longestStreak = tempStreak;
        } else {
          tempStreak = 0;
        }
      }

      return longestStreak;
    },

    sharer_count: async (userId) => {
      const result = await db
        .select({ value: count() })
        .from(tilPosts)
        .where(eq(tilPosts.userId, userId));
      return result[0]?.value ?? 0;
    },

    sharer_viral: async (userId) => {
      const result = await db
        .select({ value: max(tilPosts.upvoteCount) })
        .from(tilPosts)
        .where(eq(tilPosts.userId, userId));
      return result[0]?.value ?? 0;
    },

    curator_count: async (userId) => {
      const result = await db
        .select({ value: count() })
        .from(collections)
        .where(eq(collections.userId, userId));
      return result[0]?.value ?? 0;
    },

    curator_mega: async (userId) => {
      const result = await db
        .select({ value: count() })
        .from(contentCollections)
        .innerJoin(collections, eq(contentCollections.collectionId, collections.id))
        .where(eq(collections.userId, userId))
        .groupBy(contentCollections.collectionId)
        .orderBy(sql`count(*) DESC`)
        .limit(1);
      return result[0]?.value ?? 0;
    },

    community_published: async (userId) => {
      const result = await db
        .select({ value: count() })
        .from(marketplaceListings)
        .where(eq(marketplaceListings.userId, userId));
      return result[0]?.value ?? 0;
    },

    community_popular: async (userId) => {
      const result = await db
        .select({ value: max(marketplaceListings.cloneCount) })
        .from(marketplaceListings)
        .where(eq(marketplaceListings.userId, userId));
      return result[0]?.value ?? 0;
    },

    community_influencer: async (userId) => {
      const result = await db
        .select({ value: sql<number>`COALESCE(SUM(${marketplaceListings.cloneCount}), 0)` })
        .from(marketplaceListings)
        .where(eq(marketplaceListings.userId, userId));
      return Number(result[0]?.value ?? 0);
    },

    explorer_diverse: async (userId) => {
      const result = await db
        .select({ value: countDistinct(content.type) })
        .from(content)
        .where(eq(content.userId, userId));
      return result[0]?.value ?? 0;
    },

    explorer_tags: async (userId) => {
      const result = await db.execute<{ value: string }>(sql`
        SELECT COUNT(DISTINCT tag) as value
        FROM ${content}, unnest(${content.tags}) as tag
        WHERE user_id = ${userId}
      `);
      const rows = result as unknown as { value: string }[];
      return parseInt(rows[0]?.value ?? '0', 10);
    },

    explorer_views: async (userId) => {
      const result = await db
        .select({ value: count() })
        .from(contentViews)
        .where(eq(contentViews.userId, userId));
      return result[0]?.value ?? 0;
    },

    scholar_reviews: async (userId) => {
      const result = await db
        .select({ value: sql<number>`COALESCE(SUM(${flashcards.reviewCount}), 0)` })
        .from(flashcards)
        .where(eq(flashcards.userId, userId));
      return Number(result[0]?.value ?? 0);
    },

    pathfinder_created: async (userId) => {
      const result = await db
        .select({ value: count() })
        .from(learningPaths)
        .where(eq(learningPaths.userId, userId));
      return result[0]?.value ?? 0;
    },

    pathfinder_completed: async (userId) => {
      // Count paths where all required items are completed
      const result = await db.execute<{ completed_paths: string }>(sql`
        SELECT COUNT(*) as completed_paths FROM (
          SELECT lp.id
          FROM ${learningPaths} lp
          WHERE lp.user_id = ${userId}
            AND EXISTS (SELECT 1 FROM ${learningPathItems} lpi WHERE lpi.path_id = lp.id)
            AND NOT EXISTS (
              SELECT 1 FROM ${learningPathItems} lpi
              WHERE lpi.path_id = lp.id
                AND lpi.is_optional = false
                AND NOT EXISTS (
                  SELECT 1 FROM ${learningPathProgress} lpp
                  WHERE lpp.path_id = lp.id
                    AND lpp.user_id = ${userId}
                    AND lpp.content_id = lpi.content_id
                )
            )
        ) completed
      `);
      const rows = result as unknown as { completed_paths: string }[];
      return parseInt(rows[0]?.completed_paths ?? '0', 10);
    },

    alchemist_count: async (userId) => {
      const result = await db
        .select({ value: count() })
        .from(content)
        .where(
          and(
            eq(content.userId, userId),
            sql`${content.metadata}->>'source' = 'brain-dump'`
          )
        );
      return result[0]?.value ?? 0;
    },

    reviewer_days: async (userId) => {
      const result = await db
        .select({ value: sql<number>`COUNT(DISTINCT DATE(${contentViews.viewedAt}))` })
        .from(contentViews)
        .where(eq(contentViews.userId, userId));
      return Number(result[0]?.value ?? 0);
    },

    scholar_streak: async (userId) => {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const result = await db.execute<{ day: string }>(sql`
        SELECT DISTINCT DATE(updated_at) as day
        FROM ${flashcards}
        WHERE user_id = ${userId}
          AND review_count > 0
          AND updated_at >= ${ninetyDaysAgo.toISOString()}::timestamp
        ORDER BY day DESC
      `);

      const rows = result as unknown as { day: string }[];
      if (rows.length === 0) return 0;

      const daySet = new Set(rows.map((r) => r.day));
      const today = new Date().toISOString().slice(0, 10);
      let streak = 0;
      const checkDate = new Date();
      if (!daySet.has(today)) {
        checkDate.setDate(checkDate.getDate() - 1);
        if (!daySet.has(checkDate.toISOString().slice(0, 10))) return 0;
      }
      for (let i = 0; i < 90; i++) {
        const dateStr = checkDate.toISOString().slice(0, 10);
        if (daySet.has(dateStr)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      return streak;
    },
  };

  return checkers[key] ?? (async () => 0);
}

export async function checkBadgesForUser(
  userId: string,
  trigger: BadgeTrigger
): Promise<string[]> {
  const candidates = getBadgesByTrigger(trigger);
  if (candidates.length === 0) return [];

  // Get already unlocked badges
  const existing = await db
    .select({ badgeId: userBadges.badgeId })
    .from(userBadges)
    .where(eq(userBadges.userId, userId));
  const unlockedSet = new Set(existing.map((e) => e.badgeId));

  // Filter to only candidates not yet unlocked
  const toCheck = candidates.filter((b) => !unlockedSet.has(b.id));
  if (toCheck.length === 0) return [];

  // Group by checker key to minimize queries
  const grouped = new Map<string, BadgeDefinition[]>();
  for (const badge of toCheck) {
    const key = getCheckerKey(badge);
    const group = grouped.get(key) ?? [];
    group.push(badge);
    grouped.set(key, group);
  }

  // Run each unique checker and collect newly unlocked badges
  const newlyUnlocked: string[] = [];

  for (const [key, badges] of grouped) {
    const checker = getChecker(key);
    const value = await checker(userId);

    for (const badge of badges) {
      if (value >= badge.threshold) {
        newlyUnlocked.push(badge.id);
      }
    }
  }

  // Insert new unlocks (with conflict handling for race conditions)
  if (newlyUnlocked.length > 0) {
    await db
      .insert(userBadges)
      .values(
        newlyUnlocked.map((badgeId) => ({
          userId,
          badgeId,
        }))
      )
      .onConflictDoNothing();
  }

  return newlyUnlocked;
}

export async function getProgressForBadge(
  userId: string,
  badge: BadgeDefinition
): Promise<number> {
  const key = getCheckerKey(badge);
  const checker = getChecker(key);
  const value = await checker(userId);
  return Math.min(value, badge.threshold);
}
