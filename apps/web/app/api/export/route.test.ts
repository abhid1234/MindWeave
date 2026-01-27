import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock rate limiter to always allow requests in tests
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(() => ({
    success: true,
    remaining: 99,
    resetTime: Date.now() + 3600000,
  })),
  rateLimitHeaders: vi.fn(() => ({})),
  rateLimitExceededResponse: vi.fn(),
  RATE_LIMITS: {
    export: { maxRequests: 10, windowMs: 3600000 },
  },
}));

// Mock database
vi.mock('@/lib/db/client', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
  },
}));

describe('Export API Route', () => {
  const mockContent = [
    {
      id: 'content-1',
      type: 'note',
      title: 'Test Note',
      body: 'This is test content',
      url: null,
      tags: ['tag1', 'tag2'],
      autoTags: ['auto-tag'],
      metadata: null,
      createdAt: new Date('2024-01-15T10:00:00Z'),
      updatedAt: new Date('2024-01-15T12:00:00Z'),
    },
    {
      id: 'content-2',
      type: 'link',
      title: 'Test Link',
      body: 'Link description',
      url: 'https://example.com',
      tags: [],
      autoTags: [],
      metadata: null,
      createdAt: new Date('2024-01-16T10:00:00Z'),
      updatedAt: new Date('2024-01-16T10:00:00Z'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as any);

      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized');
    });

    it('should return 401 when session has no user id', async () => {
      vi.mocked(auth).mockResolvedValue({ user: {} } as any);

      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });
  });

  describe('JSON Export', () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-123' },
      } as any);

      const mockQuery = vi.fn().mockResolvedValue(mockContent);
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: mockQuery,
        }),
      } as any);
    });

    it('should export content as JSON by default', async () => {
      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);

      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Content-Disposition')).toContain('mindweave-export.json');
    });

    it('should export content as JSON when format is json', async () => {
      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify({ format: 'json' }),
      });

      const response = await POST(request);
      const text = await response.text();
      const data = JSON.parse(text);

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
      expect(data[0].title).toBe('Test Note');
    });

    it('should return pretty-printed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify({ format: 'json' }),
      });

      const response = await POST(request);
      const text = await response.text();

      // Pretty-printed JSON should have newlines
      expect(text).toContain('\n');
    });
  });

  describe('Markdown Export', () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-123' },
      } as any);

      const mockQuery = vi.fn().mockResolvedValue(mockContent);
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: mockQuery,
        }),
      } as any);
    });

    it('should export content as Markdown', async () => {
      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify({ format: 'markdown' }),
      });

      const response = await POST(request);

      expect(response.headers.get('Content-Type')).toBe('text/markdown');
      expect(response.headers.get('Content-Disposition')).toContain('mindweave-export.md');
    });

    it('should include header with export info', async () => {
      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify({ format: 'markdown' }),
      });

      const response = await POST(request);
      const text = await response.text();

      expect(text).toContain('# Mindweave Export');
      expect(text).toContain('Total items: 2');
    });

    it('should format items with title and metadata', async () => {
      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify({ format: 'markdown' }),
      });

      const response = await POST(request);
      const text = await response.text();

      expect(text).toContain('## Test Note');
      expect(text).toContain('**Type:** note');
      expect(text).toContain('**Tags:** tag1, tag2');
    });

    it('should include URL as markdown link', async () => {
      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify({ format: 'markdown' }),
      });

      const response = await POST(request);
      const text = await response.text();

      expect(text).toContain('[https://example.com](https://example.com)');
    });

    it('should include content body', async () => {
      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify({ format: 'markdown' }),
      });

      const response = await POST(request);
      const text = await response.text();

      expect(text).toContain('### Content');
      expect(text).toContain('This is test content');
    });
  });

  describe('CSV Export', () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-123' },
      } as any);

      const mockQuery = vi.fn().mockResolvedValue(mockContent);
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: mockQuery,
        }),
      } as any);
    });

    it('should export content as CSV', async () => {
      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify({ format: 'csv' }),
      });

      const response = await POST(request);

      expect(response.headers.get('Content-Type')).toBe('text/csv');
      expect(response.headers.get('Content-Disposition')).toContain('mindweave-export.csv');
    });

    it('should include CSV headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify({ format: 'csv' }),
      });

      const response = await POST(request);
      const text = await response.text();
      const firstLine = text.split('\n')[0];

      expect(firstLine).toContain('ID');
      expect(firstLine).toContain('Type');
      expect(firstLine).toContain('Title');
      expect(firstLine).toContain('Body');
      expect(firstLine).toContain('URL');
      expect(firstLine).toContain('Tags');
      expect(firstLine).toContain('Auto Tags');
      expect(firstLine).toContain('Created At');
      expect(firstLine).toContain('Updated At');
    });

    it('should include data rows', async () => {
      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify({ format: 'csv' }),
      });

      const response = await POST(request);
      const text = await response.text();
      const lines = text.split('\n');

      expect(lines.length).toBe(3); // Header + 2 data rows
    });

    it('should join tags with semicolons', async () => {
      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify({ format: 'csv' }),
      });

      const response = await POST(request);
      const text = await response.text();

      expect(text).toContain('tag1; tag2');
    });
  });

  describe('Content Filtering', () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-123' },
      } as any);
    });

    it('should filter by contentIds when provided', async () => {
      const mockQuery = vi.fn().mockResolvedValue([mockContent[0]]);
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: mockQuery,
        }),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify({
          contentIds: ['content-1'],
          format: 'json',
        }),
      });

      const response = await POST(request);
      const text = await response.text();
      const data = JSON.parse(text);

      expect(data.length).toBe(1);
      expect(data[0].id).toBe('content-1');
    });
  });

  describe('No Content Found', () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-123' },
      } as any);

      const mockQuery = vi.fn().mockResolvedValue([]);
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: mockQuery,
        }),
      } as any);
    });

    it('should return 404 when no content found', async () => {
      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toBe('No content found to export');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on unexpected error', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-123' },
      } as any);

      vi.mocked(db.select).mockImplementation(() => {
        throw new Error('Database error');
      });

      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Failed to export content');
    });
  });

  describe('CSV Escaping', () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-123' },
      } as any);
    });

    it('should escape commas in content', async () => {
      const contentWithComma = [{
        ...mockContent[0],
        title: 'Title, with comma',
      }];

      const mockQuery = vi.fn().mockResolvedValue(contentWithComma);
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: mockQuery,
        }),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify({ format: 'csv' }),
      });

      const response = await POST(request);
      const text = await response.text();

      expect(text).toContain('"Title, with comma"');
    });

    it('should escape quotes in content', async () => {
      const contentWithQuote = [{
        ...mockContent[0],
        title: 'Title with "quotes"',
      }];

      const mockQuery = vi.fn().mockResolvedValue(contentWithQuote);
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: mockQuery,
        }),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify({ format: 'csv' }),
      });

      const response = await POST(request);
      const text = await response.text();

      expect(text).toContain('""quotes""');
    });

    it('should escape newlines in content', async () => {
      const contentWithNewline = [{
        ...mockContent[0],
        body: 'Line 1\nLine 2',
      }];

      const mockQuery = vi.fn().mockResolvedValue(contentWithNewline);
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: mockQuery,
        }),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify({ format: 'csv' }),
      });

      const response = await POST(request);
      const text = await response.text();

      // Should be wrapped in quotes
      expect(text).toContain('"Line 1\nLine 2"');
    });
  });
});
