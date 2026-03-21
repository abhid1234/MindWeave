import { NextRequest, NextResponse } from 'next/server';
import { trackReferralClick } from '@/app/actions/referrals';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
): Promise<NextResponse> {
  const { username } = await params;

  // Track the referral click (best-effort, don't block redirect on failure)
  await trackReferralClick(username).catch(() => undefined);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mindweave.app';

  const response = NextResponse.redirect(appUrl, { status: 302 });

  // Set referrer cookie: 30 days, httpOnly, sameSite lax
  const thirtyDays = 30 * 24 * 60 * 60;
  response.cookies.set('mw_referrer', username, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: thirtyDays,
    path: '/',
  });

  return response;
}
