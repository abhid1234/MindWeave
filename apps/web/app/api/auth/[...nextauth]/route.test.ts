import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the auth handlers
vi.mock('@/lib/auth', () => ({
  handlers: {
    GET: vi.fn(async () => new Response('GET handler', { status: 200 })),
    POST: vi.fn(async () => new Response('POST handler', { status: 200 })),
  },
}));

describe('Auth API Route', () => {
  describe('GET handler', () => {
    it('should export GET handler', async () => {
      const { GET } = await import('./route');
      expect(GET).toBeDefined();
      expect(typeof GET).toBe('function');
    });

    it('should handle GET requests', async () => {
      const { GET } = await import('./route');
      const mockRequest = new NextRequest('http://localhost:3000/api/auth/session');
      const response = await GET(mockRequest);
      expect(response).toBeInstanceOf(Response);
    });
  });

  describe('POST handler', () => {
    it('should export POST handler', async () => {
      const { POST } = await import('./route');
      expect(POST).toBeDefined();
      expect(typeof POST).toBe('function');
    });

    it('should handle POST requests', async () => {
      const { POST } = await import('./route');
      const mockRequest = new NextRequest('http://localhost:3000/api/auth/signin', {
        method: 'POST',
      });
      const response = await POST(mockRequest);
      expect(response).toBeInstanceOf(Response);
    });
  });

  describe('Integration', () => {
    it('should use handlers from auth config', async () => {
      const { handlers } = await import('@/lib/auth');
      const route = await import('./route');

      expect(route.GET).toBe(handlers.GET);
      expect(route.POST).toBe(handlers.POST);
    });
  });
});
