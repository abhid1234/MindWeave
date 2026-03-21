import { NextResponse } from 'next/server';
import { trackAnalyticsEvent } from '@/app/actions/analytics';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = await trackAnalyticsEvent(body);

    if (!result.success) {
      return NextResponse.json({ ok: false, message: result.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid request body' }, { status: 400 });
  }
}
