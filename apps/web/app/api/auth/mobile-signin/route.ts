import { NextResponse } from 'next/server';
import { Auth, skipCSRFCheck, raw, createActionURL } from '@auth/core';
import authConfig from '@/lib/auth.config';

// This endpoint handles OAuth initiation for mobile/Capacitor apps.
// It calls Auth.js directly with skipCSRFCheck (like the signIn server action does),
// avoiding the CSRF token dance entirely.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const callbackUrl = url.searchParams.get('callbackUrl') || '/dashboard';
  const authUrl = process.env.AUTH_URL || 'https://mindweave.space';

  // Construct the signin URL (same as Auth.js does internally)
  const signInUrl = `${authUrl}/api/auth/signin/google`;

  // Create a POST request to the signin endpoint
  const body = new URLSearchParams({ callbackUrl });
  const headers = new Headers({
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-Auth-Return-Redirect': '1',
  });

  const req = new Request(signInUrl, {
    method: 'POST',
    headers,
    body,
  });

  // Call Auth directly with skipCSRFCheck (same as signIn server action)
  const res = await Auth(req, {
    ...authConfig,
    basePath: '/api/auth',
    secret: process.env.AUTH_SECRET,
    raw,
    skipCSRFCheck,
  });

  // Get the redirect URL from the response
  let redirectUrl: string;
  if (res instanceof Response) {
    redirectUrl = res.headers.get('Location') || `${authUrl}/dashboard`;
  } else {
    redirectUrl = (res as any).redirect || `${authUrl}/dashboard`;
  }

  // Build the response with cookies from Auth
  const response = NextResponse.redirect(redirectUrl, 302);

  // Forward cookies from Auth response
  if (res instanceof Response) {
    const setCookies = res.headers.getSetCookie?.() || [];
    for (const cookie of setCookies) {
      response.headers.append('Set-Cookie', cookie);
    }
  } else if ((res as any)?.cookies) {
    for (const c of (res as any).cookies) {
      response.cookies.set(c.name, c.value, c.options);
    }
  }

  return response;
}
