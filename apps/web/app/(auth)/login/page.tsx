import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';
import { auth, signIn } from '@/lib/auth';
import { AuthError } from 'next-auth';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { TurnstileWidget } from '@/components/auth/TurnstileWidget';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { checkUnauthenticatedRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
    <main id="main-content" tabIndex={-1} className="w-full max-w-md px-4">
      <div className="w-full space-y-8 rounded-2xl bg-card border border-border p-10 shadow-soft-lg">
        <div className="animate-fade-up" style={{ animationFillMode: 'backwards' }}>
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            Back to home
          </Link>
          <div className="text-center mt-8">
            <div className="flex items-center justify-center gap-3 mb-1">
              <Image src="/icons/icon.svg" alt="Mindweave logo" width={40} height={40} className="rounded-lg" />
              <h1 className="text-4xl font-bold tracking-tight">Mindweave</h1>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Your AI-powered personal knowledge hub
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-4 animate-fade-up" style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}>
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
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>
            </>
          )}

          {/* Email/Password Login */}
          {params.verified === 'true' && (
            <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-center text-sm text-green-600 dark:text-green-400">
              Email verified successfully! You can now sign in.
            </div>
          )}

          {params.error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-center text-sm text-destructive">
              {params.error === 'CredentialsSignin'
                ? 'Invalid email or password.'
                : params.error === 'TurnstileFailed'
                  ? 'Human verification failed. Please try again.'
                  : params.error === 'RateLimited'
                    ? 'Too many login attempts. Please try again later.'
                    : 'An error occurred. Please try again.'}
            </div>
          )}

          <form
            action={async (formData: FormData) => {
              'use server';
              const email = formData.get('email') as string;

              // SECURITY: Rate limit login attempts per email
              const rateCheck = checkUnauthenticatedRateLimit(email, 'login', RATE_LIMITS.auth);
              if (!rateCheck.success) {
                return redirect('/login?error=RateLimited');
              }

              const turnstileToken = formData.get('cf-turnstile-response') as string;
              const valid = await verifyTurnstileToken(turnstileToken || '');
              if (!valid) {
                return redirect('/login?error=TurnstileFailed');
              }

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
            <Input
              type="email"
              name="email"
              placeholder="Email address"
              required
            />
            <Input
              type="password"
              name="password"
              placeholder="Password"
              required
            />
            <TurnstileWidget />
            <Button type="submit" className="w-full" size="lg">
              Sign in
            </Button>
          </form>

          <div className="flex flex-col items-center gap-3 pt-2 text-sm text-muted-foreground sm:flex-row sm:justify-between sm:gap-0 sm:pt-0">
            <p>
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-medium text-primary hover:text-primary/80">
                Sign up
              </Link>
            </p>
            <Link href="/forgot-password" className="font-medium text-primary hover:text-primary/80">
              Forgot password?
            </Link>
          </div>

          {/* Google OAuth - hidden in Android WebView due to disallowed_useragent issue */}
          {!isWebView && (
            <div className="animate-fade-up" style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}>
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
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
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          By continuing, you agree to Mindweave&apos;s Terms of Service and Privacy Policy
        </p>
      </div>
    </main>
  );
}
