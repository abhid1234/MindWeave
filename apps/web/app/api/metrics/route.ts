import { NextResponse } from 'next/server';
import { performanceStats } from '@/lib/performance';

/**
 * Performance metrics endpoint
 * Returns aggregated performance statistics
 *
 * In production, this should be protected or disabled
 */
export async function GET() {
  // Only allow in development or with proper auth
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_METRICS_ENDPOINT) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const stats = performanceStats.getAllStats();

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    service: 'mindweave',
    metrics: stats,
  });
}
