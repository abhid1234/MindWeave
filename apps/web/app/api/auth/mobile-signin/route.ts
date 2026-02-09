import { signIn } from '@/lib/auth';
import { NextResponse } from 'next/server';

// This endpoint handles OAuth initiation for mobile/Capacitor apps.
// It calls signIn() directly which internally uses skipCSRFCheck.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const callbackUrl = url.searchParams.get('callbackUrl') || '/dashboard';

  try {
    // signIn is a server action that internally skips CSRF checks.
    // With redirect: false, it returns the redirect URL instead of throwing.
    const result = await signIn('google', {
      redirectTo: callbackUrl,
      redirect: false,
    });

    // Result should be the redirect URL to Google OAuth
    if (typeof result === 'string') {
      return NextResponse.redirect(result, 302);
    }

    // If result is an object with url property
    if (result?.url) {
      return NextResponse.redirect(result.url, 302);
    }

    // Fallback
    return NextResponse.redirect(`${process.env.AUTH_URL || 'https://mindweave.space'}/login?error=MobileSigninFailed`, 302);
  } catch (error: any) {
    // signIn might throw a redirect (Next.js NEXT_REDIRECT error)
    // Extract the redirect URL from the error
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      // The redirect URL is encoded in the error digest
      // Format: NEXT_REDIRECT;type;url;statusCode
      const parts = error.digest.split(';');
      const redirectUrl = parts[2];
      if (redirectUrl) {
        return NextResponse.redirect(redirectUrl, 302);
      }
    }

    console.error('Mobile signin error:', error);
    return NextResponse.redirect(`${process.env.AUTH_URL || 'https://mindweave.space'}/login?error=MobileSigninFailed`, 302);
  }
}
