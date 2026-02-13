import Link from 'next/link';
import { redirect } from 'next/navigation';
import { sendPasswordResetEmail } from '@/lib/email';
import { checkUnauthenticatedRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

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
    <main id="main-content" tabIndex={-1} className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Mindweave</h1>
          <p className="mt-2 text-sm text-slate-600">Reset your password</p>
        </div>

        <div className="mt-8 space-y-4">
          {params.sent ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center text-sm text-green-700">
              If an account exists with that email, we&apos;ve sent a password reset link. Please check your inbox.
            </div>
          ) : (
            <form action={handleSubmit} className="space-y-3">
              <p className="text-sm text-slate-600">
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>
              <input
                type="email"
                name="email"
                placeholder="Email address"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                required
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-700"
              >
                Send reset link
              </button>
            </form>
          )}

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
