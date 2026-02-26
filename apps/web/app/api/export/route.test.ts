import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock rate limiter to allow requests by default
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(() => ({
    success: true,
    remaining: 99,
    resetTime: Date.now() + 3600000,
  })),
  rateLimitHeaders: vi.fn(() => ({})),
  rateLimitExceededResponse: vi.fn(
    (result: { retryAfter?: number }) =>
      new Response(
        JSON.stringify({
          error: 'Too many requests',
          retryAfter: result.retryAfter,
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
  ),
  RATE_LIMITS: {
    export: { maxRequests: 10, windowMs: 3600000 },
  },
}));

// Mock database
vi.mock('@/lib/db/client', () => ({
  db: {
    select: vi.fn(),
  },
}));

// Mock drizzle-orm operators
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((_col: unknown, val: unknown) => ({ op: 'eq', val })),
  and: vi.fn((...args: unknown[]) => ({ op: 'and', conditions: args })),
  inArray: vi.fn((_col: unknown, val: unknown) => ({ op: 'inArray', val })),
  sql: vi.fn((...args: unknown[]) => ({ op: 'sql', args })),
  ilike: vi.fn((_col: unknown, val: unknown) => ({ op: 'ilike', val })),
  or: vi.fn((...args: unknown[]) => ({ op: 'or', conditions: args })),
}));

// Mock schema
vi.mock('@/lib/db/schema', () => ({
  content: {
    id: 'content.id',
    userId: 'content.userId',
    type: 'content.type',
    title: 'content.title',
    body: 'content.body',
    url: 'content.url',
    tags: 'content.tags',
    autoTags: 'content.autoTags',
    metadata: 'content.metadata',
    createdAt: 'content.createdAt',
    updatedAt: 'content.updatedAt',
  },
  contentCollections: {
    contentId: 'contentCollections.contentId',
    collectionId: 'contentCollections.collectionId',
  },
}));

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { checkRateLimit } from '@/lib/rate-limit';
import { POST } from './route';

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockCheckRateLimit = checkRateLimit as unknown as ReturnType<typeof vi.fn>;

function createRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/export', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

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

function setupAuthenticatedDb(items: typeof mockContent = mockContent) {
  mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

  const mockWhere = vi.fn().mockResolvedValue(items);
  const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
  vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any);

  return { mockWhere, mockFrom };
}

/**
 * Sets up a two-call db.select mock: the first call returns collection content IDs,
 * the second call returns the actual content items.
 */
function setupCollectionDb(
  collectionContentIds: { contentId: string }[],
  items: typeof mockContent = mockContent
) {
  mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

  let callCount = 0;
  vi.mocked(db.select).mockImplementation(() => {
    callCount++;
    if (callCount === 1) {
      // First call: fetching content IDs from contentCollections
      const mockWhere = vi.fn().mockResolvedValue(collectionContentIds);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      return { from: mockFrom } as any;
    }
    // Second call: fetching actual content
    const mockWhere = vi.fn().mockResolvedValue(items);
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    return { from: mockFrom } as any;
  });
}

