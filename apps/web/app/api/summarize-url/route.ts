import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  checkRateLimit,
  rateLimitHeaders,
  rateLimitExceededResponse,
} from '@/lib/rate-limit';
import { extractUrlContent } from '@/lib/ai/url-content';
import { summarizeUrlContent } from '@/lib/ai/url-summarizer';

// Summarize rate limit: 10 per hour
const SUMMARIZE_RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 60 * 60 * 1000,
};

/**
 * SSRF protection: reject private/internal IP ranges
 */
function isPrivateUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    const hostname = url.hostname.toLowerCase();

    // Block localhost variants
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '0.0.0.0'
    ) {
      return true;
    }

    // Block private IP ranges
    const privateRanges = [
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
      /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/,
      /^192\.168\.\d{1,3}\.\d{1,3}$/,
      /^169\.254\.\d{1,3}\.\d{1,3}$/, // link-local
      /^fc00:/i, // IPv6 private
      /^fd/i,    // IPv6 private
      /^fe80:/i, // IPv6 link-local
    ];

    return privateRanges.some((re) => re.test(hostname));
  } catch {
    return true; // Block invalid URLs
  }
}

function isValidUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit before auth
    const rateLimitResult = checkRateLimit(request, 'summarize-url', SUMMARIZE_RATE_LIMIT);
    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401, headers: rateLimitHeaders(rateLimitResult) },
      );
    }

    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, message: 'URL is required' },
        { status: 400, headers: rateLimitHeaders(rateLimitResult) },
      );
    }

    if (!isValidUrl(url)) {
      return NextResponse.json(
        { success: false, message: 'Invalid URL format' },
        { status: 400, headers: rateLimitHeaders(rateLimitResult) },
      );
    }

    // SSRF protection
    if (isPrivateUrl(url)) {
      return NextResponse.json(
        { success: false, message: 'URL points to a private or internal address' },
        { status: 400, headers: rateLimitHeaders(rateLimitResult) },
      );
    }

    // Extract content
    const content = await extractUrlContent(url);

    // Summarize
    const summary = await summarizeUrlContent(content);

    return NextResponse.json(
      {
        success: true,
        data: {
          formattedBody: summary.formattedBody,
          metadata: {
            sourceType: content.sourceType,
            videoId: content.videoId,
            domain: content.domain,
            title: content.title,
          },
        },
      },
      { headers: rateLimitHeaders(rateLimitResult) },
    );
  } catch (error) {
    console.error('Summarize URL error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to summarize URL content';
    return NextResponse.json(
      { success: false, message },
      { status: 500 },
    );
  }
}
