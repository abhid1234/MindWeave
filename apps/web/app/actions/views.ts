'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { contentViews, content } from '@/lib/db/schema';
import { eq, and, desc, gte, sql } from 'drizzle-orm';

const DEBOUNCE_SECONDS = 30;

/**
 * Track a content view. Debounces duplicate views within 30 seconds.
 */
export async function trackContentViewAction(
  contentId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized.' };
    }

    if (!contentId || typeof contentId !== 'string') {
      return { success: false, message: 'Invalid content ID.' };
    }

    const userId = session.user.id;

    // Debounce: skip if same user+content viewed within 30s
    const debounceThreshold = new Date(Date.now() - DEBOUNCE_SECONDS * 1000);
    const recentView = await db.query.contentViews.findFirst({
      where: and(
        eq(contentViews.userId, userId),
        eq(contentViews.contentId, contentId),
        gte(contentViews.viewedAt, debounceThreshold)
      ),
    });

    if (recentView) {
      return { success: true }; // Already tracked recently
    }

    await db.insert(contentViews).values({
      userId,
      contentId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error tracking content view:', error);
    return { success: false, message: 'Failed to track view.' };
  }
}

export type RecentlyViewedItem = {
  id: string;
  title: string;
  type: string;
  lastViewedAt: Date;
};

/**
 * Get recently viewed content items (distinct, most recent first).
 */
export async function getRecentlyViewedAction(
  limit: number = 10
): Promise<{ success: boolean; items: RecentlyViewedItem[]; message?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, items: [], message: 'Unauthorized.' };
    }

    const validLimit = Math.min(Math.max(1, limit), 50);

    const results = await db.execute(sql`
      SELECT DISTINCT ON (c.id)
        c.id,
        c.title,
        c.type,
        cv.viewed_at as "lastViewedAt"
      FROM ${contentViews} cv
      INNER JOIN ${content} c ON cv.content_id = c.id
      WHERE cv.user_id = ${session.user.id}
      ORDER BY c.id, cv.viewed_at DESC
    `);

    // Sort by lastViewedAt DESC and limit
    const items = (results as unknown as Record<string, unknown>[])
      .map((row) => ({
        id: row.id as string,
        title: row.title as string,
        type: row.type as string,
        lastViewedAt: row.lastViewedAt instanceof Date
          ? row.lastViewedAt
          : new Date(row.lastViewedAt as string),
      }))
      .sort((a, b) => b.lastViewedAt.getTime() - a.lastViewedAt.getTime())
      .slice(0, validLimit);

    return { success: true, items };
  } catch (error) {
    console.error('Error getting recently viewed:', error);
    return { success: false, items: [], message: 'Failed to get recently viewed.' };
  }
}

/**
 * Get Set of content IDs the user has viewed since a given date.
 * If no date is provided, returns all viewed content IDs.
 */
export async function getViewedContentIdsAction(
  since?: Date
): Promise<{ success: boolean; ids: string[]; message?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, ids: [], message: 'Unauthorized.' };
    }

    const conditions = [eq(contentViews.userId, session.user.id)];
    if (since) {
      conditions.push(gte(contentViews.viewedAt, since));
    }

    const results = await db
      .selectDistinct({ contentId: contentViews.contentId })
      .from(contentViews)
      .where(and(...conditions));

    return {
      success: true,
      ids: results.map((r) => r.contentId),
    };
  } catch (error) {
    console.error('Error getting viewed content IDs:', error);
    return { success: false, ids: [], message: 'Failed to get viewed IDs.' };
  }
}
