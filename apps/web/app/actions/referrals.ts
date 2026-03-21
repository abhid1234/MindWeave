'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { users, referrals } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { Resend } from 'resend';
import { getInviteEmailHtml } from '@/lib/email/templates/invite';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

type ActionResult = {
  success: boolean;
  message: string;
};

type ReferralStatsResult = ActionResult & {
  referralLink?: string;
  totalClicks?: number;
  totalSignups?: number;
  totalActivated?: number;
};

export async function sendInviteEmails(emails: string[]): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    if (!Array.isArray(emails) || emails.length < 1 || emails.length > 5) {
      return { success: false, message: 'Please provide between 1 and 5 email addresses' };
    }

    const userId = session.user.id;

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { username: true, name: true },
    });

    if (!user?.username) {
      return {
        success: false,
        message: 'You need to set a username before sending invites',
      };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mindweave.app';
    const referralLink = `${appUrl}/r/${user.username}`;
    const inviterName = user.name ?? user.username;

    const resend = getResend();
    const results = await Promise.allSettled(
      emails.map((email) =>
        resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
          to: email,
          subject: `${inviterName} invited you to Mindweave`,
          html: getInviteEmailHtml(inviterName, referralLink),
        })
      )
    );

    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed > 0) {
      console.error(`[sendInviteEmails] ${failed} of ${emails.length} invites failed`);
    }

    return { success: true, message: `Invited ${emails.length - failed} contact(s) successfully` };
  } catch {
    return { success: false, message: 'Failed to send invite emails' };
  }
}

export async function trackReferralClick(username: string): Promise<ActionResult> {
  try {
    if (!username) {
      return { success: false, message: 'Username is required' };
    }

    // Look up the referrer user by username
    const referrer = await db.query.users.findFirst({
      where: eq(users.username, username),
      columns: { id: true },
    });

    if (!referrer) {
      return { success: false, message: 'User not found' };
    }

    // Find an existing pending row for this referrer or create a new one
    const existing = await db.query.referrals.findFirst({
      where: and(eq(referrals.referrerId, referrer.id), eq(referrals.status, 'pending')),
    });

    if (existing) {
      // Increment clickCount on the existing pending row
      await db
        .update(referrals)
        .set({ clickCount: sql`${referrals.clickCount} + 1` })
        .where(eq(referrals.id, existing.id));
    } else {
      // Create a new pending referral row with clickCount 1
      await db.insert(referrals).values({
        referrerId: referrer.id,
        clickCount: 1,
        status: 'pending',
      });
    }

    return { success: true, message: 'Referral click tracked' };
  } catch {
    return { success: false, message: 'Failed to track referral click' };
  }
}

export async function getReferralStats(): Promise<ReferralStatsResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const userId = session.user.id;

    // Get user's username for the referral link
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { username: true },
    });

    if (!user?.username) {
      return {
        success: false,
        message: 'You need to set a username before sharing your referral link',
      };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mindweave.app';
    const referralLink = `${appUrl}/r/${user.username}`;

    // Aggregate stats: total clicks, total signups (converted), total activated
    const stats = await db
      .select({
        totalClicks: sql<number>`COALESCE(SUM(${referrals.clickCount}), 0)`,
        totalSignups: sql<number>`COUNT(CASE WHEN ${referrals.status} IN ('converted', 'activated') THEN 1 END)`,
        totalActivated: sql<number>`COUNT(CASE WHEN ${referrals.status} = 'activated' THEN 1 END)`,
      })
      .from(referrals)
      .where(eq(referrals.referrerId, userId));

    const row = stats[0];

    return {
      success: true,
      message: 'OK',
      referralLink,
      totalClicks: Number(row?.totalClicks ?? 0),
      totalSignups: Number(row?.totalSignups ?? 0),
      totalActivated: Number(row?.totalActivated ?? 0),
    };
  } catch {
    return { success: false, message: 'Failed to get referral stats' };
  }
}
