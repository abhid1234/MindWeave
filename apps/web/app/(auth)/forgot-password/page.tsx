import Link from 'next/link';
import { redirect } from 'next/navigation';
import { sendPasswordResetEmail } from '@/lib/email';
import { checkUnauthenticatedRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const params = await searchParams;

  async function handleSubmit(formData: FormData) {
    'use server';
    const email = formData.get('email') as string;
    if (!email) {
      redirect('/forgot-password?error=MissingEmail');
    }

    // SECURITY: Rate limit password reset requests per email (3/hour)
    const rateCheck = checkUnauthenticatedRateLimit(email, 'passwordReset', RATE_LIMITS.passwordReset);
    if (!rateCheck.success) {
      // Still show generic success to prevent enumeration
      redirect('/forgot-password?sent=1');
    }

    await sendPasswordResetEmail(email);
    redirect('/forgot-password?sent=1');
  }

  return (
    <main id="main-content" tabIndex={-1} className="w-full max-w-md px-4">
      <div className="w-full space-y-8 rounded-2xl bg-card border border-border p-10 shadow-soft-lg">
        <div className="text-center animate-fade-up" style={{ animationFillMode: 'backwards' }}>
          <h1 className="text-4xl font-bold tracking-tight">Mindweave</h1>
          <p className="mt-2 text-sm text-muted-foreground">Reset your password</p>
        </div>

        <div className="mt-8 space-y-4 animate-fade-up" style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}>
          {params.sent ? (
            <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-center text-sm text-green-600 dark:text-green-400">
              If an account exists with that email, we&apos;ve sent a password reset link. Please check your inbox.
            </div>
          ) : (
            <form action={handleSubmit} className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>
              <Input
                type="email"
                name="email"
                placeholder="Email address"
                required
              />
              <Button type="submit" className="w-full" size="lg">
                Send reset link
              </Button>
            </form>
          )}

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
