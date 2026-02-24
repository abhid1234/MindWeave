import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockAuth, mockDbQuery, mockDbInsert, mockDbExecute, mockDbSelectDistinct } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDbQuery: {
    contentViews: { findFirst: vi.fn() },
  },
  mockDbInsert: vi.fn(),
  mockDbExecute: vi.fn(),
  mockDbSelectDistinct: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

vi.mock('@/lib/db/client', () => ({
  db: {
    query: mockDbQuery,
    insert: () => ({
      values: mockDbInsert,
    }),
    execute: mockDbExecute,
    selectDistinct: () => ({
      from: () => ({
        where: () => mockDbSelectDistinct(),
      }),
    }),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  contentViews: { userId: 'user_id', contentId: 'content_id', viewedAt: 'viewed_at' },
  content: { id: 'id' },
}));

import { trackContentViewAction, getRecentlyViewedAction, getViewedContentIdsAction } from './views';

describe('View Tracking Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('trackContentViewAction', () => {
    it('should track a view successfully', async () => {
      mockDbQuery.contentViews.findFirst.mockResolvedValueOnce(null);
      mockDbInsert.mockResolvedValueOnce(undefined);

      const result = await trackContentViewAction('content-1');

      expect(result.success).toBe(true);
      expect(mockDbInsert).toHaveBeenCalled();
    });

    it('should debounce duplicate views within 30s', async () => {
      mockDbQuery.contentViews.findFirst.mockResolvedValueOnce({
        id: 'view-1',
        userId: 'user-123',
        contentId: 'content-1',
        viewedAt: new Date(),
      });

      const result = await trackContentViewAction('content-1');

      expect(result.success).toBe(true);
      expect(mockDbInsert).not.toHaveBeenCalled();
    });

    it('should return error when not authenticated', async () => {
      mockAuth.mockResolvedValueOnce(null);

      const result = await trackContentViewAction('content-1');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unauthorized');
    });

    it('should return error for empty content ID', async () => {
      const result = await trackContentViewAction('');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid content ID');
    });

    it('should handle database errors gracefully', async () => {
      mockDbQuery.contentViews.findFirst.mockRejectedValueOnce(new Error('DB error'));

      const result = await trackContentViewAction('content-1');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to track view');
    });
  });

  describe('getRecentlyViewedAction', () => {
    it('should return recently viewed items', async () => {
      const now = new Date();
      mockDbExecute.mockResolvedValueOnce([
        { id: 'content-1', title: 'Note 1', type: 'note', lastViewedAt: now },
        { id: 'content-2', title: 'Link 1', type: 'link', lastViewedAt: new Date(now.getTime() - 60000) },
      ]);

      const result = await getRecentlyViewedAction(10);

      expect(result.success).toBe(true);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe('content-1');
    });

    it('should return error when not authenticated', async () => {
      mockAuth.mockResolvedValueOnce(null);

      const result = await getRecentlyViewedAction();

      expect(result.success).toBe(false);
      expect(result.items).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      mockDbExecute.mockRejectedValueOnce(new Error('DB error'));

      const result = await getRecentlyViewedAction();

      expect(result.success).toBe(false);
      expect(result.items).toEqual([]);
    });

    it('should limit results', async () => {
      const items = Array.from({ length: 5 }, (_, i) => ({
        id: `content-${i}`,
        title: `Item ${i}`,
        type: 'note',
        lastViewedAt: new Date(Date.now() - i * 60000),
      }));
      mockDbExecute.mockResolvedValueOnce(items);

      const result = await getRecentlyViewedAction(3);

      expect(result.success).toBe(true);
      expect(result.items).toHaveLength(3);
    });
  });

  describe('getViewedContentIdsAction', () => {
    it('should return viewed content IDs', async () => {
      mockDbSelectDistinct.mockResolvedValueOnce([
        { contentId: 'content-1' },
        { contentId: 'content-2' },
      ]);

      const result = await getViewedContentIdsAction();

      expect(result.success).toBe(true);
      expect(result.ids).toEqual(['content-1', 'content-2']);
    });

    it('should return error when not authenticated', async () => {
      mockAuth.mockResolvedValueOnce(null);

      const result = await getViewedContentIdsAction();

      expect(result.success).toBe(false);
      expect(result.ids).toEqual([]);
    });

    it('should return empty array when no views', async () => {
      mockDbSelectDistinct.mockResolvedValueOnce([]);

      const result = await getViewedContentIdsAction();

      expect(result.success).toBe(true);
      expect(result.ids).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      mockDbSelectDistinct.mockRejectedValueOnce(new Error('DB error'));

      const result = await getViewedContentIdsAction();

      expect(result.success).toBe(false);
      expect(result.ids).toEqual([]);
    });
  });
});
