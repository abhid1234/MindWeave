import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { reminders, content } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { sendPushNotification } from '@/lib/push-notifications';
import { getNextInterval, getNextRemindAt } from '@/lib/reminder-utils';

/**
 * POST /api/cron/reminders
 * Called by Cloud Scheduler (hourly).
 * Processes due reminders: sends push notifications and advances spaced repetition intervals.
 * Auth: CRON_SECRET bearer token.
 */
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET not configured' },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find due reminders
    const dueReminders = await db
      .select({
        id: reminders.id,
        userId: reminders.userId,
        contentId: reminders.contentId,
        interval: reminders.interval,
        title: content.title,
      })
      .from(reminders)
      .innerJoin(content, eq(reminders.contentId, content.id))
      .where(
        and(
          eq(reminders.status, 'active'),
          sql`${reminders.nextRemindAt} <= now()`
        )
      );

    let processed = 0;
    let completed = 0;

    for (const reminder of dueReminders) {
      try {
        // Send push notification
        sendPushNotification(
          reminder.userId,
          'Time to revisit!',
          reminder.title
        ).catch((err) => console.error('[Reminders] Push notification failed:', err));

        // Advance to next interval
        const nextInterval = getNextInterval(reminder.interval);

        if (nextInterval) {
          await db
            .update(reminders)
            .set({
              interval: nextInterval,
              nextRemindAt: getNextRemindAt(nextInterval),
            })
            .where(eq(reminders.id, reminder.id));
        } else {
          // No more intervals — mark as completed
          await db
            .update(reminders)
            .set({ status: 'completed' })
            .where(eq(reminders.id, reminder.id));
          completed++;
        }

        processed++;
      } catch (error) {
        console.error(`[Reminders] Failed for reminder ${reminder.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      due: dueReminders.length,
      processed,
      completed,
    });
  } catch (error) {
    console.error('[Reminders Cron] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
