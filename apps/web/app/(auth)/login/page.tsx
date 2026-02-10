import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth, signIn } from '@/lib/auth';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; verified?: string }>;
}) {
  const session = await auth();
  const isDevelopment = process.env.NODE_ENV === 'development';
  const params = await searchParams;

  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <main id="main-content" tabIndex={-1} className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Mindweave</h1>
          <p className="mt-2 text-sm text-slate-600">
            Your AI-powered personal knowledge hub
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {/* Development-only test login */}
          {isDevelopment && (
            <>
              <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-amber-800">
                  ⚠️ Development Mode Only
                </p>
                <form
                  action={async (formData: FormData) => {
                    'use server';
                    const email = formData.get('email') as string;
                    await signIn('dev-login', {
                      email,
                      redirectTo: '/dashboard',
                    });
                  }}
                  className="space-y-3"
                >
                  <input
                    type="email"
                    name="email"
                    placeholder="test@example.com"
                    defaultValue="test@mindweave.dev"
                    className="w-full rounded-lg border border-amber-300 px-4 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-amber-700"
                  >
                    Dev Login (No Password)
                  </button>
                </form>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-slate-500">or</span>
                </div>
              </div>
            </>
          )}

          {/* Email/Password Login */}
          {params.verified === 'true' && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center text-sm text-green-700">
              Email verified successfully! You can now sign in.
            </div>
          )}

          {params.error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm text-red-700">
              {params.error === 'CredentialsSignin'
                ? 'Invalid email or password.'
                : 'An error occurred. Please try again.'}
            </div>
          )}

          <form
            action={async (formData: FormData) => {
              'use server';
              const email = formData.get('email') as string;
              const password = formData.get('password') as string;
              await signIn('credentials', {
                email,
                password,
                redirectTo: '/dashboard',
              });
            }}
            className="space-y-3"
          >
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
              placeholder="Password"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              required
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-700"
            >
              Sign in
            </button>
          </form>

          <div className="flex items-center justify-between text-sm text-slate-600">
            <p>
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign up
              </Link>
            </p>
            <Link href="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
              Forgot password?
            </Link>
          </div>

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
            <GoogleSignInButton authUrl="https://mindweave.space" />
          </form>
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">
          By continuing, you agree to Mindweave&apos;s Terms of Service and Privacy Policy
        </p>
      </div>
    </main>
  );
}
