import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, OPTIONS } from './route';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { generateTags } from '@/lib/ai/claude';
import { upsertContentEmbedding } from '@/lib/ai/embeddings';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock database
vi.mock('@/lib/db/client', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(),
      })),
    })),
  },
}));

// Mock AI functions
vi.mock('@/lib/ai/claude', () => ({
  generateTags: vi.fn(),
}));

vi.mock('@/lib/ai/embeddings', () => ({
  upsertContentEmbedding: vi.fn(),
}));

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Extension Capture API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(generateTags).mockResolvedValue(['auto-tag-1', 'auto-tag-2']);
    vi.mocked(upsertContentEmbedding).mockResolvedValue(undefined);
  });

  describe('POST /api/extension/capture', () => {
    describe('Authentication', () => {
      it('should return 401 when not authenticated', async () => {
        vi.mocked(auth).mockResolvedValue(null as any);

        const request = new NextRequest('http://localhost:3000/api/extension/capture', {
          method: 'POST',
          body: JSON.stringify({
            type: 'link',
            title: 'Test Page',
            url: 'https://example.com',
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.success).toBe(false);
        expect(data.message).toBe('Unauthorized');
      });

      it('should return 401 when session has no user id', async () => {
        vi.mocked(auth).mockResolvedValue({ user: {} } as any);

        const request = new NextRequest('http://localhost:3000/api/extension/capture', {
          method: 'POST',
          body: JSON.stringify({
            type: 'link',
            title: 'Test Page',
            url: 'https://example.com',
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.success).toBe(false);
      });
    });

    describe('Validation', () => {
      beforeEach(() => {
        vi.mocked(auth).mockResolvedValue({
          user: { id: 'user-123' },
        } as any);
      });

      it('should return 400 for invalid JSON', async () => {
        const request = new NextRequest('http://localhost:3000/api/extension/capture', {
          method: 'POST',
          body: 'invalid json',
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.message).toBe('Invalid JSON body');
      });

      it('should return 400 when title is missing', async () => {
        const request = new NextRequest('http://localhost:3000/api/extension/capture', {
          method: 'POST',
          body: JSON.stringify({
            type: 'link',
            url: 'https://example.com',
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.message).toBe('Validation failed');
        expect(data.errors).toBeDefined();
      });

      it('should return 400 when type is invalid', async () => {
        const request = new NextRequest('http://localhost:3000/api/extension/capture', {
          method: 'POST',
          body: JSON.stringify({
            type: 'invalid-type',
            title: 'Test Page',
            url: 'https://example.com',
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.errors?.type).toBeDefined();
      });

      it('should return 400 when URL is invalid', async () => {
        const request = new NextRequest('http://localhost:3000/api/extension/capture', {
          method: 'POST',
          body: JSON.stringify({
            type: 'link',
            title: 'Test Page',
            url: 'not-a-valid-url',
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.errors?.url).toBeDefined();
      });

      it('should return 400 when title is too long', async () => {
        const request = new NextRequest('http://localhost:3000/api/extension/capture', {
          method: 'POST',
          body: JSON.stringify({
            type: 'link',
            title: 'a'.repeat(501),
            url: 'https://example.com',
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
      });
    });

    describe('Successful Capture', () => {
      beforeEach(() => {
        vi.mocked(auth).mockResolvedValue({
          user: { id: 'user-123' },
        } as any);

        const mockReturning = vi.fn().mockResolvedValue([{ id: 'content-123' }]);
        const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
        vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any);
      });

      it('should save content and return success', async () => {
        const request = new NextRequest('http://localhost:3000/api/extension/capture', {
          method: 'POST',
          body: JSON.stringify({
            type: 'link',
            title: 'Test Page',
            url: 'https://example.com',
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.message).toBe('Content saved successfully');
        expect(data.data.id).toBe('content-123');
      });

      it('should save content with optional body', async () => {
        const request = new NextRequest('http://localhost:3000/api/extension/capture', {
          method: 'POST',
          body: JSON.stringify({
            type: 'link',
            title: 'Test Page',
            url: 'https://example.com',
            body: 'Optional description',
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
      });

      it('should save content with tags', async () => {
        const request = new NextRequest('http://localhost:3000/api/extension/capture', {
          method: 'POST',
          body: JSON.stringify({
            type: 'link',
            title: 'Test Page',
            url: 'https://example.com',
            tags: ['tag1', 'tag2'],
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
      });

      it('should save note content without URL', async () => {
        const request = new NextRequest('http://localhost:3000/api/extension/capture', {
          method: 'POST',
          body: JSON.stringify({
            type: 'note',
            title: 'My Note',
            body: 'Note content here',
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
      });

      it('should call generateTags with correct data', async () => {
        const request = new NextRequest('http://localhost:3000/api/extension/capture', {
          method: 'POST',
          body: JSON.stringify({
            type: 'link',
            title: 'Test Page',
            url: 'https://example.com',
            body: 'Description',
          }),
        });

        await POST(request);

        expect(generateTags).toHaveBeenCalledWith({
          title: 'Test Page',
          body: 'Description',
          url: 'https://example.com',
          type: 'link',
        });
      });

      it('should call upsertContentEmbedding with content id', async () => {
        const request = new NextRequest('http://localhost:3000/api/extension/capture', {
          method: 'POST',
          body: JSON.stringify({
            type: 'link',
            title: 'Test Page',
            url: 'https://example.com',
          }),
        });

        await POST(request);

        expect(upsertContentEmbedding).toHaveBeenCalledWith('content-123');
      });

      it('should succeed even if auto-tagging fails', async () => {
        vi.mocked(generateTags).mockRejectedValue(new Error('AI error'));

        const request = new NextRequest('http://localhost:3000/api/extension/capture', {
          method: 'POST',
          body: JSON.stringify({
            type: 'link',
            title: 'Test Page',
            url: 'https://example.com',
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
      });

      it('should include CORS headers', async () => {
        const request = new NextRequest('http://localhost:3000/api/extension/capture', {
          method: 'POST',
          body: JSON.stringify({
            type: 'link',
            title: 'Test Page',
            url: 'https://example.com',
          }),
        });

        const response = await POST(request);

        expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true');
        expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
      });
    });

    describe('Error Handling', () => {
      it('should return 500 on database error', async () => {
        vi.mocked(auth).mockResolvedValue({
          user: { id: 'user-123' },
        } as any);

        vi.mocked(db.insert).mockImplementation(() => {
          throw new Error('Database error');
        });

        const request = new NextRequest('http://localhost:3000/api/extension/capture', {
          method: 'POST',
          body: JSON.stringify({
            type: 'link',
            title: 'Test Page',
            url: 'https://example.com',
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.message).toBe('Failed to save content');
      });
    });
  });

  describe('OPTIONS /api/extension/capture', () => {
    it('should return 204 with CORS headers', async () => {
      const response = await OPTIONS();

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
    });
  });
});
