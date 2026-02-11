import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { auth, signIn } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from '@/lib/email';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  // Detect Android WebView via User-Agent to avoid loading Google OAuth in WebView
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  const isWebView = /Android.*; wv\b/.test(userAgent);

  if (session?.user) {
    redirect('/dashboard');
  }

  async function register(formData: FormData) {
    'use server';

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!name || !email || !password || !confirmPassword) {
      redirect('/register?error=MissingFields');
    }

    if (password.length < 8) {
      redirect('/register?error=PasswordTooShort');
    }

    if (password !== confirmPassword) {
      redirect('/register?error=PasswordMismatch');
    }

    // Check if email already exists
    const existing = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email),
    });

    if (existing) {
      redirect('/register?error=EmailExists');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      emailVerified: null,
    });

    // Send verification email
    await sendVerificationEmail(email);

    // Redirect to verification sent page
    redirect('/verify-email-sent');
  }

  const errorMessages: Record<string, string> = {
    MissingFields: 'Please fill in all fields.',
    PasswordTooShort: 'Password must be at least 8 characters.',
    PasswordMismatch: 'Passwords do not match.',
    EmailExists: 'An account with this email already exists.',
  };

  return (
    <main id="main-content" tabIndex={-1} className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Mindweave</h1>
          <p className="mt-2 text-sm text-slate-600">
            Create your account
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {params.error && errorMessages[params.error] && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm text-red-700">
              {errorMessages[params.error]}
            </div>
          )}

          <form action={register} className="space-y-3">
            <input
              type="text"
              name="name"
              placeholder="Full name"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email address"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password (min. 8 characters)"
              minLength={8}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              required
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm password"
              minLength={8}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              required
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-700"
            >
              Create account
            </button>
          </form>

          <p className="text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign in
            </Link>
          </p>

          {/* Google OAuth - hidden in Android WebView due to disallowed_useragent issue */}
          {!isWebView && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-slate-500">or</span>
                </div>
              </div>

              <form
                action={async () => {
                  'use server';
                  await signIn('google', { redirectTo: '/dashboard' });
                }}
              >
                <GoogleSignInButton />
              </form>
            </>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">
          By continuing, you agree to Mindweave&apos;s Terms of Service and Privacy Policy
        </p>
      </div>
    </main>
  );
}
