'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { flashcards, content } from '@/lib/db/schema';
import { eq, and, lte, sql } from 'drizzle-orm';
import { checkServerActionRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { generateFlashcardsSchema, rateFlashcardSchema } from '@/lib/validations';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { generateFlashcards } from '@/lib/ai/flashcards';
import { getNextRemindAt, getNextInterval } from '@/lib/reminder-utils';
import { checkBadgesForUser } from '@/lib/badges/engine';

type ActionResult = {
  success: boolean;
  message: string;
};

/**
 * Generate flashcards for a content item using AI.
 */
export async function generateFlashcardsAction(
  params: z.infer<typeof generateFlashcardsSchema>
): Promise<ActionResult & { count?: number }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const rateCheck = checkServerActionRateLimit(
      session.user.id,
      'generateFlashcards',
      RATE_LIMITS.serverActionAI
    );
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    const validated = generateFlashcardsSchema.parse(params);

    // Verify content ownership
    const [item] = await db
      .select({
        id: content.id,
        title: content.title,
        body: content.body,
        tags: content.tags,
        autoTags: content.autoTags,
      })
      .from(content)
      .where(and(eq(content.id, validated.contentId), eq(content.userId, session.user.id)));

    if (!item) {
      return { success: false, message: 'Content not found' };
    }

    // Generate flashcards via AI
    const pairs = await generateFlashcards({
      title: item.title,
      body: item.body,
      tags: item.tags,
      autoTags: item.autoTags,
    });

    if (pairs.length === 0) {
      return { success: false, message: 'Could not generate flashcards for this content' };
    }

    // Delete existing cards for this content
    await db
      .delete(flashcards)
      .where(
        and(eq(flashcards.contentId, validated.contentId), eq(flashcards.userId, session.user.id))
      );

    // Bulk insert new cards
    const now = new Date();
    await db.insert(flashcards).values(
      pairs.map((pair) => ({
        contentId: validated.contentId,
        userId: session.user!.id!,
        question: pair.question,
        answer: pair.answer,
        nextReviewAt: now,
      }))
    );

    revalidatePath('/dashboard/study');
    return { success: true, message: `Generated ${pairs.length} flashcards`, count: pairs.length };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.error('Generate flashcards error:', error);
    return { success: false, message: 'Failed to generate flashcards' };
  }
}

/**
 * Get due flashcards for the current user.
 */
export async function getDueFlashcardsAction(): Promise<{
  success: boolean;
  cards: Array<{
    id: string;
    question: string;
    answer: string;
    interval: string;
    contentTitle: string;
    contentId: string;
  }>;
  message?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, cards: [], message: 'Unauthorized' };
    }

    const rateCheck = checkServerActionRateLimit(
      session.user.id,
      'getDueFlashcards',
      RATE_LIMITS.serverAction
    );
    if (!rateCheck.success) {
      return { success: false, cards: [], message: rateCheck.message! };
    }

    const now = new Date();
    const results = await db
      .select({
        id: flashcards.id,
        question: flashcards.question,
        answer: flashcards.answer,
        interval: flashcards.interval,
        contentTitle: content.title,
        contentId: flashcards.contentId,
      })
      .from(flashcards)
      .innerJoin(content, eq(flashcards.contentId, content.id))
      .where(
        and(
          eq(flashcards.userId, session.user.id),
          eq(flashcards.status, 'active'),
          lte(flashcards.nextReviewAt, now)
        )
      )
      .orderBy(flashcards.nextReviewAt)
      .limit(20);

    return { success: true, cards: results };
  } catch (error) {
    console.error('Get due flashcards error:', error);
    return { success: false, cards: [], message: 'Failed to fetch flashcards' };
  }
}

/**
 * Rate a flashcard after review (easy/hard/again).
 */
