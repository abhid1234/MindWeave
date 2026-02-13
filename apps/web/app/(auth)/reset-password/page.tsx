import Link from 'next/link';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { consumeResetToken } from '@/lib/email';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { signIn } from '@/lib/auth';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { token, email, error } = params;

  // SECURITY: Only validate token presence on page load — don't verify against DB here.
  // Token is consumed (single-use) only on form submit via consumeResetToken().
  // This prevents the token from being "used up" just by visiting the link.
  if (!token || !email) {
    return (
      <main id="main-content" tabIndex={-1} className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">Mindweave</h1>
            <p className="mt-2 text-sm text-slate-600">Invalid reset link</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
            This password reset link is invalid. Please request a new one.
          </div>
          <p className="text-center text-sm text-slate-600">
            <Link href="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
              Request new reset link
            </Link>
          </p>
        </div>
      </main>
    );
  }

  const errorMessages: Record<string, string> = {
    PasswordTooShort: 'Password must be at least 8 characters.',
    PasswordMismatch: 'Passwords do not match.',
    InvalidToken: 'This reset link has expired or already been used.',
  };

  async function handleReset(formData: FormData) {
    'use server';
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const resetToken = formData.get('token') as string;
    const resetEmail = formData.get('email') as string;

    if (!password || password.length < 8) {
      redirect(`/reset-password?token=${resetToken}&email=${encodeURIComponent(resetEmail)}&error=PasswordTooShort`);
    }

    if (password !== confirmPassword) {
      redirect(`/reset-password?token=${resetToken}&email=${encodeURIComponent(resetEmail)}&error=PasswordMismatch`);
    }

    const consumed = await consumeResetToken(resetEmail, resetToken);
    if (!consumed) {
      redirect(`/reset-password?token=${resetToken}&email=${encodeURIComponent(resetEmail)}&error=InvalidToken`);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await db.update(users).set({ password: hashedPassword }).where(eq(users.email, resetEmail));

    await signIn('credentials', {
      email: resetEmail,
      password,
      redirectTo: '/dashboard',
    });
  }

  return (
    <main id="main-content" tabIndex={-1} className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Mindweave</h1>
          <p className="mt-2 text-sm text-slate-600">Set your new password</p>
        </div>

        <div className="mt-8 space-y-4">
          {error && errorMessages[error] && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm text-red-700">
              {errorMessages[error]}
            </div>
          )}

          <form action={handleReset} className="space-y-3">
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="email" value={email} />
            <input
              type="password"
              name="password"
              placeholder="New password (min. 8 characters)"
              minLength={8}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              required
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm new password"
              minLength={8}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              required
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-700"
            >
              Reset password
            </button>
          </form>

          <p className="text-center text-sm text-slate-600">
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
