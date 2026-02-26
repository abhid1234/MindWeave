import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { content, webhookConfigs, apiKeys } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { webhookCaptureSchema } from '@/lib/validations';
import { generateTags } from '@/lib/ai/gemini';
import { upsertContentEmbedding } from '@/lib/ai/embeddings';
import {
  checkRateLimit,
  rateLimitHeaders,
  rateLimitExceededResponse,
  RATE_LIMITS,
} from '@/lib/rate-limit';
import { createHash } from 'crypto';

async function resolveApiKey(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const key = authHeader.slice(7);

  const keyHash = createHash('sha256').update(key).digest('hex');
  const [found] = await db
    .select({ userId: apiKeys.userId })
    .from(apiKeys)
    .where(and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.isActive, true)))
    .limit(1);

  return found?.userId ?? null;
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = checkRateLimit(request, 'webhook', RATE_LIMITS.webhook);
    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    // Authenticate via Bearer API key
    const userId = await resolveApiKey(request.headers.get('authorization'));
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Provide a valid API key via Bearer token.' },
        { status: 401, headers: rateLimitHeaders(rateLimitResult) }
      );
    }

    const body = await request.json();
    const parsed = webhookCaptureSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: parsed.error.flatten().fieldErrors },
        { status: 400, headers: rateLimitHeaders(rateLimitResult) }
      );
    }

    const { title, body: contentBody, url, tags, type } = parsed.data;

    const contentType = type ?? (url ? 'link' : 'note');

    const [newContent] = await db
      .insert(content)
      .values({
        userId,
        type: contentType,
        title,
        body: contentBody ?? null,
        url: url ?? null,
        tags: tags ?? [],
        autoTags: [],
      })
      .returning({ id: content.id });

    // Fire-and-forget AI tagging and embeddings
    generateTags({ title, body: contentBody ?? undefined, url: url ?? undefined, type: contentType })
      .then(async (autoTags) => {
        if (autoTags.length > 0) {
          await db
            .update(content)
            .set({ autoTags })
            .where(eq(content.id, newContent.id));
        }
      })
      .catch(() => {});

    upsertContentEmbedding(newContent.id).catch(() => {});

    // Update webhook stats (best-effort)
    db.update(webhookConfigs)
      .set({
        lastReceivedAt: new Date(),
        totalReceived: sql`${webhookConfigs.totalReceived} + 1`,
      })
      .where(and(eq(webhookConfigs.userId, userId), eq(webhookConfigs.type, 'generic')))
      .catch(() => {});

    return NextResponse.json(
      { success: true, id: newContent.id, message: 'Content captured successfully.' },
      { status: 201, headers: rateLimitHeaders(rateLimitResult) }
    );
  } catch (error) {
    console.error('Webhook capture error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
