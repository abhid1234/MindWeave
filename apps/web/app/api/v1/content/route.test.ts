import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock auth module
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock API key auth module
vi.mock('@/lib/api-key-auth', () => ({
  authenticateApiKey: vi.fn(),
}));

// Mock db module with chainable query builder
vi.mock('@/lib/db/client', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}));

// Mock AI modules
vi.mock('@/lib/ai/gemini', () => ({
  generateTags: vi.fn(),
}));

vi.mock('@/lib/ai/summarization', () => ({
  generateSummary: vi.fn(),
}));

vi.mock('@/lib/ai/embeddings', () => ({
  upsertContentEmbedding: vi.fn(),
}));

// Mock rate limiting to allow by default
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(() => ({
    success: true,
    remaining: 99,
    resetTime: Date.now() + 60000,
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
  RATE_LIMITS: { api: { maxRequests: 100, windowMs: 60000 } },
}));

// Mock drizzle-orm operators
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((_col: unknown, val: unknown) => ({ op: 'eq', val })),
  desc: vi.fn((col: unknown) => ({ op: 'desc', col })),
  and: vi.fn((...args: unknown[]) => ({ op: 'and', conditions: args })),
  lt: vi.fn((_col: unknown, val: unknown) => ({ op: 'lt', val })),
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
    createdAt: 'content.createdAt',
    isFavorite: 'content.isFavorite',
    summary: 'content.summary',
    metadata: 'content.metadata',
  },
}));

import { auth } from '@/lib/auth';
import { authenticateApiKey } from '@/lib/api-key-auth';
import { db } from '@/lib/db/client';
import { generateTags } from '@/lib/ai/gemini';
import { generateSummary } from '@/lib/ai/summarization';
import { upsertContentEmbedding } from '@/lib/ai/embeddings';
import { checkRateLimit, rateLimitExceededResponse } from '@/lib/rate-limit';

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockAuthenticateApiKey = authenticateApiKey as unknown as ReturnType<typeof vi.fn>;
const mockCheckRateLimit = checkRateLimit as unknown as ReturnType<typeof vi.fn>;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _mockRateLimitExceededResponse = rateLimitExceededResponse as unknown as ReturnType<typeof vi.fn>;
const mockGenerateTags = generateTags as unknown as ReturnType<typeof vi.fn>;
const mockGenerateSummary = generateSummary as unknown as ReturnType<typeof vi.fn>;
const mockUpsertContentEmbedding = upsertContentEmbedding as unknown as ReturnType<typeof vi.fn>;

import { GET, POST } from './route';

// Helper to create a mock NextRequest
function createMockRequest(
  url: string,
  options?: RequestInit
): NextRequest {
  return new NextRequest(url, options as never);
}

// Helper to build a chain for db.select()
function mockSelectChain(items: unknown[]) {
  const chain = {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(items),
        }),
      }),
    }),
  };
  vi.mocked(db.select).mockReturnValue(chain as never);
  return chain;
}

// Helper to build a chain for db.insert()
function mockInsertChain(returnedItems: unknown[]) {
  const chain = {
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue(returnedItems),
    }),
  };
  vi.mocked(db.insert).mockReturnValue(chain as never);
  return chain;
}

const BASE_URL = 'http://localhost:3000/api/v1/content';

