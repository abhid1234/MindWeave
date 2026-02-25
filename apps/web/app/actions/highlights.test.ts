import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockAuth, mockDbSelect, mockDbInsert, mockDbDelete, mockGenerateHighlightInsight } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDbSelect: vi.fn(),
  mockDbInsert: vi.fn(),
  mockDbDelete: vi.fn(),
  mockGenerateHighlightInsight: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

vi.mock('@/lib/db/client', () => {
  const makeSelectChain = () => {
    const chain: Record<string, unknown> = {};
    chain.from = vi.fn(() => chain);
    chain.where = vi.fn(() => chain);
    chain.orderBy = vi.fn(() => chain);
    chain.limit = vi.fn(() => chain);
    chain.innerJoin = vi.fn(() => chain);
    chain.then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) =>
      Promise.resolve(mockDbSelect()).then(resolve, reject);
    return chain;
  };

  return {
    db: {
      select: () => makeSelectChain(),
      insert: () => ({
        values: vi.fn(() => ({
          onConflictDoUpdate: vi.fn(() => mockDbInsert()),
          then: (resolve: (v: unknown) => void, reject?: (e: unknown) => void) =>
            Promise.resolve(mockDbInsert()).then(resolve, reject),
        })),
      }),
      delete: () => ({
        where: vi.fn(() => mockDbDelete()),
      }),
    },
  };
});

vi.mock('@/lib/db/schema', () => ({
  content: {
    id: 'id',
    userId: 'userId',
    title: 'title',
    type: 'type',
    body: 'body',
    tags: 'tags',
  },
  dailyHighlights: {
    userId: 'userId',
    contentId: 'contentId',
    insight: 'insight',
    date: 'date',
    createdAt: 'createdAt',
  },
  contentViews: {
    userId: 'userId',
    contentId: 'contentId',
    viewedAt: 'viewedAt',
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  checkServerActionRateLimit: () => ({ success: true }),
  RATE_LIMITS: {
    serverAction: { maxRequests: 30, windowMs: 60000 },
    serverActionAI: { maxRequests: 10, windowMs: 60000 },
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: unknown[]) => ({ op: 'eq', args })),
  and: vi.fn((...args: unknown[]) => ({ op: 'and', args })),
  sql: vi.fn(),
  not: vi.fn((v: unknown) => ({ op: 'not', v })),
  inArray: vi.fn((...args: unknown[]) => ({ op: 'inArray', args })),
}));

vi.mock('@/lib/ai/gemini', () => ({
  generateHighlightInsight: (input: unknown) => mockGenerateHighlightInsight(input),
}));

import { getDailyHighlightAction, dismissHighlightAction } from './highlights';

