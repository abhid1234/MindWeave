import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { sql } from 'drizzle-orm';
import { performanceStats } from '@/lib/performance';

const startTime = Date.now();

/**
 * Health check endpoint for Cloud Run and monitoring
 * Checks application + database connectivity
 */
export async function GET() {
  let dbStatus: 'healthy' | 'unhealthy' = 'unhealthy';
  let dbLatencyMs: number | null = null;

  try {
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1`);
    dbLatencyMs = Date.now() - dbStart;
    dbStatus = 'healthy';
  } catch {
    // DB unreachable
  }

  const overall = dbStatus === 'healthy' ? 'healthy' : 'degraded';

  // Include performance metrics summary (top 5 by count)
  const allStats = performanceStats.getAllStats();
  const topOperations = Object.entries(allStats)
    .filter(([, stats]) => stats !== null)
    .sort((a, b) => (b[1]?.count || 0) - (a[1]?.count || 0))
    .slice(0, 5)
    .reduce(
      (acc, [key, stats]) => {
        acc[key] = stats;
        return acc;
      },
      {} as Record<string, (typeof allStats)[string]>
    );

  return NextResponse.json(
    {
      status: overall,
      db: { status: dbStatus, latencyMs: dbLatencyMs },
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      timestamp: new Date().toISOString(),
      service: 'mindweave',
      performance: Object.keys(topOperations).length > 0 ? topOperations : undefined,
    },
    { status: overall === 'healthy' ? 200 : 503 }
  );
}
