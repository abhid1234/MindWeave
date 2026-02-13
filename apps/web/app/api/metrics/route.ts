import { NextRequest, NextResponse } from 'next/server';
import { performanceStats } from '@/lib/performance';
import { auth } from '@/lib/auth';

/**
 * Performance metrics endpoint
 * Returns aggregated performance statistics
 *
 * SECURITY: In production, requires either:
 * - An authenticated session, OR
 * - A valid METRICS_AUTH_TOKEN bearer token
 */
export async function GET(request: NextRequest) {
  // In development, allow unrestricted access
  if (process.env.NODE_ENV !== 'production') {
    // Still require ALLOW_METRICS_ENDPOINT to be explicitly enabled
    if (!process.env.ALLOW_METRICS_ENDPOINT) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } else {
    // Production: require authentication
    const metricsToken = process.env.METRICS_AUTH_TOKEN;
    const authHeader = request.headers.get('authorization');

    // Check bearer token first (for monitoring systems)
    if (metricsToken && authHeader === `Bearer ${metricsToken}`) {
      // Token auth passed
    } else {
      // Fall back to session auth
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
  }

  const stats = performanceStats.getAllStats();

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    service: 'mindweave',
    metrics: stats,
  });
}
