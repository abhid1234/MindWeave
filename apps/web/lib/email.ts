import { Resend } from 'resend';
import crypto from 'crypto';
import { db } from './db/client';
import { verificationTokens, users } from './db/schema';
import { eq, and } from 'drizzle-orm';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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
  const expires = Math.floor(Date.now() / 1000) + 3600; // 1 hour

  await db.insert(verificationTokens).values({
    identifier: email,
    token: hashedToken,
    expires,
  });

  const resetUrl = `${APP_URL}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
    to: email,
    subject: 'Reset your Mindweave password',
    html: `
      <h2>Reset your password</h2>
      <p>You requested a password reset for your Mindweave account.</p>
      <p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;">Reset Password</a></p>
      <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    `,
  });
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
