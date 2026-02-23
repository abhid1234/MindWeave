import { Resend } from 'resend';
import crypto from 'crypto';
import { db } from './db/client';
import { verificationTokens, content } from './db/schema';
import { eq, and, desc, gte, sql } from 'drizzle-orm';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const APP_URL = process.env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function sendPasswordResetEmail(email: string): Promise<void> {
  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, email),
  });

  // Only send if user exists and has a password (not OAuth-only)
  if (!user || !user.password) return;

  // Delete any existing reset tokens for this email
  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, email));

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = hashToken(rawToken);
  const expires = Math.floor(Date.now() / 1000) + 1800; // 30 minutes

  await db.insert(verificationTokens).values({
    identifier: email,
    token: hashedToken,
    expires,
  });

  const resetUrl = `${APP_URL}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

  const { data, error } = await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
    to: email,
    subject: 'Reset your Mindweave password',
    html: `
      <h2>Reset your password</h2>
      <p>You requested a password reset for your Mindweave account.</p>
      <p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;">Reset Password</a></p>
      <p>This link expires in 30 minutes. If you didn't request this, ignore this email.</p>
    `,
  });

  if (error) {
    console.error('[Password Reset] Resend API error:', JSON.stringify(error));
  } else {
    console.warn('[Password Reset] Email sent successfully, id:', data?.id);
  }
}

export async function sendVerificationEmail(email: string): Promise<void> {
  // Delete any existing verification tokens for this email
  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, `verify:${email}`));

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = hashToken(rawToken);
  const expires = Math.floor(Date.now() / 1000) + 86400; // 24 hours

  await db.insert(verificationTokens).values({
    identifier: `verify:${email}`,
    token: hashedToken,
    expires,
  });

  const verifyUrl = `${APP_URL}/verify-email?token=${rawToken}&email=${encodeURIComponent(email)}`;

  const { data, error } = await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
    to: email,
    subject: 'Verify your Mindweave email',
    html: `
      <h2>Verify your email</h2>
      <p>Welcome to Mindweave! Please verify your email address to get started.</p>
      <p><a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;">Verify Email</a></p>
      <p>This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
    `,
  });

  if (error) {
    console.error('[Email Verification] Resend API error:', JSON.stringify(error));
  } else {
    console.warn('[Email Verification] Email sent successfully, id:', data?.id);
  }
}

export async function consumeVerificationToken(
  email: string,
  rawToken: string
): Promise<boolean> {
  const hashedToken = hashToken(rawToken);
  const now = Math.floor(Date.now() / 1000);

  const record = await db.query.verificationTokens.findFirst({
    where: (vt, { eq, and }) =>
      and(eq(vt.identifier, `verify:${email}`), eq(vt.token, hashedToken)),
  });

  if (!record || record.expires < now) return false;

  await db
    .delete(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, `verify:${email}`),
        eq(verificationTokens.token, hashedToken)
      )
    );

  return true;
}

export async function verifyResetToken(
  email: string,
  rawToken: string
): Promise<boolean> {
  const hashedToken = hashToken(rawToken);
  const now = Math.floor(Date.now() / 1000);

  const record = await db.query.verificationTokens.findFirst({
    where: (vt, { eq, and }) =>
      and(eq(vt.identifier, email), eq(vt.token, hashedToken)),
  });

  if (!record) return false;
  if (record.expires < now) return false;

  return true;
}

export async function consumeResetToken(
  email: string,
  rawToken: string
): Promise<boolean> {
  const hashedToken = hashToken(rawToken);
  const now = Math.floor(Date.now() / 1000);

  const record = await db.query.verificationTokens.findFirst({
    where: (vt, { eq, and }) =>
      and(eq(vt.identifier, email), eq(vt.token, hashedToken)),
  });

  if (!record || record.expires < now) return false;

  await db
    .delete(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, email),
        eq(verificationTokens.token, hashedToken)
      )
    );

  return true;
}

export async function sendDigestEmail(
  userId: string,
  email: string
): Promise<boolean> {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Get recent content stats
  const recentItems = await db
    .select({
      id: content.id,
      type: content.type,
      title: content.title,
      autoTags: content.autoTags,
      createdAt: content.createdAt,
    })
    .from(content)
    .where(and(eq(content.userId, userId), gte(content.createdAt, oneWeekAgo)))
    .orderBy(desc(content.createdAt))
    .limit(10);

  if (recentItems.length === 0) {
    return false; // Nothing new to report
  }

  // Count by type
  const countResult = await db
    .select({
      type: content.type,
      count: sql<number>`count(*)::int`,
    })
    .from(content)
    .where(and(eq(content.userId, userId), gte(content.createdAt, oneWeekAgo)))
    .groupBy(content.type);

  const counts: Record<string, number> = {};
  for (const row of countResult) {
    counts[row.type] = row.count;
  }

  // Collect unique auto-tags
  const allAutoTags = new Set<string>();
  for (const item of recentItems) {
    for (const tag of item.autoTags) {
      allAutoTags.add(tag);
    }
  }

  const totalNew = (counts['note'] || 0) + (counts['link'] || 0) + (counts['file'] || 0);
  const topTags = Array.from(allAutoTags).slice(0, 8);

  const itemsHtml = recentItems
    .map(
      (item) =>
        `<li style="margin-bottom:8px;"><strong>${escapeHtml(item.title)}</strong> <span style="color:#6b7280;font-size:12px;">(${item.type})</span></li>`
    )
    .join('');

  const tagsHtml = topTags.length > 0
    ? `<p style="margin-top:16px;"><strong>AI-discovered topics:</strong> ${topTags.map((t) => `<span style="display:inline-block;background:#eff6ff;color:#2563eb;padding:2px 8px;border-radius:12px;font-size:12px;margin:2px;">${escapeHtml(t)}</span>`).join(' ')}</p>`
    : '';

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;">
      <h2 style="color:#1f2937;">Your Mindweave Digest</h2>
      <p>You added <strong>${totalNew} item${totalNew !== 1 ? 's' : ''}</strong> this week${counts['note'] ? ` (${counts['note']} note${counts['note'] !== 1 ? 's' : ''})` : ''}${counts['link'] ? ` (${counts['link']} link${counts['link'] !== 1 ? 's' : ''})` : ''}${counts['file'] ? ` (${counts['file']} file${counts['file'] !== 1 ? 's' : ''})` : ''}.</p>
      <h3 style="color:#374151;margin-top:20px;">Recent items</h3>
      <ul style="padding-left:20px;">${itemsHtml}</ul>
      ${tagsHtml}
      <p style="margin-top:24px;">
        <a href="${APP_URL}/dashboard/library" style="display:inline-block;padding:10px 20px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;">Open Mindweave</a>
      </p>
      <p style="margin-top:24px;font-size:12px;color:#9ca3af;">
        You can change your digest preferences in <a href="${APP_URL}/dashboard/profile" style="color:#6366f1;">Profile Settings</a>.
      </p>
    </div>
  `;

  const { error } = await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
    to: email,
    subject: `Your Mindweave Weekly Digest - ${totalNew} new item${totalNew !== 1 ? 's' : ''}`,
    html,
  });

  if (error) {
    console.error('[Digest] Resend API error:', JSON.stringify(error));
    return false;
  }

  return true;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
