import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { digestSettings, users } from '@/lib/db/schema';
import { eq, and, or, isNull, lt } from 'drizzle-orm';
import { sendDigestEmail } from '@/lib/email';

/**
 * POST /api/cron/digest
 * Called by Cloud Scheduler every hour.
 * Sends digest emails to eligible users.
 * Auth: CRON_SECRET bearer token.
 */
export async function POST(request: NextRequest) {
  // Authenticate cron request
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

  const now = new Date();
  const currentHour = now.getUTCHours();
  const currentDay = now.getUTCDay(); // 0=Sun, 1=Mon, ...
  const twentyThreeHoursAgo = new Date(now.getTime() - 23 * 60 * 60 * 1000);

  try {
    // Find eligible users: enabled, matching hour,
    // and either daily or (weekly + matching day),
    // and not sent in the last 23 hours
    const eligibleUsers = await db
      .select({
        userId: digestSettings.userId,
        email: users.email,
        frequency: digestSettings.frequency,
      })
      .from(digestSettings)
      .innerJoin(users, eq(digestSettings.userId, users.id))
      .where(
        and(
          eq(digestSettings.enabled, true),
          eq(digestSettings.preferredHour, currentHour),
          or(
            eq(digestSettings.frequency, 'daily'),
            and(
              eq(digestSettings.frequency, 'weekly'),
              eq(digestSettings.preferredDay, currentDay)
            )
          ),
          or(
            isNull(digestSettings.lastSentAt),
            lt(digestSettings.lastSentAt, twentyThreeHoursAgo)
          )
        )
      );

    let sentCount = 0;
    let skippedCount = 0;

    for (const user of eligibleUsers) {
      try {
        const sent = await sendDigestEmail(user.userId, user.email);
        if (sent) {
          await db
            .update(digestSettings)
            .set({ lastSentAt: now })
            .where(eq(digestSettings.userId, user.userId));
          sentCount++;
        } else {
          skippedCount++; // Nothing new to report
        }
      } catch (error) {
        console.error(`[Digest] Failed for user ${user.userId}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      eligible: eligibleUsers.length,
      sent: sentCount,
      skipped: skippedCount,
    });
  } catch (error) {
    console.error('[Digest Cron] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
