import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  checkRateLimit,
  rateLimitHeaders,
  rateLimitExceededResponse,
  RATE_LIMITS,
} from './rate-limit';

// Mock request factory
function createMockRequest(ip = '192.168.1.1', forwardedFor?: string): Request {
  const headers = new Headers();
  if (forwardedFor) {
    headers.set('x-forwarded-for', forwardedFor);
  } else {
    headers.set('x-real-ip', ip);
  }
  return new Request('http://localhost/api/test', { headers });
}

describe('rate-limit', () => {
  // Reset the rate limit store between tests by waiting for window to expire
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limit', () => {
      const request = createMockRequest('10.0.0.1');
      const config = { maxRequests: 5, windowMs: 60000 };

      const result = checkRateLimit(request, 'test-endpoint-1', config);

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('should track requests per IP', () => {
      const config = { maxRequests: 3, windowMs: 60000 };
      const request = createMockRequest('10.0.0.2');

      // First request
      let result = checkRateLimit(request, 'test-endpoint-2', config);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(2);

      // Second request
      result = checkRateLimit(request, 'test-endpoint-2', config);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(1);

      // Third request
      result = checkRateLimit(request, 'test-endpoint-2', config);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it('should block requests over limit', () => {
      const config = { maxRequests: 2, windowMs: 60000 };
      const request = createMockRequest('10.0.0.3');

      // Use up limit
      checkRateLimit(request, 'test-endpoint-3', config);
      checkRateLimit(request, 'test-endpoint-3', config);

      // Next request should be blocked
      const result = checkRateLimit(request, 'test-endpoint-3', config);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeDefined();
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should use x-forwarded-for header when present', () => {
      const config = { maxRequests: 3, windowMs: 60000 };
      const request = createMockRequest('10.0.0.99', '203.0.113.1, 198.51.100.1');

      const result = checkRateLimit(request, 'test-endpoint-4', config);
      expect(result.success).toBe(true);

      // Different IP from x-forwarded-for should have separate limit
      const request2 = createMockRequest('10.0.0.99', '203.0.113.2, 198.51.100.1');
      const result2 = checkRateLimit(request2, 'test-endpoint-4', config);
      expect(result2.success).toBe(true);
      expect(result2.remaining).toBe(2); // Fresh counter for different IP
    });

    it('should reset after window expires', () => {
      const config = { maxRequests: 2, windowMs: 1000 }; // 1 second window
      const request = createMockRequest('10.0.0.5');

      // Use up limit
      checkRateLimit(request, 'test-endpoint-5', config);
      checkRateLimit(request, 'test-endpoint-5', config);

      // Should be blocked
      let result = checkRateLimit(request, 'test-endpoint-5', config);
      expect(result.success).toBe(false);

      // Advance time past window
      vi.advanceTimersByTime(1500);

      // Should be allowed again
      result = checkRateLimit(request, 'test-endpoint-5', config);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(1);
    });

    it('should track separate endpoints independently', () => {
      const config = { maxRequests: 1, windowMs: 60000 };
      const request = createMockRequest('10.0.0.6');

      // Use up limit on endpoint A
      checkRateLimit(request, 'endpoint-A', config);
      const resultA = checkRateLimit(request, 'endpoint-A', config);
      expect(resultA.success).toBe(false);

      // Endpoint B should still have full limit
      const resultB = checkRateLimit(request, 'endpoint-B', config);
      expect(resultB.success).toBe(true);
    });

    it('should support custom key generator', () => {
      const config = {
        maxRequests: 2,
        windowMs: 60000,
        keyGenerator: () => 'custom-key',
      };

      const request1 = createMockRequest('10.0.0.7');
      const request2 = createMockRequest('10.0.0.8');

      // Both requests should share the same limit due to custom key
      checkRateLimit(request1, 'test-endpoint-6', config);
      checkRateLimit(request2, 'test-endpoint-6', config);
      const result = checkRateLimit(request1, 'test-endpoint-6', config);

      expect(result.success).toBe(false);
    });
  });

  describe('rateLimitHeaders', () => {
    it('should generate correct headers for successful request', () => {
      const result = {
        success: true,
        remaining: 5,
        resetTime: Date.now() + 60000,
      };

      const headers = rateLimitHeaders(result);

      expect(headers['X-RateLimit-Remaining']).toBe('5');
      expect(headers['X-RateLimit-Reset']).toBeDefined();
      expect(headers['Retry-After']).toBeUndefined();
    });

    it('should include Retry-After for blocked requests', () => {
      const result = {
        success: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
        retryAfter: 60,
      };

      const headers = rateLimitHeaders(result);

      expect(headers['X-RateLimit-Remaining']).toBe('0');
      expect(headers['Retry-After']).toBe('60');
    });
  });

  describe('rateLimitExceededResponse', () => {
    it('should return 429 status', async () => {
      const result = {
        success: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
        retryAfter: 60,
      };

      const response = rateLimitExceededResponse(result);

      expect(response.status).toBe(429);
    });

    it('should include error message in body', async () => {
      const result = {
        success: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
        retryAfter: 30,
      };

      const response = rateLimitExceededResponse(result);
      const body = await response.json();

      expect(body.error).toBe('Too many requests');
      expect(body.message).toContain('30 seconds');
      expect(body.retryAfter).toBe(30);
    });

    it('should include rate limit headers', () => {
      const result = {
        success: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
        retryAfter: 45,
      };

      const response = rateLimitExceededResponse(result);

      expect(response.headers.get('Retry-After')).toBe('45');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    });
  });

  describe('RATE_LIMITS presets', () => {
    it('should have all required presets', () => {
      expect(RATE_LIMITS.api).toBeDefined();
      expect(RATE_LIMITS.auth).toBeDefined();
      expect(RATE_LIMITS.upload).toBeDefined();
      expect(RATE_LIMITS.import).toBeDefined();
      expect(RATE_LIMITS.export).toBeDefined();
      expect(RATE_LIMITS.ai).toBeDefined();
    });

    it('should have stricter limits for auth endpoint', () => {
      expect(RATE_LIMITS.auth.maxRequests).toBeLessThan(RATE_LIMITS.api.maxRequests);
    });

    it('should have appropriate windows', () => {
      expect(RATE_LIMITS.api.windowMs).toBe(60 * 1000); // 1 minute
      expect(RATE_LIMITS.auth.windowMs).toBe(15 * 60 * 1000); // 15 minutes
      expect(RATE_LIMITS.upload.windowMs).toBe(60 * 60 * 1000); // 1 hour
    });
  });
});
