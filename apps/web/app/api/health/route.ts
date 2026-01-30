import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { sql } from 'drizzle-orm';

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

  return NextResponse.json(
    {
      status: overall,
      db: { status: dbStatus, latencyMs: dbLatencyMs },
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      timestamp: new Date().toISOString(),
      service: 'mindweave',
    },
    { status: overall === 'healthy' ? 200 : 503 }
  );
}
