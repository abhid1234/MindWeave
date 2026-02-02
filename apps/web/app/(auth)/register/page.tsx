import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth, signIn } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import bcrypt from 'bcryptjs';

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

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
      emailVerified: new Date(),
    });

    // Auto sign-in after registration
    await signIn('credentials', {
      email,
      password,
      redirectTo: '/dashboard',
    });
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

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-slate-500">or</span>
            </div>
          </div>

          {/* Google OAuth */}
          <form
            action={async () => {
              'use server';
              await signIn('google', { redirectTo: '/dashboard' });
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">
          By continuing, you agree to Mindweave&apos;s Terms of Service and Privacy Policy
        </p>
      </div>
    </main>
  );
}