describe('Highlight Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ── getDailyHighlightAction ─────────────────────────────────────

  describe('getDailyHighlightAction', () => {
    it('should return unauthorized when not logged in', async () => {
      mockAuth.mockResolvedValueOnce(null);

      const result = await getDailyHighlightAction();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
    });

    it('should return cached highlight when one exists for today', async () => {
      // First select: cached daily highlight found
      mockDbSelect.mockResolvedValueOnce([
        { userId: 'user-1', contentId: 'content-1', insight: 'Great insight', date: new Date().toISOString().slice(0, 10) },
      ]);
      // Second select: content lookup for the cached highlight
      mockDbSelect.mockResolvedValueOnce([
        { id: 'content-1', title: 'My Note', type: 'note', tags: ['javascript'] },
      ]);

      const result = await getDailyHighlightAction();

      expect(result.success).toBe(true);
      expect(result.highlight).toBeDefined();
      expect(result.highlight!.contentId).toBe('content-1');
      expect(result.highlight!.title).toBe('My Note');
      expect(result.highlight!.insight).toBe('Great insight');
      expect(result.highlight!.tags).toEqual(['javascript']);
    });

    it('should generate new highlight when no cache exists', async () => {
      // First select: no cached highlight
      mockDbSelect.mockResolvedValueOnce([]);
      // Second select: recently viewed content IDs
      mockDbSelect.mockResolvedValueOnce([]);
      // Third select: eligible content
      mockDbSelect.mockResolvedValueOnce([
        { id: 'content-2', title: 'React Hooks', type: 'note', body: 'Learn about hooks', tags: ['react'] },
      ]);
      // generateHighlightInsight mock
      mockGenerateHighlightInsight.mockResolvedValueOnce('Hooks are fundamental to modern React development.');
      // insert into dailyHighlights
      mockDbInsert.mockResolvedValueOnce(undefined);

      const result = await getDailyHighlightAction();

      expect(result.success).toBe(true);
      expect(result.highlight).toBeDefined();
      expect(result.highlight!.contentId).toBe('content-2');
      expect(result.highlight!.title).toBe('React Hooks');
      expect(result.highlight!.insight).toBe('Hooks are fundamental to modern React development.');
      expect(result.highlight!.tags).toEqual(['react']);
    });

    it('should return null when no eligible content exists', async () => {
      // First select: no cached highlight
      mockDbSelect.mockResolvedValueOnce([]);
      // Second select: recently viewed content IDs
      mockDbSelect.mockResolvedValueOnce([]);
      // Third select: no eligible content
      mockDbSelect.mockResolvedValueOnce([]);

      const result = await getDailyHighlightAction();

      expect(result.success).toBe(true);
      expect(result.highlight).toBeNull();
    });

    it('should clear stale highlight when cached content is deleted', async () => {
      // First select: cached daily highlight exists
      mockDbSelect.mockResolvedValueOnce([
        { userId: 'user-1', contentId: 'deleted-content', insight: 'Old insight', date: new Date().toISOString().slice(0, 10) },
      ]);
      // Second select: content lookup returns empty (content was deleted)
      mockDbSelect.mockResolvedValueOnce([]);
      // delete the stale highlight
      mockDbDelete.mockResolvedValueOnce(undefined);

      const result = await getDailyHighlightAction();

      expect(result.success).toBe(true);
      expect(result.highlight).toBeNull();
    });

    it('should call generateHighlightInsight with correct input', async () => {
      // First select: no cached highlight
      mockDbSelect.mockResolvedValueOnce([]);
      // Second select: recently viewed
      mockDbSelect.mockResolvedValueOnce([]);
      // Third select: eligible content
      mockDbSelect.mockResolvedValueOnce([
        { id: 'content-3', title: 'TypeScript Tips', type: 'note', body: 'Advanced TS patterns', tags: ['typescript', 'tips'] },
      ]);
      mockGenerateHighlightInsight.mockResolvedValueOnce('TypeScript tips sharpen your code quality.');
      mockDbInsert.mockResolvedValueOnce(undefined);

      await getDailyHighlightAction();

      expect(mockGenerateHighlightInsight).toHaveBeenCalledOnce();
      expect(mockGenerateHighlightInsight).toHaveBeenCalledWith({
        title: 'TypeScript Tips',
        body: 'Advanced TS patterns',
        tags: ['typescript', 'tips'],
      });
    });

    it('should handle null body by passing undefined to generateHighlightInsight', async () => {
      // First select: no cached highlight
      mockDbSelect.mockResolvedValueOnce([]);
      // Second select: recently viewed
      mockDbSelect.mockResolvedValueOnce([]);
      // Third select: eligible content with null body
      mockDbSelect.mockResolvedValueOnce([
        { id: 'content-4', title: 'Tagged Only', type: 'link', body: null, tags: ['bookmarks'] },
      ]);
      mockGenerateHighlightInsight.mockResolvedValueOnce('Great bookmark to revisit.');
      mockDbInsert.mockResolvedValueOnce(undefined);

      await getDailyHighlightAction();

      expect(mockGenerateHighlightInsight).toHaveBeenCalledWith({
        title: 'Tagged Only',
        body: undefined,
        tags: ['bookmarks'],
      });
    });
  });

  // ── dismissHighlightAction ──────────────────────────────────────

  describe('dismissHighlightAction', () => {
    it('should return unauthorized when not logged in', async () => {
      mockAuth.mockResolvedValueOnce(null);

      const result = await dismissHighlightAction('content-1');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
    });

    it('should create contentView and delete highlight on dismiss', async () => {
      mockDbInsert.mockResolvedValueOnce(undefined);
      mockDbDelete.mockResolvedValueOnce(undefined);

      const result = await dismissHighlightAction('content-1');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Highlight dismissed');
    });

    it('should return success message after dismissing', async () => {
      mockDbInsert.mockResolvedValueOnce(undefined);
      mockDbDelete.mockResolvedValueOnce(undefined);

      const result = await dismissHighlightAction('any-content-id');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Highlight dismissed');
      expect(result).toEqual({ success: true, message: 'Highlight dismissed' });
    });
  });
});
