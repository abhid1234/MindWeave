/**
 * Simple in-memory rate limiter for API routes
 * SECURITY: Prevents abuse, brute force attacks, and DoS
 *
 * For production, consider using Redis-based rate limiting for distributed systems
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// Note: This resets on server restart and doesn't work across multiple instances
// For production, use Redis or a similar distributed cache
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitConfig {
  // Maximum number of requests allowed in the window
  maxRequests: number;
  // Time window in milliseconds
  windowMs: number;
  // Optional custom key generator (defaults to IP address)
  keyGenerator?: (request: Request) => string;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * Get client identifier from request
 * Uses X-Forwarded-For header for proxied requests, falls back to a default
 */
function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // Take the first IP in the chain (original client)
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback for local development
  return 'anonymous';
}

/**
 * Check rate limit for a request
 *
 * @param request - The incoming request
 * @param endpoint - Endpoint identifier for separate limits per route
 * @param config - Rate limit configuration
 * @returns RateLimitResult with success status and metadata
 */
export function checkRateLimit(
  request: Request,
  endpoint: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const clientId = config.keyGenerator
    ? config.keyGenerator(request)
    : getClientIdentifier(request);

  const key = `${endpoint}:${clientId}`;
  const entry = rateLimitStore.get(key);

  // If no entry or expired, create new window
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  // Increment count
  entry.count++;

  // Check if over limit
  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter,
    };
  }

  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Create rate limit headers for response
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
  };

  if (!result.success && result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return headers;
}

/**
 * Create a rate-limited response for when limit is exceeded
 */
export function rateLimitExceededResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`,
      retryAfter: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...rateLimitHeaders(result),
      },
    }
  );
}

// Preset configurations for common use cases
export const RATE_LIMITS = {
  // General API: 100 requests per minute
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000,
  },
  // Authentication: 10 attempts per 15 minutes (brute force protection)
  auth: {
    maxRequests: 10,
    windowMs: 15 * 60 * 1000,
  },
  // File uploads: 20 uploads per hour
  upload: {
    maxRequests: 20,
    windowMs: 60 * 60 * 1000,
  },
  // Import: 5 imports per hour
  import: {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000,
  },
  // Export: 10 exports per hour
  export: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000,
  },
  // AI features: 30 requests per minute
  ai: {
    maxRequests: 30,
    windowMs: 60 * 1000,
  },
} as const;
