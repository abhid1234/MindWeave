import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkRateLimit, rateLimitExceededResponse, RATE_LIMITS } from '@/lib/rate-limit';

/**
 * GET /api/extension/session
 * Check if user is authenticated (for browser extension)
 */
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Rate limit session checks
    const rateLimitResult = checkRateLimit(request, 'extension-session', RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { authenticated: false },
        {
          status: 200,
          headers: getCorsHeaders(),
        }
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
        },
      },
      {
        status: 200,
        headers: getCorsHeaders(),
      }
    );
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { authenticated: false },
      {
        status: 200,
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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}
