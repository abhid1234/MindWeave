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
import { createHmac, timingSafeEqual } from 'crypto';

function verifySlackSignature(
  signingSecret: string,
  timestamp: string,
  body: string,
  signature: string
): boolean {
  // Protect against replay attacks
  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 300;
  if (parseInt(timestamp, 10) < fiveMinutesAgo) return false;

  const sigBasestring = `v0:${timestamp}:${body}`;
  const hmac = createHmac('sha256', signingSecret).update(sigBasestring).digest('hex');
  const computed = `v0=${hmac}`;

  try {
    return timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
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

    // Slack URL verification challenge
    if (body.type === 'url_verification') {
      return NextResponse.json({ challenge: body.challenge }, { headers: rateLimitHeaders(rateLimitResult) });
    }

    // Verify signature
    const timestamp = request.headers.get('x-slack-request-timestamp') ?? '';
    const signature = request.headers.get('x-slack-signature') ?? '';

    // Find the webhook config by looking at all active Slack webhooks
    const slackWebhooks = await db
      .select()
      .from(webhookConfigs)
      .where(and(eq(webhookConfigs.type, 'slack'), eq(webhookConfigs.isActive, true)));

    let matchedWebhook = null;
    for (const webhook of slackWebhooks) {
      if (webhook.secret && verifySlackSignature(webhook.secret, timestamp, rawBody, signature)) {
        matchedWebhook = webhook;
        break;
      }
    }

    if (!matchedWebhook) {
      return NextResponse.json(
        { success: false, message: 'Invalid signature or no matching webhook.' },
        { status: 401, headers: rateLimitHeaders(rateLimitResult) }
      );
    }

    // Handle event callbacks
    if (body.type === 'event_callback') {
      const event = body.event;

      // Only handle message events (not bot messages)
      if (event?.type === 'message' && !event.bot_id && !event.subtype) {
        const config = matchedWebhook.config as { channels?: string[]; defaultTags?: string[]; contentType?: string } | null;

        // Check channel filter
        if (config?.channels && config.channels.length > 0) {
          if (!config.channels.includes(event.channel)) {
            return NextResponse.json({ ok: true }, { headers: rateLimitHeaders(rateLimitResult) });
          }
        }

        const title = event.text?.slice(0, 200) || 'Slack message';
        const contentType = (config?.contentType as 'note' | 'link') ?? 'note';

        const [newContent] = await db
          .insert(content)
          .values({
            userId: matchedWebhook.userId,
            type: contentType,
            title,
            body: event.text ?? null,
            tags: config?.defaultTags ?? [],
            autoTags: [],
            metadata: { source: 'slack', channel: event.channel },
          })
          .returning({ id: content.id });

        // Fire-and-forget AI processing
        generateTags({ title, body: event.text ?? undefined, type: contentType })
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

    return NextResponse.json({ ok: true }, { headers: rateLimitHeaders(rateLimitResult) });
  } catch (error) {
    console.error('Slack webhook error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
