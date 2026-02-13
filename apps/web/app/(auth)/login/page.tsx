import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { auth, signIn } from '@/lib/auth';
import { AuthError } from 'next-auth';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { TurnstileWidget } from '@/components/auth/TurnstileWidget';
import { verifyTurnstileToken } from '@/lib/turnstile';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; verified?: string }>;
}) {
  const session = await auth();
  const isDevelopment = process.env.NODE_ENV === 'development';
  const params = await searchParams;

  // Detect Android WebView via User-Agent to avoid loading Google OAuth in WebView
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  const isWebView = /Android.*; wv\b/.test(userAgent);

  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <main id="main-content" tabIndex={-1} className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          Back to home
        </Link>
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
                : params.error === 'TurnstileFailed'
                  ? 'Human verification failed. Please try again.'
                  : 'An error occurred. Please try again.'}
            </div>
          )}

          <form
            action={async (formData: FormData) => {
              'use server';
              const turnstileToken = formData.get('cf-turnstile-response') as string;
              const valid = await verifyTurnstileToken(turnstileToken || '');
              if (!valid) {
                return redirect('/login?error=TurnstileFailed');
              }

              const email = formData.get('email') as string;
              const password = formData.get('password') as string;
              try {
                await signIn('credentials', {
                  email,
                  password,
                  redirectTo: '/dashboard',
                });
              } catch (error) {
                if (error instanceof AuthError) {
                  return redirect(`/login?error=${error.type}`);
                }
                throw error;
              }
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
            <TurnstileWidget />
            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-700"
            >
              Sign in
            </button>
          </form>

          <div className="flex flex-col items-center gap-3 pt-2 text-sm text-slate-600 sm:flex-row sm:justify-between sm:gap-0 sm:pt-0">
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
