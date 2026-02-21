import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';
import { db } from '@/lib/db/client';
import { Button } from '@/components/ui/button';

export default async function VerifyEmailSentPage({
  searchParams,
}: {
  searchParams: Promise<{ resent?: string; error?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  async function resendEmail() {
    'use server';

    const currentSession = await auth();
    if (!currentSession?.user?.email) {
      redirect('/login');
    }

    // Check if already verified
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, currentSession.user!.email!),
    });

    if (user?.emailVerified) {
      redirect('/dashboard');
    }

    try {
      await sendVerificationEmail(currentSession.user.email);
      redirect('/verify-email-sent?resent=true');
    } catch {
      redirect('/verify-email-sent?error=SendFailed');
    }
  }

  return (
    <main id="main-content" tabIndex={-1} className="w-full max-w-md px-4">
      <div className="w-full space-y-8 rounded-2xl bg-card border border-border p-10 shadow-soft-lg">
        <div className="text-center animate-fade-up" style={{ animationFillMode: 'backwards' }}>
          <h1 className="text-4xl font-bold tracking-tight">Mindweave</h1>
          <p className="mt-2 text-sm text-muted-foreground">Check your email</p>
        </div>

        <div className="rounded-lg border border-primary/20 bg-primary/10 p-4 text-center text-sm text-primary animate-fade-up" style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}>
          <p className="font-medium">Verification email sent!</p>
          <p className="mt-1">
            We&apos;ve sent a verification link to{' '}
            {session?.user?.email ? (
              <span className="font-medium">{session.user.email}</span>
            ) : (
              'your email address'
            )}
            . Please check your inbox and click the link to verify your account.
          </p>
          <p className="mt-2 text-xs opacity-70">The link expires in 24 hours.</p>
        </div>

        {params.resent === 'true' && (
          <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-center text-sm text-green-600 dark:text-green-400">
            Verification email resent successfully!
          </div>
        )}

        {params.error === 'SendFailed' && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-center text-sm text-destructive">
            Failed to send verification email. Please try again.
          </div>
        )}

        <div className="animate-fade-up" style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}>
          {session?.user?.email && (
            <form action={resendEmail}>
              <Button type="submit" variant="outline" className="w-full" size="lg">
                Resend verification email
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground mt-4">
            <Link href="/login" className="font-medium text-primary hover:text-primary/80">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
