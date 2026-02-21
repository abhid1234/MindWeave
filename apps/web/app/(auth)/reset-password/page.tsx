import Link from 'next/link';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { consumeResetToken } from '@/lib/email';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { signIn } from '@/lib/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
      <main id="main-content" tabIndex={-1} className="w-full max-w-md px-4">
        <div className="w-full space-y-8 rounded-2xl bg-card border border-border p-10 shadow-soft-lg">
          <div className="text-center animate-fade-up" style={{ animationFillMode: 'backwards' }}>
            <h1 className="text-4xl font-bold tracking-tight">Mindweave</h1>
            <p className="mt-2 text-sm text-muted-foreground">Invalid reset link</p>
          </div>
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-center text-sm text-destructive animate-fade-up" style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}>
            This password reset link is invalid. Please request a new one.
          </div>
          <p className="text-center text-sm text-muted-foreground animate-fade-up" style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}>
            <Link href="/forgot-password" className="font-medium text-primary hover:text-primary/80">
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
    <main id="main-content" tabIndex={-1} className="w-full max-w-md px-4">
      <div className="w-full space-y-8 rounded-2xl bg-card border border-border p-10 shadow-soft-lg">
        <div className="text-center animate-fade-up" style={{ animationFillMode: 'backwards' }}>
          <h1 className="text-4xl font-bold tracking-tight">Mindweave</h1>
          <p className="mt-2 text-sm text-muted-foreground">Set your new password</p>
        </div>

        <div className="mt-8 space-y-4 animate-fade-up" style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}>
          {error && errorMessages[error] && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-center text-sm text-destructive">
              {errorMessages[error]}
            </div>
          )}

          <form action={handleReset} className="space-y-3">
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="email" value={email} />
            <Input
              type="password"
              name="password"
              placeholder="New password (min. 8 characters)"
              minLength={8}
              required
            />
            <Input
              type="password"
              name="confirmPassword"
              placeholder="Confirm new password"
              minLength={8}
              required
            />
            <Button type="submit" className="w-full" size="lg">
              Reset password
            </Button>
          </form>

          <div className="animate-fade-up" style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}>
            <p className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="font-medium text-primary hover:text-primary/80">
                Back to sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
