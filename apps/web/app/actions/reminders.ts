'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { reminders, content } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { checkServerActionRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { setReminderSchema, snoozeReminderSchema } from '@/lib/validations';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getNextRemindAt } from '@/lib/reminder-utils';

type ActionResult = {
  success: boolean;
  message: string;
};

/**
 * Set a reminder for a content item with a spaced repetition interval.
 */
export async function setReminderAction(
  params: z.infer<typeof setReminderSchema>
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const rateCheck = checkServerActionRateLimit(session.user.id, 'setReminder', RATE_LIMITS.serverAction);
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    const validated = setReminderSchema.parse(params);

    // Verify content ownership
    const [item] = await db
      .select({ id: content.id })
      .from(content)
      .where(and(eq(content.id, validated.contentId), eq(content.userId, session.user.id)));

    if (!item) {
      return { success: false, message: 'Content not found' };
    }

    // Check for existing active reminder
    const [existing] = await db
      .select({ id: reminders.id })
      .from(reminders)
      .where(
        and(
          eq(reminders.contentId, validated.contentId),
          eq(reminders.userId, session.user.id),
          eq(reminders.status, 'active')
        )
      );

    if (existing) {
      return { success: false, message: 'An active reminder already exists for this content' };
    }

    await db.insert(reminders).values({
      userId: session.user.id,
      contentId: validated.contentId,
      interval: validated.interval,
      nextRemindAt: getNextRemindAt(validated.interval),
    });

    revalidatePath('/dashboard');
    return { success: true, message: 'Reminder set successfully' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.error('Set reminder error:', error);
    return { success: false, message: 'Failed to set reminder' };
  }
}

/**
 * Dismiss (complete) a reminder.
 */
export async function dismissReminderAction(reminderId: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const rateCheck = checkServerActionRateLimit(session.user.id, 'dismissReminder', RATE_LIMITS.serverAction);
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    // Verify ownership
    const [reminder] = await db
      .select({ id: reminders.id })
      .from(reminders)
      .where(and(eq(reminders.id, reminderId), eq(reminders.userId, session.user.id)));

    if (!reminder) {
      return { success: false, message: 'Reminder not found' };
    }

    await db
      .update(reminders)
      .set({ status: 'completed' })
      .where(eq(reminders.id, reminderId));

    revalidatePath('/dashboard');
    return { success: true, message: 'Reminder dismissed' };
  } catch (error) {
    console.error('Dismiss reminder error:', error);
    return { success: false, message: 'Failed to dismiss reminder' };
  }
}

/**
 * Snooze a reminder by a given duration.
 */
export async function snoozeReminderAction(
  params: z.infer<typeof snoozeReminderSchema>
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const rateCheck = checkServerActionRateLimit(session.user.id, 'snoozeReminder', RATE_LIMITS.serverAction);
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    const validated = snoozeReminderSchema.parse(params);

    // Verify ownership
    const [reminder] = await db
      .select({ id: reminders.id })
      .from(reminders)
      .where(and(eq(reminders.id, validated.reminderId), eq(reminders.userId, session.user.id)));

    if (!reminder) {
      return { success: false, message: 'Reminder not found' };
    }

    const newNextRemindAt = getNextRemindAt(validated.duration);

    await db
      .update(reminders)
      .set({ nextRemindAt: newNextRemindAt, status: 'active' })
      .where(eq(reminders.id, validated.reminderId));

    revalidatePath('/dashboard');
    return { success: true, message: 'Reminder snoozed' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.error('Snooze reminder error:', error);
    return { success: false, message: 'Failed to snooze reminder' };
  }
}

/**
 * Get all active reminders for the current user with content details.
 */
export async function getActiveRemindersAction(): Promise<{
  success: boolean;
  reminders: Array<{
    id: string;
    contentId: string;
    title: string;
    type: string;
    interval: string;
    nextRemindAt: Date;
  }>;
  message?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, reminders: [], message: 'Unauthorized' };
    }

    const results = await db
      .select({
        id: reminders.id,
        contentId: reminders.contentId,
        title: content.title,
        type: content.type,
        interval: reminders.interval,
        nextRemindAt: reminders.nextRemindAt,
      })
      .from(reminders)
      .innerJoin(content, eq(reminders.contentId, content.id))
      .where(
        and(
          eq(reminders.userId, session.user.id),
          eq(reminders.status, 'active')
        )
      )
      .orderBy(reminders.nextRemindAt);

    return { success: true, reminders: results };
  } catch (error) {
    console.error('Get active reminders error:', error);
    return { success: false, reminders: [], message: 'Failed to fetch reminders' };
  }
}
