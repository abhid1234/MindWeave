'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { content, contentViews, flashcards, reminders } from '@/lib/db/schema';
import { markReviewedSchema } from '@/lib/validations';
import { checkServerActionRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { checkAndUnlockBadgesAction } from './badges';
import { revalidatePath } from 'next/cache';
import { eq, and, sql, lte, isNull } from 'drizzle-orm';
import { z } from 'zod';

export type ReviewQueueItem = {
  id: string;
  type: 'flashcard' | 'reminder' | 'content';
  source: 'flashcard' | 'reminder' | 'stale' | 'rediscovery';
  label: string;
  title: string;
  body?: string;
  contentType?: string;
  tags: string[];
  question?: string;
  answer?: string;
  flashcardId?: string;
  reminderId?: string;
  contentId: string;
};

export type ReviewQueueResult = {
  success: boolean;
  queue: ReviewQueueItem[];
  message?: string;
};

export async function getReviewQueueAction(): Promise<ReviewQueueResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, queue: [], message: 'Unauthorized' };
    }

    const rateCheck = checkServerActionRateLimit(
      session.user.id,
      'getReviewQueue',
      RATE_LIMITS.serverAction
    );
    if (!rateCheck.success) {
      return { success: false, queue: [], message: rateCheck.message! };
    }

    const userId = session.user.id;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get content IDs already reviewed today
    const reviewedToday = await db
      .select({ contentId: contentViews.contentId })
      .from(contentViews)
      .where(
        and(
          eq(contentViews.userId, userId),
          sql`${contentViews.viewedAt} >= ${startOfToday.toISOString()}::timestamp`
        )
      );
    const reviewedIds = new Set(reviewedToday.map((r) => r.contentId));

    const queue: ReviewQueueItem[] = [];

    // 1. Due flashcards (max 3)
    const dueFlashcards = await db
      .select({
        flashcardId: flashcards.id,
        contentId: flashcards.contentId,
        question: flashcards.question,
        answer: flashcards.answer,
        title: content.title,
        body: content.body,
        contentType: content.type,
        tags: content.tags,
      })
      .from(flashcards)
      .innerJoin(content, eq(flashcards.contentId, content.id))
      .where(
        and(
          eq(flashcards.userId, userId),
          eq(flashcards.status, 'active'),
          lte(flashcards.nextReviewAt, now)
        )
      )
      .limit(3);

    for (const fc of dueFlashcards) {
      if (reviewedIds.has(fc.contentId)) continue;
      queue.push({
        id: `flashcard-${fc.flashcardId}`,
        type: 'flashcard',
        source: 'flashcard',
        label: 'Flashcard',
        title: fc.title,
        body: fc.body ?? undefined,
        contentType: fc.contentType,
        tags: fc.tags ?? [],
        question: fc.question,
        answer: fc.answer,
        flashcardId: fc.flashcardId,
        contentId: fc.contentId,
      });
    }

    // 2. Due reminders (max 2)
    const dueReminders = await db
      .select({
        reminderId: reminders.id,
        contentId: reminders.contentId,
        title: content.title,
        body: content.body,
        contentType: content.type,
        tags: content.tags,
      })
      .from(reminders)
      .innerJoin(content, eq(reminders.contentId, content.id))
      .where(
        and(
          eq(reminders.userId, userId),
          eq(reminders.status, 'active'),
          lte(reminders.nextRemindAt, now)
        )
      )
      .limit(2);

    for (const rem of dueReminders) {
      if (reviewedIds.has(rem.contentId)) continue;
      queue.push({
        id: `reminder-${rem.reminderId}`,
        type: 'reminder',
        source: 'reminder',
        label: 'Due Reminder',
        title: rem.title,
        body: rem.body ?? undefined,
        contentType: rem.contentType,
        tags: rem.tags ?? [],
        reminderId: rem.reminderId,
        contentId: rem.contentId,
      });
    }

    // 3. Stale content - created >14d ago with 0 views (max 2)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const staleContent = await db
      .select({
        id: content.id,
        title: content.title,
        body: content.body,
        contentType: content.type,
        tags: content.tags,
      })
      .from(content)
      .leftJoin(contentViews, eq(content.id, contentViews.contentId))
      .where(
        and(
          eq(content.userId, userId),
          sql`${content.createdAt} <= ${fourteenDaysAgo.toISOString()}::timestamp`,
          isNull(contentViews.id)
        )
      )
      .limit(2);

    for (const item of staleContent) {
      if (reviewedIds.has(item.id)) continue;
      queue.push({
        id: `stale-${item.id}`,
        type: 'content',
        source: 'stale',
        label: 'Forgotten Gem',
        title: item.title,
        body: item.body ?? undefined,
        contentType: item.contentType,
        tags: item.tags ?? [],
        contentId: item.id,
      });
    }

    // 4. Rediscovery - not viewed in >30d, pseudo-random (max 1)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const todayStr = now.toISOString().slice(0, 10);

    const rediscovery = await db
      .select({
        id: content.id,
        title: content.title,
        body: content.body,
        contentType: content.type,
        tags: content.tags,
      })
      .from(content)
      .where(
        and(
          eq(content.userId, userId),
          sql`NOT EXISTS (
            SELECT 1 FROM content_views cv
            WHERE cv.content_id = ${content.id}
              AND cv.viewed_at >= ${thirtyDaysAgo.toISOString()}::timestamp
          )`
        )
      )
      .orderBy(sql`md5(${content.id}::text || ${todayStr})`)
      .limit(1);

    for (const item of rediscovery) {
      if (reviewedIds.has(item.id)) continue;
      // Don't add if already in queue from stale
      const alreadyInQueue = queue.some((q) => q.contentId === item.id);
      if (!alreadyInQueue) {
        queue.push({
          id: `rediscovery-${item.id}`,
          type: 'content',
          source: 'rediscovery',
          label: 'Rediscovery',
          title: item.title,
          body: item.body ?? undefined,
          contentType: item.contentType,
          tags: item.tags ?? [],
          contentId: item.id,
        });
      }
    }

    return { success: true, queue: queue.slice(0, 8) };
  } catch (error) {
    console.error('Get review queue error:', error);
    return { success: false, queue: [], message: 'Failed to load review queue' };
  }
}

export async function markReviewedAction(
  contentId: string
): Promise<{ success: boolean; message?: string; newBadges?: string[] }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const rateCheck = checkServerActionRateLimit(
      session.user.id,
      'markReviewed',
      RATE_LIMITS.serverAction
    );
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    const validated = markReviewedSchema.parse({ contentId });

    // Insert a content view
    await db.insert(contentViews).values({
      userId: session.user.id,
      contentId: validated.contentId,
    });

    // Check badges
    const badgeResult = await checkAndUnlockBadgesAction('review_completed');
    const newBadges = badgeResult.success ? (badgeResult as { newlyUnlocked?: string[] }).newlyUnlocked : undefined;

    revalidatePath('/dashboard/review');

    return { success: true, message: 'Marked as reviewed', newBadges };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.error('Mark reviewed error:', error);
    return { success: false, message: 'Failed to mark as reviewed' };
  }
}
