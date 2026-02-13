import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, OPTIONS } from './route';
import { auth } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock rate limiter
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: () => ({ success: true, remaining: 99, resetTime: Date.now() + 60000 }),
  rateLimitExceededResponse: () => new Response(JSON.stringify({ error: 'Too many requests' }), { status: 429 }),
  RATE_LIMITS: {
    api: { maxRequests: 100, windowMs: 60000 },
  },
}));

function createMockRequest(): NextRequest {
  return new NextRequest('http://localhost:3000/api/extension/session');
}

describe('Extension Session API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/extension/session', () => {
    it('should return authenticated: false when not logged in', async () => {
      vi.mocked(auth).mockResolvedValue(null as any);

      const response = await GET(createMockRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.authenticated).toBe(false);
      expect(data.user).toBeUndefined();
    });

    it('should return authenticated: false when session has no user id', async () => {
      vi.mocked(auth).mockResolvedValue({ user: {} } as any);

      const response = await GET(createMockRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.authenticated).toBe(false);
    });

    it('should return user info when authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
        },
      } as any);

      const response = await GET(createMockRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.authenticated).toBe(true);
      expect(data.user).toEqual({
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      });
    });

    it('should include CORS headers', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-123' },
      } as any);

      const response = await GET(createMockRequest());

      expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    });

    it('should handle auth errors gracefully', async () => {
      vi.mocked(auth).mockRejectedValue(new Error('Auth error'));

      const response = await GET(createMockRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.authenticated).toBe(false);
    });
  });

  describe('OPTIONS /api/extension/session', () => {
    it('should return 204 with CORS headers', async () => {
      const response = await OPTIONS();

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
    });
  });
});
