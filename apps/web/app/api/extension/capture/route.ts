import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { authenticateApiKey } from '@/lib/api-key-auth';
import { db } from '@/lib/db/client';
import { content } from '@/lib/db/schema';
import { generateTags } from '@/lib/ai/gemini';
import { upsertContentEmbedding } from '@/lib/ai/embeddings';
import { generateSummary } from '@/lib/ai/summarization';
import { syncContentToNeo4j } from '@/lib/neo4j/sync';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  checkRateLimit,
  rateLimitHeaders,
  rateLimitExceededResponse,
  RATE_LIMITS,
} from '@/lib/rate-limit';

// Schema for extension capture (slightly modified from createContentSchema)
const extensionCaptureSchema = z.object({
  type: z.enum(['note', 'link', 'file']),
  title: z.string().min(1, 'Title is required').max(500, 'Title is too long'),
  url: z.string().url('Invalid URL').optional().or(z.literal('')),
  body: z.string().max(50000, 'Content is too long').optional(),
  tags: z.array(z.string()).default([]),
});

/**
 * POST /api/extension/capture
 * Save content from browser extension
 * SECURITY: Rate limited to prevent abuse
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Check rate limit first to prevent DoS
    const rateLimitResult = checkRateLimit(request, 'extension-capture', RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      const response = rateLimitExceededResponse(rateLimitResult);
      // Add CORS headers to rate limit response
      const headers = new Headers(response.headers);
      Object.entries(getCorsHeaders()).forEach(([key, value]) => {
        headers.set(key, value);
      });
      return new NextResponse(response.body, { status: 429, headers });
    }

    // Try API key auth first, then fall back to session auth
    let userId: string | null = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer mw_')) {
      const apiKeyResult = await authenticateApiKey(request);
      if (apiKeyResult.success) {
        userId = apiKeyResult.userId;
      }
    }

    if (!userId) {
      const session = await auth();
      userId = session?.user?.id ?? null;
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        {
          status: 401,
          headers: { ...getCorsHeaders(), ...rateLimitHeaders(rateLimitResult) },
        }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON body' },
        {
          status: 400,
          headers: getCorsHeaders(),
        }
      );
    }

    // Validate input
    const validationResult = extensionCaptureSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors,
        },
        {
          status: 400,
          headers: getCorsHeaders(),
        }
      );
    }

    const validatedData = validationResult.data;

    // Generate auto-tags and summary in parallel (blocking, before DB insert)
    let autoTags: string[] = [];
    let summary: string | null = null;
    try {
      const [tagsResult, summaryResult] = await Promise.allSettled([
        generateTags({
          title: validatedData.title,
          body: validatedData.body,
          url: validatedData.url,
          type: validatedData.type,
        }),
        generateSummary({
          title: validatedData.title,
          body: validatedData.body,
          url: validatedData.url,
          type: validatedData.type,
        }),
      ]);
      if (tagsResult.status === 'fulfilled') {
        autoTags = tagsResult.value;
      } else {
        console.error('Auto-tagging failed:', tagsResult.reason);
      }
      if (summaryResult.status === 'fulfilled') {
        summary = summaryResult.value;
      } else {
        console.error('Summary generation failed:', summaryResult.reason);
      }
    } catch (error) {
      // Don't fail content creation if AI calls fail
      console.error('AI pre-processing failed:', error);
    }

    // Insert into database
    const [newContent] = await db
      .insert(content)
      .values({
        userId,
        type: validatedData.type,
        title: validatedData.title,
        body: validatedData.body || null,
        url: validatedData.url || null,
        tags: validatedData.tags,
        autoTags,
        ...(summary ? { summary } : {}),
        metadata: {},
      })
      .returning({ id: content.id });

    // Generate embedding and sync to Neo4j asynchronously (non-blocking)
    upsertContentEmbedding(newContent.id).catch((error) => {
      console.error('Failed to generate embedding for content:', newContent.id, error);
    });

    syncContentToNeo4j(newContent.id).catch((error) => {
      console.error('Failed to sync content to Neo4j:', newContent.id, error);
    });

    // Revalidate relevant pages
    revalidatePath('/dashboard/library');
    revalidatePath('/dashboard');

    return NextResponse.json(
      {
        success: true,
        message: 'Content saved successfully',
        data: { id: newContent.id },
      },
      {
        status: 201,
        headers: { ...getCorsHeaders(), ...rateLimitHeaders(rateLimitResult) },
      }
    );
  } catch (error) {
    console.error('Extension capture error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save content' },
      {
        status: 500,
        headers: getCorsHeaders(),
      }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(),
  });
}

function getCorsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}
