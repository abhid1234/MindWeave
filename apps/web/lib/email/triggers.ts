import { Resend } from 'resend';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { gte } from 'drizzle-orm';
import { ACTIVATION_EMAILS } from './templates/activation';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const DAY_OFFSETS = [0, 1, 3, 5, 7] as const;

/**
 * Sends activation drip emails to new users.
 * Designed to be called by a daily cron job.
 * Queries users who signed up within the last 8 days and sends
 * the activation email that matches their daysSinceSignup.
 */
export async function sendActivationDripEmails(): Promise<{ sent: number; errors: number }> {
  const now = new Date();
  const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);

  // Fetch users who signed up in the last 8 days and have emails
  const newUsers = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(gte(users.createdAt, eightDaysAgo));

  let sent = 0;
  let errors = 0;

  const resend = getResend();

  for (const user of newUsers) {
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysSinceSignup = Math.floor(
      (now.getTime() - new Date(user.createdAt).getTime()) / msPerDay
    );

    // Check if this day offset has a scheduled email
    if (!(DAY_OFFSETS as readonly number[]).includes(daysSinceSignup)) {
      continue;
    }

    const emailFactory = ACTIVATION_EMAILS[daysSinceSignup];
    if (!emailFactory) continue;

    const userName = user.name ?? user.email.split('@')[0];
    const email = emailFactory(userName);

    try {
      const { error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: user.email,
        subject: email.subject,
        html: email.html,
      });

      if (error) {
        console.error(
          `[ActivationDrip] Failed to send day-${daysSinceSignup} email to ${user.email}:`,
          error
        );
        errors++;
      } else {
        console.log(`[ActivationDrip] Sent day-${daysSinceSignup} email to ${user.email}`);
        sent++;
      }
    } catch (err) {
      console.error(
        `[ActivationDrip] Exception sending day-${daysSinceSignup} email to ${user.email}:`,
        err
      );
      errors++;
    }
  }

  console.log(`[ActivationDrip] Complete — sent: ${sent}, errors: ${errors}`);
  return { sent, errors };
}
