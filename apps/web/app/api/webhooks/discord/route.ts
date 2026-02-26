import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { content, webhookConfigs } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { generateTags } from '@/lib/ai/gemini';
import { upsertContentEmbedding } from '@/lib/ai/embeddings';
import {
  checkRateLimit,
  rateLimitHeaders,
  rateLimitExceededResponse,
  RATE_LIMITS,
} from '@/lib/rate-limit';
import { verify, createPublicKey } from 'crypto';

function verifyDiscordSignature(
  publicKey: string,
  timestamp: string,
  body: string,
  signature: string
): boolean {
  try {
    const keyObj = createPublicKey({
      key: Buffer.concat([
        // Ed25519 SubjectPublicKeyInfo DER prefix
        Buffer.from('302a300506032b6570032100', 'hex'),
        Buffer.from(publicKey, 'hex'),
      ]),
      format: 'der',
      type: 'spki',
    });
    return verify(
      null,
      Buffer.from(timestamp + body),
      keyObj,
      Buffer.from(signature, 'hex')
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = checkRateLimit(request, 'webhook', RATE_LIMITS.webhook);
    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    const rawBody = await request.text();
    const body = JSON.parse(rawBody);

    const timestamp = request.headers.get('x-signature-timestamp') ?? '';
    const signature = request.headers.get('x-signature-ed25519') ?? '';

    // Find matching Discord webhook
    const discordWebhooks = await db
      .select()
      .from(webhookConfigs)
      .where(and(eq(webhookConfigs.type, 'discord'), eq(webhookConfigs.isActive, true)));

    let matchedWebhook = null;
    for (const webhook of discordWebhooks) {
      if (webhook.secret && verifyDiscordSignature(webhook.secret, timestamp, rawBody, signature)) {
        matchedWebhook = webhook;
        break;
      }
    }

    // Discord PING (type 1) — must respond even without matching webhook for initial setup
    if (body.type === 1) {
      if (!matchedWebhook) {
        // Try to verify against any Discord webhook for setup
        for (const webhook of discordWebhooks) {
          if (webhook.secret) {
            const valid = verifyDiscordSignature(webhook.secret, timestamp, rawBody, signature);
            if (valid) {
              return NextResponse.json({ type: 1 }, { headers: rateLimitHeaders(rateLimitResult) });
            }
          }
        }
        return NextResponse.json(
          { success: false, message: 'Invalid signature.' },
          { status: 401, headers: rateLimitHeaders(rateLimitResult) }
        );
      }
      return NextResponse.json({ type: 1 }, { headers: rateLimitHeaders(rateLimitResult) });
    }

    if (!matchedWebhook) {
      return NextResponse.json(
        { success: false, message: 'Invalid signature or no matching webhook.' },
        { status: 401, headers: rateLimitHeaders(rateLimitResult) }
      );
    }

    // Handle APPLICATION_COMMAND or MESSAGE_COMPONENT (type 2/3)
    // For now, handle messages forwarded via Discord bot
    if (body.type === 2 || body.data) {
      const messageContent = body.data?.options?.[0]?.value ?? body.data?.content ?? '';
      const config = matchedWebhook.config as { channels?: string[]; defaultTags?: string[]; contentType?: string } | null;

      if (messageContent) {
        const title = (typeof messageContent === 'string' ? messageContent : String(messageContent)).slice(0, 200) || 'Discord message';
        const contentType = (config?.contentType as 'note' | 'link') ?? 'note';

        const [newContent] = await db
          .insert(content)
          .values({
            userId: matchedWebhook.userId,
            type: contentType,
            title,
            body: typeof messageContent === 'string' ? messageContent : String(messageContent),
            tags: config?.defaultTags ?? [],
            autoTags: [],
            metadata: { source: 'discord' },
          })
          .returning({ id: content.id });

        // Fire-and-forget AI processing
        generateTags({ title, body: typeof messageContent === 'string' ? messageContent : String(messageContent), type: contentType })
          .then(async (autoTags) => {
            if (autoTags.length > 0) {
              await db.update(content).set({ autoTags }).where(eq(content.id, newContent.id));
            }
          })
          .catch(() => {});
        upsertContentEmbedding(newContent.id).catch(() => {});

        // Update webhook stats
        await db
          .update(webhookConfigs)
          .set({
            lastReceivedAt: new Date(),
            totalReceived: sql`${webhookConfigs.totalReceived} + 1`,
          })
          .where(eq(webhookConfigs.id, matchedWebhook.id));
      }
    }

    return NextResponse.json(
      { type: 4, data: { content: 'Captured!' } },
      { headers: rateLimitHeaders(rateLimitResult) }
    );
  } catch (error) {
    console.error('Discord webhook error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