export async function rateFlashcardAction(
  params: z.infer<typeof rateFlashcardSchema>
): Promise<ActionResult & { newBadges?: string[] }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const rateCheck = checkServerActionRateLimit(
      session.user.id,
      'rateFlashcard',
      RATE_LIMITS.serverAction
    );
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    const validated = rateFlashcardSchema.parse(params);

    // Get the card and verify ownership
    const [card] = await db
      .select({
        id: flashcards.id,
        interval: flashcards.interval,
        reviewCount: flashcards.reviewCount,
      })
      .from(flashcards)
      .where(and(eq(flashcards.id, validated.cardId), eq(flashcards.userId, session.user.id)));

    if (!card) {
      return { success: false, message: 'Flashcard not found' };
    }

    let newInterval = card.interval;
    let newStatus = 'active';

    if (validated.rating === 'easy') {
      const next = getNextInterval(card.interval);
      if (next) {
        newInterval = next;
      } else {
        // At 30d with easy → suspend
        newStatus = 'suspended';
      }
    } else if (validated.rating === 'again') {
      newInterval = '1d';
    }
    // 'hard' keeps current interval

    const nextReviewAt =
      newStatus === 'suspended'
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // far future
        : getNextRemindAt(newInterval);

    await db
      .update(flashcards)
      .set({
        interval: newInterval,
        nextReviewAt,
        reviewCount: card.reviewCount + 1,
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(flashcards.id, validated.cardId));

    // Check badges
    const newBadges = await checkBadgesForUser(session.user.id, 'flashcard_reviewed');

    revalidatePath('/dashboard/study');
    return { success: true, message: 'Card rated', newBadges };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.error('Rate flashcard error:', error);
    return { success: false, message: 'Failed to rate flashcard' };
  }
}

/**
 * Get study statistics for the current user.
 */
export async function getStudyStatsAction(): Promise<{
  success: boolean;
  stats?: {
    totalCards: number;
    dueToday: number;
    reviewedToday: number;
    studyStreak: number;
  };
  message?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const userId = session.user.id;
    const now = new Date();

    // Total active cards
    const [totalResult] = await db
      .select({ value: sql<number>`count(*)` })
      .from(flashcards)
      .where(and(eq(flashcards.userId, userId), eq(flashcards.status, 'active')));

    // Due today
    const [dueResult] = await db
      .select({ value: sql<number>`count(*)` })
      .from(flashcards)
      .where(
        and(
          eq(flashcards.userId, userId),
          eq(flashcards.status, 'active'),
          lte(flashcards.nextReviewAt, now)
        )
      );

    // Reviewed today
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const [reviewedResult] = await db
      .select({ value: sql<number>`count(*)` })
      .from(flashcards)
      .where(
        and(
          eq(flashcards.userId, userId),
          sql`${flashcards.reviewCount} > 0`,
          sql`${flashcards.updatedAt} >= ${todayStart.toISOString()}::timestamp`
        )
      );

    // Study streak (consecutive days with reviews)
    const streakResult = await db.execute<{ day: string }>(sql`
      SELECT DISTINCT DATE(updated_at) as day
      FROM flashcards
      WHERE user_id = ${userId}
        AND review_count > 0
        AND updated_at >= ${new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()}::timestamp
      ORDER BY day DESC
    `);

    const rows = streakResult as unknown as { day: string }[];
    let studyStreak = 0;
    const today = new Date().toISOString().slice(0, 10);

    if (rows.length > 0) {
      const daySet = new Set(rows.map((r) => r.day));
      // Check if today or yesterday starts the streak
      const d = new Date();
      if (!daySet.has(today)) {
        d.setDate(d.getDate() - 1);
        if (!daySet.has(d.toISOString().slice(0, 10))) {
          studyStreak = 0;
        }
      }
      // Count consecutive days backwards
      const checkDate = new Date();
      if (!daySet.has(today)) {
        checkDate.setDate(checkDate.getDate() - 1);
      }
      for (let i = 0; i < 90; i++) {
        const dateStr = checkDate.toISOString().slice(0, 10);
        if (daySet.has(dateStr)) {
          studyStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    return {
      success: true,
      stats: {
        totalCards: Number(totalResult?.value ?? 0),
        dueToday: Number(dueResult?.value ?? 0),
        reviewedToday: Number(reviewedResult?.value ?? 0),
        studyStreak,
      },
    };
  } catch (error) {
    console.error('Get study stats error:', error);
    return { success: false, message: 'Failed to fetch study stats' };
  }
}

/**
 * Delete all flashcards for a content item.
 */
export async function deleteFlashcardsAction(contentId: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const rateCheck = checkServerActionRateLimit(
      session.user.id,
      'deleteFlashcards',
      RATE_LIMITS.serverAction
    );
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    // Verify content ownership
    const [item] = await db
      .select({ id: content.id })
      .from(content)
      .where(and(eq(content.id, contentId), eq(content.userId, session.user.id)));

    if (!item) {
      return { success: false, message: 'Content not found' };
    }

    await db
      .delete(flashcards)
      .where(and(eq(flashcards.contentId, contentId), eq(flashcards.userId, session.user.id)));

    revalidatePath('/dashboard/study');
    return { success: true, message: 'Flashcards deleted' };
  } catch (error) {
    console.error('Delete flashcards error:', error);
    return { success: false, message: 'Failed to delete flashcards' };
  }
}
