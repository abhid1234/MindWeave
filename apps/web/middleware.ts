import NextAuth from 'next-auth';
import authConfig from '@/lib/auth.config';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const response = NextResponse.next();

  // Set anonymous analytics session cookie if not already present
  if (!req.cookies.get('mw_session')) {
    const isProduction = process.env.NODE_ENV === 'production';
    response.cookies.set('mw_session', crypto.randomUUID(), {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });
  }

  return response;
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
