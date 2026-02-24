import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { authenticateApiKey } from '@/lib/api-key-auth';
import { db } from '@/lib/db/client';
import { content, type ContentType } from '@/lib/db/schema';
import { createContentSchema } from '@/lib/validations';
import { generateTags } from '@/lib/ai/gemini';
import { generateSummary } from '@/lib/ai/summarization';
import { upsertContentEmbedding } from '@/lib/ai/embeddings';
import { eq, desc, and, lt } from 'drizzle-orm';
import {
  checkRateLimit,
  rateLimitHeaders,
  rateLimitExceededResponse,
} from '@/lib/rate-limit';

const API_RATE_LIMIT = {
  maxRequests: 100,
  windowMs: 60 * 1000,
};

async function resolveUserId(request: NextRequest): Promise<string | null> {
  // Try API key first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer mw_')) {
    const result = await authenticateApiKey(request);
    if (result.success) return result.userId;
    return null;
  }

  // Fall back to session auth
  const session = await auth();
  return session?.user?.id ?? null;
}

/**
 * GET /api/v1/content
 * List content with cursor-based pagination
 */
export async function GET(request: NextRequest) {
  const rateLimitResult = checkRateLimit(request, 'api-v1-content', API_RATE_LIMIT);
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult);
  }

  const userId = await resolveUserId(request);
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: rateLimitHeaders(rateLimitResult) }
    );
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get('cursor');
  const limitParam = parseInt(searchParams.get('limit') || '20', 10);
  const limit = Math.min(Math.max(limitParam, 1), 100);
  const typeFilter = searchParams.get('type') as ContentType | null;

  const conditions = [eq(content.userId, userId)];
  if (cursor) {
    conditions.push(lt(content.createdAt, new Date(cursor)));
  }
  if (typeFilter && ['note', 'link', 'file'].includes(typeFilter)) {
    conditions.push(eq(content.type, typeFilter));
  }

  const items = await db
    .select({
      id: content.id,
      type: content.type,
      title: content.title,
      body: content.body,
      url: content.url,
      tags: content.tags,
      autoTags: content.autoTags,
      createdAt: content.createdAt,
      isFavorite: content.isFavorite,
      summary: content.summary,
    })
    .from(content)
    .where(and(...conditions))
    .orderBy(desc(content.createdAt))
    .limit(limit + 1);

  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? data[data.length - 1].createdAt.toISOString() : null;

  return NextResponse.json(
    { data, nextCursor, hasMore },
    { headers: rateLimitHeaders(rateLimitResult) }
  );
}

/**
 * POST /api/v1/content
 * Create content via API
 */
export async function POST(request: NextRequest) {
  const rateLimitResult = checkRateLimit(request, 'api-v1-content', API_RATE_LIMIT);
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult);
  }

  const userId = await resolveUserId(request);
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: rateLimitHeaders(rateLimitResult) }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400, headers: rateLimitHeaders(rateLimitResult) }
    );
  }

  const validation = createContentSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
      { status: 400, headers: rateLimitHeaders(rateLimitResult) }
    );
  }

  const validated = validation.data;

  // AI processing (non-blocking failures)
  let autoTags: string[] = [];
  let summary: string | null = null;
  try {
    const aiInput = {
      title: validated.title,
      body: validated.body,
      url: validated.url,
      type: validated.type,
    };
    [autoTags, summary] = await Promise.all([
      generateTags(aiInput).catch(() => []),
      generateSummary(aiInput).catch(() => null),
    ]);
  } catch {
    // Continue without AI features
  }

  const [newContent] = await db
    .insert(content)
    .values({
      userId,
      type: validated.type,
      title: validated.title,
      body: validated.body || null,
      url: validated.url || null,
      tags: validated.tags ?? [],
      autoTags,
      summary,
      metadata: validated.metadata || {},
    })
    .returning({
      id: content.id,
      type: content.type,
      title: content.title,
      createdAt: content.createdAt,
    });

  // Generate embedding (non-blocking)
  upsertContentEmbedding(newContent.id).catch((err) => {
    console.error('Failed to generate embedding:', newContent.id, err);
  });

  return NextResponse.json(
    { data: newContent },
    { status: 201, headers: rateLimitHeaders(rateLimitResult) }
  );
}