describe('Export API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset rate limit to allow by default
    mockCheckRateLimit.mockReturnValue({
      success: true,
      remaining: 99,
      resetTime: Date.now() + 3600000,
    });
  });

  describe('Authentication', () => {
    it('should return 401 for unauthenticated requests', async () => {
      mockAuth.mockResolvedValue(null);

      const request = createRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized');
    });

    it('should return 401 when session has no user id', async () => {
      mockAuth.mockResolvedValue({ user: {} } as any);

      const request = createRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });
  });

  describe('JSON Export', () => {
    it('should export all user content as JSON by default', async () => {
      setupAuthenticatedDb();

      const request = createRequest({});
      const response = await POST(request);

      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Content-Disposition')).toContain(
        'mindweave-export.json'
      );

      const text = await response.text();
      const data = JSON.parse(text);

      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
      expect(data[0].title).toBe('Test Note');
      expect(data[1].title).toBe('Test Link');
    });

    it('should export content as JSON when format is explicitly json', async () => {
      setupAuthenticatedDb();

      const request = createRequest({ format: 'json' });
      const response = await POST(request);
      const text = await response.text();
      const data = JSON.parse(text);

      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
      expect(data[0].id).toBe('content-1');
      expect(data[1].id).toBe('content-2');
    });

    it('should return pretty-printed JSON', async () => {
      setupAuthenticatedDb();

      const request = createRequest({ format: 'json' });
      const response = await POST(request);
      const text = await response.text();

      expect(text).toContain('\n');
    });
  });

  describe('Markdown Export', () => {
    it('should export content as markdown format', async () => {
      setupAuthenticatedDb();

      const request = createRequest({ format: 'markdown' });
      const response = await POST(request);

      expect(response.headers.get('Content-Type')).toBe('text/markdown');
      expect(response.headers.get('Content-Disposition')).toContain(
        'mindweave-export.md'
      );
    });

    it('should include header with export info', async () => {
      setupAuthenticatedDb();

      const request = createRequest({ format: 'markdown' });
      const response = await POST(request);
      const text = await response.text();

      expect(text).toContain('# Mindweave Export');
      expect(text).toContain('Total items: 2');
    });

    it('should format items with title, type, tags, and body', async () => {
      setupAuthenticatedDb();

      const request = createRequest({ format: 'markdown' });
      const response = await POST(request);
      const text = await response.text();

      expect(text).toContain('## Test Note');
      expect(text).toContain('**Type:** note');
      expect(text).toContain('**Tags:** tag1, tag2');
      expect(text).toContain('### Content');
      expect(text).toContain('This is test content');
    });

    it('should include URL as markdown link for link items', async () => {
      setupAuthenticatedDb();

      const request = createRequest({ format: 'markdown' });
      const response = await POST(request);
      const text = await response.text();

      expect(text).toContain(
        '[https://example.com](https://example.com)'
      );
    });
  });

  describe('CSV Export', () => {
    it('should export content as CSV format', async () => {
      setupAuthenticatedDb();

      const request = createRequest({ format: 'csv' });
      const response = await POST(request);

      expect(response.headers.get('Content-Type')).toBe('text/csv');
      expect(response.headers.get('Content-Disposition')).toContain(
        'mindweave-export.csv'
      );
    });

    it('should include CSV headers', async () => {
      setupAuthenticatedDb();

      const request = createRequest({ format: 'csv' });
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

    it('should include data rows for each content item', async () => {
      setupAuthenticatedDb();

      const request = createRequest({ format: 'csv' });
      const response = await POST(request);
      const text = await response.text();
      const lines = text.split('\n');

      // Header + 2 data rows
      expect(lines).toHaveLength(3);
    });

    it('should join tags with semicolons', async () => {
      setupAuthenticatedDb();

      const request = createRequest({ format: 'csv' });
      const response = await POST(request);
      const text = await response.text();

      expect(text).toContain('tag1; tag2');
    });

    it('should escape commas in CSV content', async () => {
      setupAuthenticatedDb([
        { ...mockContent[0], title: 'Title, with comma' },
      ]);

      const request = createRequest({ format: 'csv' });
      const response = await POST(request);
      const text = await response.text();

      expect(text).toContain('"Title, with comma"');
    });

    it('should escape quotes in CSV content', async () => {
      setupAuthenticatedDb([
        { ...mockContent[0], title: 'Title with "quotes"' },
      ]);

      const request = createRequest({ format: 'csv' });
      const response = await POST(request);
      const text = await response.text();

      expect(text).toContain('""quotes""');
    });

    it('should escape newlines in CSV content', async () => {
      setupAuthenticatedDb([
        { ...mockContent[0], body: 'Line 1\nLine 2' },
      ]);

      const request = createRequest({ format: 'csv' });
      const response = await POST(request);
      const text = await response.text();

      expect(text).toContain('"Line 1\nLine 2"');
    });
  });

  describe('Filtering by collection ID', () => {
    it('should filter content by collection ID', async () => {
      setupCollectionDb(
        [{ contentId: 'content-1' }, { contentId: 'content-2' }],
        mockContent
      );

      const request = createRequest({
        collectionId: 'collection-1',
        format: 'json',
      });
      const response = await POST(request);
      const text = await response.text();
      const data = JSON.parse(text);

      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
    });

    it('should return 404 when collection has no content', async () => {
      setupCollectionDb([], []);

      const request = createRequest({
        collectionId: 'empty-collection',
        format: 'json',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toBe('No content found to export');
    });
  });

  describe('Filtering by type', () => {
    it('should filter content by type', async () => {
      const noteOnly = [mockContent[0]];
      setupAuthenticatedDb(noteOnly);

      const request = createRequest({ type: 'note', format: 'json' });
      const response = await POST(request);
      const text = await response.text();
      const data = JSON.parse(text);

      expect(data).toHaveLength(1);
      expect(data[0].type).toBe('note');
    });

    it('should filter content by link type', async () => {
      const linkOnly = [mockContent[1]];
      setupAuthenticatedDb(linkOnly);

      const request = createRequest({ type: 'link', format: 'json' });
      const response = await POST(request);
      const text = await response.text();
      const data = JSON.parse(text);

      expect(data).toHaveLength(1);
      expect(data[0].type).toBe('link');
    });
  });

  describe('Filtering by tag', () => {
    it('should filter content by tag', async () => {
      const tagged = [mockContent[0]];
      setupAuthenticatedDb(tagged);

      const request = createRequest({ tag: 'tag1', format: 'json' });
      const response = await POST(request);
      const text = await response.text();
      const data = JSON.parse(text);

      expect(data).toHaveLength(1);
      expect(data[0].tags).toContain('tag1');
    });
  });

  describe('Filtering by query', () => {
    it('should filter content by search query', async () => {
      const matched = [mockContent[0]];
      setupAuthenticatedDb(matched);

      const request = createRequest({ query: 'test', format: 'json' });
      const response = await POST(request);
      const text = await response.text();
      const data = JSON.parse(text);

      expect(data).toHaveLength(1);
      expect(data[0].title).toBe('Test Note');
    });
  });

  describe('No Content Found', () => {
    it('should return 404 when no content found to export', async () => {
      setupAuthenticatedDb([]);

      const request = createRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.message).toBe('No content found to export');
    });
  });

  describe('Rate Limiting', () => {
    it('should return 429 when rate limit is exceeded', async () => {
      mockCheckRateLimit.mockReturnValue({
        success: false,
        remaining: 0,
        resetTime: Date.now() + 3600000,
        retryAfter: 3600,
      });

      const request = createRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe('Too many requests');
    });

    it('should not call auth when rate limited', async () => {
      mockCheckRateLimit.mockReturnValue({
        success: false,
        remaining: 0,
        resetTime: Date.now() + 3600000,
        retryAfter: 3600,
      });

      const request = createRequest({});
      await POST(request);

      expect(mockAuth).not.toHaveBeenCalled();
    });
  });

  describe('Metadata Sanitization', () => {
    it('should sanitize metadata with allowlisted keys only', async () => {
      const contentWithMetadata = [
        {
          ...mockContent[0],
          metadata: {
            source: 'web',
            author: 'John',
            internalField: 'should-be-stripped',
            secretKey: 'should-be-stripped',
          },
        },
      ];
      setupAuthenticatedDb(contentWithMetadata as unknown as typeof mockContent);

      const request = createRequest({ format: 'json' });
      const response = await POST(request);
      const text = await response.text();
      const data = JSON.parse(text);

      expect(data[0].metadata).toHaveProperty('source', 'web');
      expect(data[0].metadata).toHaveProperty('author', 'John');
      expect(data[0].metadata).not.toHaveProperty('internalField');
      expect(data[0].metadata).not.toHaveProperty('secretKey');
    });

    it('should handle null metadata gracefully', async () => {
      setupAuthenticatedDb([mockContent[0]]);

      const request = createRequest({ format: 'json' });
      const response = await POST(request);
      const text = await response.text();
      const data = JSON.parse(text);

      expect(data[0].metadata).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on unexpected error', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
      vi.mocked(db.select).mockImplementation(() => {
        throw new Error('Database error');
      });

      const request = createRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Failed to export content');
    });
  });
});
