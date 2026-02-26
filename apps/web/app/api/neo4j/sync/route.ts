import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isNeo4jConfigured } from '@/lib/neo4j/client';
import { fullSyncUserGraph } from '@/lib/neo4j/sync';

/**
 * POST /api/neo4j/sync
 * Full sync of user's content graph to Neo4j.
 * Auth: session (user) or CRON_SECRET bearer (admin).
 */
export async function POST(request: NextRequest) {
  if (!isNeo4jConfigured()) {
    return NextResponse.json(
      { error: 'Neo4j not configured' },
      { status: 503 }
    );
  }

  // Try CRON_SECRET auth first
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  let userId: string | undefined;

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    // Admin/cron: require userId in body
    try {
      const body = await request.json();
      userId = body.userId;
    } catch {
      return NextResponse.json(
        { error: 'Request body must include userId' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }
  } else {
    // Session auth
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    userId = session.user.id;
  }

  try {
    const result = await fullSyncUserGraph(userId);
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Neo4j full sync failed:', error);
    return NextResponse.json(
      { error: 'Sync failed' },
      { status: 500 }
    );
  }
}
