import { NextResponse } from 'next/server';
import { encode } from 'next-auth/jwt';
import { verifyMobileAuthToken } from '@/lib/mobile-auth';
import { db } from '@/lib/db/client';

// This endpoint is loaded in the Android WebView after the OAuth flow completes in Chrome.
// It receives a signed one-time token, verifies it, creates an Auth.js session token,
// and sets the session cookie in the WebView's context.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=InvalidToken', request.url));
  }

  const verified = verifyMobileAuthToken(token);
  if (!verified) {
    return NextResponse.redirect(new URL('/login?error=InvalidToken', request.url));
  }

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, verified.sub),
  });

  if (!user) {
    return NextResponse.redirect(new URL('/login?error=InvalidToken', request.url));
  }

  // Create Auth.js JWT session token with the same fields as the jwt callback
  // The salt parameter is the cookie name used by Auth.js
  const cookieName = '__Secure-authjs.session-token';
  const sessionToken = await encode({
    token: {
      sub: user.id,
      name: user.name,
      email: user.email,
      picture: user.image,
      emailVerified: user.emailVerified ? true : false,
    },
    secret: process.env.AUTH_SECRET!,
    salt: cookieName,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  const response = NextResponse.redirect(new URL('/dashboard', request.url));
  response.cookies.set('__Secure-authjs.session-token', sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
  });

  return response;
}
