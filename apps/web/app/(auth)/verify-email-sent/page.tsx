import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';
import { db } from '@/lib/db/client';

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
    <main id="main-content" tabIndex={-1} className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Mindweave</h1>
          <p className="mt-2 text-sm text-slate-600">Check your email</p>
        </div>

        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-center text-sm text-indigo-700">
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
          <p className="mt-2 text-xs text-indigo-500">The link expires in 24 hours.</p>
        </div>

        {params.resent === 'true' && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center text-sm text-green-700">
            Verification email resent successfully!
          </div>
        )}

        {params.error === 'SendFailed' && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm text-red-700">
            Failed to send verification email. Please try again.
          </div>
        )}

        {session?.user?.email && (
          <form action={resendEmail}>
            <button
              type="submit"
              className="w-full rounded-lg border border-indigo-300 bg-white px-4 py-3 text-sm font-semibold text-indigo-600 transition-all hover:bg-indigo-50"
            >
              Resend verification email
            </button>
          </form>
        )}

        <p className="text-center text-sm text-slate-600">
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
