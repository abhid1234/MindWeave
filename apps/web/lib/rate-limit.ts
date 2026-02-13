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

/**
 * Reset the rate limit store - FOR TESTING ONLY
 * This clears all rate limit entries
 */
export function resetRateLimitStore(): void {
  rateLimitStore.clear();
}

// Clean up expired entries periodically (every 5 minutes)
// Use unref() to prevent the timer from keeping the process alive
if (typeof setInterval !== 'undefined') {
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
  // Prevent this timer from keeping Node.js processes (including test workers) alive
  if (cleanupInterval && typeof cleanupInterval === 'object' && 'unref' in cleanupInterval) {
    cleanupInterval.unref();
  }
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
 * SECURITY: Uses the LAST IP in X-Forwarded-For (added by trusted load balancer),
 * not the first (which is user-controlled and spoofable).
 * Cloud Run / GCP LB appends the real client IP as the rightmost entry.
 */
function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim()).filter(Boolean);
    // Take the LAST IP — added by the trusted proxy (Cloud Run LB)
    // The first IP is user-controlled and can be spoofed
    return ips[ips.length - 1];
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback for local development
  return 'localhost';
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

/**
 * Check rate limit for server actions (keyed by userId instead of IP)
 *
 * @param userId - The authenticated user's ID
 * @param action - Action identifier for separate limits per action
 * @param config - Rate limit configuration (uses maxRequests and windowMs)
 * @returns { success: boolean; message?: string } - whether the action is allowed
 */
export function checkServerActionRateLimit(
  userId: string,
  action: string,
  config: { maxRequests: number; windowMs: number }
): { success: boolean; message?: string } {
  const now = Date.now();
  const key = `action:${action}:${userId}`;
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return { success: true };
  }

  entry.count++;

  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return {
      success: false,
      message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
    };
  }

  return { success: true };
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
  // Server actions: 60 requests per minute
  serverAction: {
    maxRequests: 60,
    windowMs: 60 * 1000,
  },
  // Server actions with AI: 20 requests per minute
  serverActionAI: {
    maxRequests: 20,
    windowMs: 60 * 1000,
  },
  // Bulk server actions: 10 requests per minute
  serverActionBulk: {
    maxRequests: 10,
    windowMs: 60 * 1000,
  },
  // Password reset: 3 requests per hour per email
  passwordReset: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000,
  },
  // File serving: 200 requests per minute
  fileServing: {
    maxRequests: 200,
    windowMs: 60 * 1000,
  },
} as const;

/**
 * Check rate limit for unauthenticated actions (keyed by identifier like email or IP)
 * Used for auth forms where userId is not yet available
 */
export function checkUnauthenticatedRateLimit(
  identifier: string,
  action: string,
  config: { maxRequests: number; windowMs: number }
): { success: boolean; message?: string } {
  const now = Date.now();
  const key = `unauth:${action}:${identifier}`;
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return { success: true };
  }

  entry.count++;

  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return {
      success: false,
      message: `Too many attempts. Please try again in ${retryAfter} seconds.`,
    };
  }

  return { success: true };
}
