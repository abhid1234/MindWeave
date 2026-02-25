'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { dailyHighlights, content, contentViews } from '@/lib/db/schema';
import { eq, and, sql, not, inArray } from 'drizzle-orm';
import { checkServerActionRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { generateHighlightInsight } from '@/lib/ai/gemini';

type HighlightResult = {
  success: boolean;
  message?: string;
  highlight?: {
    contentId: string;
    title: string;
    type: string;
    insight: string;
    tags: string[];
  } | null;
};

/**
 * Get the daily highlight for the current user.
 * Returns a cached highlight if one exists for today, otherwise generates a new one.
 */
export async function getDailyHighlightAction(): Promise<HighlightResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const rateCheck = checkServerActionRateLimit(session.user.id, 'getDailyHighlight', RATE_LIMITS.serverActionAI);
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

    // Check cache first
    const [cached] = await db
      .select()
      .from(dailyHighlights)
      .where(and(eq(dailyHighlights.userId, session.user.id), eq(dailyHighlights.date, today)));

    if (cached) {
      // Fetch the content for the cached highlight
      const [item] = await db
        .select({
          id: content.id,
          title: content.title,
          type: content.type,
          tags: content.tags,
        })
        .from(content)
        .where(eq(content.id, cached.contentId));

      if (!item) {
        // Content was deleted; clear stale highlight
        await db.delete(dailyHighlights).where(eq(dailyHighlights.userId, session.user.id));
        return { success: true, highlight: null };
      }

      return {
        success: true,
        highlight: {
          contentId: item.id,
          title: item.title,
          type: item.type,
          insight: cached.insight,
          tags: item.tags ?? [],
        },
      };
    }

    // Get content IDs viewed in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentlyViewed = await db
      .select({ contentId: contentViews.contentId })
      .from(contentViews)
      .where(
        and(
          eq(contentViews.userId, session.user.id),
          sql`${contentViews.viewedAt} >= ${sevenDaysAgo}`
        )
      );

    const recentIds = recentlyViewed.map((v) => v.contentId);

    // Find eligible content (has body or tags, not recently viewed)
    let eligibleQuery = db
      .select({
        id: content.id,
        title: content.title,
        type: content.type,
        body: content.body,
        tags: content.tags,
      })
      .from(content)
      .where(
        and(
          eq(content.userId, session.user.id),
          sql`(${content.body} IS NOT NULL OR array_length(${content.tags}, 1) > 0)`,
          ...(recentIds.length > 0 ? [not(inArray(content.id, recentIds))] : [])
        )
      )
      .orderBy(sql`md5(${content.id} || ${today})`)
      .limit(1);

    const eligible = await eligibleQuery;

    if (eligible.length === 0) {
      return { success: true, highlight: null };
    }

    const picked = eligible[0];

    // Generate AI insight
    const insight = await generateHighlightInsight({
      title: picked.title,
      body: picked.body ?? undefined,
      tags: picked.tags ?? [],
    });

    // Cache the highlight
    await db
      .insert(dailyHighlights)
      .values({
        userId: session.user.id,
        contentId: picked.id,
        insight,
        date: today,
      })
      .onConflictDoUpdate({
        target: dailyHighlights.userId,
        set: {
          contentId: picked.id,
          insight,
          date: today,
          createdAt: new Date(),
        },
      });

    return {
      success: true,
      highlight: {
        contentId: picked.id,
        title: picked.title,
        type: picked.type,
        insight,
        tags: picked.tags ?? [],
      },
    };
  } catch (error) {
    console.error('Get daily highlight error:', error);
    return { success: false, message: 'Failed to get daily highlight' };
  }
}

/**
 * Dismiss the daily highlight by marking the content as viewed.
 */
export async function dismissHighlightAction(contentId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const rateCheck = checkServerActionRateLimit(session.user.id, 'dismissHighlight', RATE_LIMITS.serverAction);
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    // Insert a content view to mark as seen
    await db.insert(contentViews).values({
      userId: session.user.id,
      contentId,
    });

    // Delete the cached highlight
    await db.delete(dailyHighlights).where(eq(dailyHighlights.userId, session.user.id));

    return { success: true, message: 'Highlight dismissed' };
  } catch (error) {
    console.error('Dismiss highlight error:', error);
    return { success: false, message: 'Failed to dismiss highlight' };
  }
}