describe('/api/v1/content', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: rate limit passes, no auth
    mockCheckRateLimit.mockReturnValue({
      success: true,
      remaining: 99,
      resetTime: Date.now() + 60000,
    });
    mockAuth.mockResolvedValue(null);
    mockAuthenticateApiKey.mockResolvedValue({ success: false, error: 'Invalid' });
    mockGenerateTags.mockResolvedValue(['tag1', 'tag2']);
    mockGenerateSummary.mockResolvedValue('A summary');
    mockUpsertContentEmbedding.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── GET tests ──

  describe('GET - List content', () => {
    it('should return 429 when rate limit is exceeded', async () => {
      mockCheckRateLimit.mockReturnValue({
        success: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
        retryAfter: 60,
      });

      const request = createMockRequest(BASE_URL);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe('Too many requests');
    });

    it('should return 401 when no auth is provided (no API key, no session)', async () => {
      mockAuth.mockResolvedValue(null);

      const request = createMockRequest(BASE_URL);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 200 with items when authenticated via API key', async () => {
      const mockItems = [
        {
          id: 'item-1',
          type: 'note',
          title: 'Test Note',
          body: 'Body',
          url: null,
          tags: [],
          autoTags: [],
          createdAt: new Date('2024-06-01'),
          isFavorite: false,
          summary: null,
        },
      ];
      mockAuthenticateApiKey.mockResolvedValue({ success: true, userId: 'user-123', keyId: 'key-1' });
      mockSelectChain(mockItems);

      const request = createMockRequest(BASE_URL, {
        headers: { Authorization: 'Bearer mw_test12345' },
      });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].id).toBe('item-1');
      expect(data.hasMore).toBe(false);
      expect(data.nextCursor).toBeNull();
    });

    it('should return 200 with items when authenticated via session', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-456', email: 'test@example.com' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });
      const mockItems = [
        {
          id: 'item-2',
          type: 'link',
          title: 'Bookmark',
          body: null,
          url: 'https://example.com',
          tags: ['web'],
          autoTags: ['dev'],
          createdAt: new Date('2024-05-15'),
          isFavorite: true,
          summary: 'A link',
        },
      ];
      mockSelectChain(mockItems);

      const request = createMockRequest(BASE_URL);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].title).toBe('Bookmark');
      expect(data.hasMore).toBe(false);
    });

    it('should use cursor-based pagination when cursor param is provided', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-456' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const mockItems = [
        {
          id: 'item-3',
          type: 'note',
          title: 'Older Note',
          body: null,
          url: null,
          tags: [],
          autoTags: [],
          createdAt: new Date('2024-04-01'),
          isFavorite: false,
          summary: null,
        },
      ];
      const chain = mockSelectChain(mockItems);

      const cursorDate = '2024-06-01T00:00:00.000Z';
      const request = createMockRequest(`${BASE_URL}?cursor=${cursorDate}`);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      // Verify the select chain was called (cursor param triggers lt condition)
      expect(chain.from).toHaveBeenCalled();
    });

    it('should filter by type when type param is provided', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-456' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const mockItems = [
        {
          id: 'item-4',
          type: 'note',
          title: 'Filtered Note',
          body: 'content',
          url: null,
          tags: [],
          autoTags: [],
          createdAt: new Date('2024-05-01'),
          isFavorite: false,
          summary: null,
        },
      ];
      mockSelectChain(mockItems);

      const request = createMockRequest(`${BASE_URL}?type=note`);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].type).toBe('note');
    });

    it('should clamp limit=200 to max of 100', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-456' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const mockItems: unknown[] = [];
      const chain = mockSelectChain(mockItems);
      const limitMock = chain.from().where().orderBy().limit;

      const request = createMockRequest(`${BASE_URL}?limit=200`);
      await GET(request);

      // limit(100 + 1) = limit(101) because the code does limit + 1 for hasMore
      expect(limitMock).toHaveBeenCalledWith(101);
    });

    it('should clamp limit=0 to min of 1', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-456' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const mockItems: unknown[] = [];
      const chain = mockSelectChain(mockItems);
      const limitMock = chain.from().where().orderBy().limit;

      const request = createMockRequest(`${BASE_URL}?limit=0`);
      await GET(request);

      // limit(1 + 1) = limit(2) because the code does limit + 1 for hasMore
      expect(limitMock).toHaveBeenCalledWith(2);
    });

    it('should return hasMore=true and nextCursor when items exceed limit', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-456' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      // When limit=2, the code fetches limit+1=3 items. If it gets 3, hasMore=true.
      const mockDate = new Date('2024-05-01');
      const mockItems = [
        { id: '1', type: 'note', title: 'A', body: null, url: null, tags: [], autoTags: [], createdAt: new Date('2024-06-01'), isFavorite: false, summary: null },
        { id: '2', type: 'note', title: 'B', body: null, url: null, tags: [], autoTags: [], createdAt: mockDate, isFavorite: false, summary: null },
        { id: '3', type: 'note', title: 'C', body: null, url: null, tags: [], autoTags: [], createdAt: new Date('2024-04-01'), isFavorite: false, summary: null },
      ];
      mockSelectChain(mockItems);

      const request = createMockRequest(`${BASE_URL}?limit=2`);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(2);
      expect(data.hasMore).toBe(true);
      expect(data.nextCursor).toBe(mockDate.toISOString());
    });

    it('should return hasMore=false when items equal or less than limit', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-456' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const mockItems = [
        { id: '1', type: 'note', title: 'A', body: null, url: null, tags: [], autoTags: [], createdAt: new Date('2024-06-01'), isFavorite: false, summary: null },
      ];
      mockSelectChain(mockItems);

      const request = createMockRequest(`${BASE_URL}?limit=5`);
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.hasMore).toBe(false);
      expect(data.nextCursor).toBeNull();
    });

    it('should use default limit of 20 when no limit param is provided', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-456' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const chain = mockSelectChain([]);
      const limitMock = chain.from().where().orderBy().limit;

      const request = createMockRequest(BASE_URL);
      await GET(request);

      // default limit=20, code does limit+1=21
      expect(limitMock).toHaveBeenCalledWith(21);
    });

    it('should ignore invalid type filter', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-456' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      mockSelectChain([]);

      const request = createMockRequest(`${BASE_URL}?type=invalid`);
      const response = await GET(request);

      // Should not error, just not apply the filter
      expect(response.status).toBe(200);
    });

    it('should clamp negative limit to min of 1', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-456' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const chain = mockSelectChain([]);
      const limitMock = chain.from().where().orderBy().limit;

      const request = createMockRequest(`${BASE_URL}?limit=-5`);
      await GET(request);

      // Math.max(-5, 1) = 1, then limit+1 = 2
      expect(limitMock).toHaveBeenCalledWith(2);
    });
  });

  // ── POST tests ──

  describe('POST - Create content', () => {
    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const request = createMockRequest(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'note', title: 'Test' }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 429 when rate limit is exceeded', async () => {
      mockCheckRateLimit.mockReturnValue({
        success: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
        retryAfter: 60,
      });

      const request = createMockRequest(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'note', title: 'Test' }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe('Too many requests');
    });

    it('should return 400 for invalid JSON body', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const request = createMockRequest(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not valid json{{{',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid JSON body');
    });

    it('should return 400 with validation errors when body fails schema', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const request = createMockRequest(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'invalid_type', title: '' }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
    });

    it('should return 400 when title is missing', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const request = createMockRequest(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'note' }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 201 with created content on success', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const createdContent = {
        id: 'new-content-1',
        type: 'note',
        title: 'My Note',
        createdAt: new Date('2024-06-01'),
      };
      mockInsertChain([createdContent]);

      const request = createMockRequest(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'note', title: 'My Note', body: 'Some body text' }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.id).toBe('new-content-1');
      expect(data.data.title).toBe('My Note');
    });

    it('should call generateTags and generateSummary during creation', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      mockInsertChain([{
        id: 'new-content-2',
        type: 'note',
        title: 'AI Note',
        createdAt: new Date(),
      }]);

      const request = createMockRequest(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'note', title: 'AI Note', body: 'Content for AI' }),
      });
      await POST(request);

      expect(mockGenerateTags).toHaveBeenCalled();
      expect(mockGenerateSummary).toHaveBeenCalled();
    });

    it('should call upsertContentEmbedding after creation', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      mockInsertChain([{
        id: 'new-content-3',
        type: 'note',
        title: 'Embed Note',
        createdAt: new Date(),
      }]);

      const request = createMockRequest(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'note', title: 'Embed Note' }),
      });
      await POST(request);

      expect(mockUpsertContentEmbedding).toHaveBeenCalledWith('new-content-3');
    });

    it('should still create content when generateTags throws', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      mockGenerateTags.mockRejectedValue(new Error('AI service down'));

      const createdContent = {
        id: 'new-content-4',
        type: 'note',
        title: 'Robust Note',
        createdAt: new Date(),
      };
      mockInsertChain([createdContent]);

      const request = createMockRequest(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'note', title: 'Robust Note', body: 'Will survive AI failure' }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.id).toBe('new-content-4');
    });

    it('should still create content when generateSummary throws', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      mockGenerateSummary.mockRejectedValue(new Error('Summary service down'));

      const createdContent = {
        id: 'new-content-5',
        type: 'note',
        title: 'Summary Fail Note',
        createdAt: new Date(),
      };
      mockInsertChain([createdContent]);

      const request = createMockRequest(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'note', title: 'Summary Fail Note' }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.id).toBe('new-content-5');
    });

    it('should accept content with tags and metadata', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123' },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const createdContent = {
        id: 'new-content-6',
        type: 'link',
        title: 'Tagged Link',
        createdAt: new Date(),
      };
      mockInsertChain([createdContent]);

      const request = createMockRequest(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'link',
          title: 'Tagged Link',
          url: 'https://example.com',
          tags: ['web', 'dev'],
          metadata: { source: 'browser' },
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.id).toBe('new-content-6');
    });

    it('should authenticate via API key for POST requests', async () => {
      mockAuthenticateApiKey.mockResolvedValue({ success: true, userId: 'user-api', keyId: 'key-1' });

      const createdContent = {
        id: 'new-content-7',
        type: 'note',
        title: 'API Key Note',
        createdAt: new Date(),
      };
      mockInsertChain([createdContent]);

      const request = createMockRequest(BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mw_test12345',
        },
        body: JSON.stringify({ type: 'note', title: 'API Key Note' }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(mockAuthenticateApiKey).toHaveBeenCalled();
      expect(data.data.id).toBe('new-content-7');
    });
  });
});
