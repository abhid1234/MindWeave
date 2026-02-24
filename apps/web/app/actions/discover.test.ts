import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockAuth, mockGetRecommendations, mockDbExecute, mockDbSelect } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetRecommendations: vi.fn(),
  mockDbExecute: vi.fn(),
  mockDbSelect: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

vi.mock('@/lib/db/client', () => ({
  db: {
    execute: (...args: unknown[]) => mockDbExecute(...args),
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: () => mockDbSelect(),
          }),
        }),
      }),
    }),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  content: { id: 'id', userId: 'user_id', createdAt: 'created_at' },
  contentViews: { userId: 'user_id', contentId: 'content_id', viewedAt: 'viewed_at' },
  embeddings: {},
}));

vi.mock('@/lib/ai/embeddings', () => ({
  getRecommendations: (...args: unknown[]) => mockGetRecommendations(...args),
}));

vi.mock('@/lib/recommendations', () => ({
  calculateBlendedScore: vi.fn().mockReturnValue(0.75),
}));

import {
  getActivityBasedRecommendationsAction,
  getUnexploredTopicsAction,
  getRediscoverAction,
  getBlendedRecommendationsAction,
} from './discover';

const makeRec = (id: string, similarity: number = 0.8) => ({
  id,
  title: `Item ${id}`,
  body: null,
  type: 'note' as const,
  tags: ['test'],
  autoTags: [],
  url: null,
  createdAt: new Date('2025-06-01'),
  similarity,
});

describe('Discover Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getActivityBasedRecommendationsAction', () => {
    it('should return error when not authenticated', async () => {
      mockAuth.mockResolvedValueOnce(null);

      const result = await getActivityBasedRecommendationsAction();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unauthorized');
      expect(result.results).toEqual([]);
    });

    it('should return empty when no recent views', async () => {
      // First call: recent views (empty)
      mockDbExecute.mockResolvedValueOnce([]);

      const result = await getActivityBasedRecommendationsAction();

      expect(result.success).toBe(true);
      expect(result.results).toEqual([]);
    });

    it('should return recommendations based on recent views', async () => {
      // First call: recent distinct views
      mockDbExecute
        .mockResolvedValueOnce([
          { contentId: 'seed-1', viewedAt: new Date('2025-06-15') },
        ])
        // Second call: recently viewed IDs (24h)
        .mockResolvedValueOnce([
          { contentId: 'seed-1' },
        ])
        // Third call: all views for viewedAtMap
        .mockResolvedValueOnce([
          { contentId: 'seed-1', viewedAt: new Date('2025-06-15') },
        ]);

      mockGetRecommendations.mockResolvedValueOnce([
        makeRec('rec-1', 0.9),
        makeRec('rec-2', 0.8),
      ]);

      const result = await getActivityBasedRecommendationsAction();

      expect(result.success).toBe(true);
      // rec-1 should not be excluded since it's not in recentlyViewedIds (only seed-1 is)
      // Actually rec-1 and rec-2 are not in recentlyViewedIds, so both should appear
      expect(result.results.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle errors gracefully', async () => {
      mockDbExecute.mockRejectedValueOnce(new Error('DB error'));

      const result = await getActivityBasedRecommendationsAction();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed');
      expect(result.results).toEqual([]);
    });
  });

  describe('getUnexploredTopicsAction', () => {
    it('should return error when not authenticated', async () => {
      mockAuth.mockResolvedValueOnce(null);

      const result = await getUnexploredTopicsAction();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unauthorized');
    });

    it('should return empty when no viewed tags', async () => {
      // Tags from viewed content (empty)
      mockDbExecute.mockResolvedValueOnce([]);

      const result = await getUnexploredTopicsAction();

      expect(result.success).toBe(true);
      expect(result.results).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      mockDbExecute.mockRejectedValueOnce(new Error('DB error'));

      const result = await getUnexploredTopicsAction();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed');
    });
  });

  describe('getRediscoverAction', () => {
    it('should return error when not authenticated', async () => {
      mockAuth.mockResolvedValueOnce(null);

      const result = await getRediscoverAction();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unauthorized');
    });

    it('should return empty when no recent views', async () => {
      mockDbExecute.mockResolvedValueOnce([]);

      const result = await getRediscoverAction();

      expect(result.success).toBe(true);
      expect(result.results).toEqual([]);
    });

    it('should return old content similar to recent views', async () => {
      const oldDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); // 60 days ago

      // recent views
      mockDbExecute
        .mockResolvedValueOnce([
          { contentId: 'seed-1', viewedAt: new Date() },
        ])
        // recently viewed IDs (30d)
        .mockResolvedValueOnce([
          { contentId: 'seed-1' },
        ]);

      mockGetRecommendations.mockResolvedValueOnce([
        { ...makeRec('old-1', 0.7), createdAt: oldDate },
      ]);

      const result = await getRediscoverAction();

      expect(result.success).toBe(true);
      expect(result.results.length).toBe(1);
      expect(result.results[0].id).toBe('old-1');
    });

    it('should exclude content viewed in last 30d', async () => {
      const oldDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

      mockDbExecute
        .mockResolvedValueOnce([
          { contentId: 'seed-1', viewedAt: new Date() },
        ])
        .mockResolvedValueOnce([
          { contentId: 'seed-1' },
          { contentId: 'old-1' }, // old-1 was recently viewed
        ]);

      mockGetRecommendations.mockResolvedValueOnce([
        { ...makeRec('old-1', 0.7), createdAt: oldDate },
      ]);

      const result = await getRediscoverAction();

      expect(result.success).toBe(true);
      expect(result.results.length).toBe(0);
    });

    it('should handle errors gracefully', async () => {
      mockDbExecute.mockRejectedValueOnce(new Error('DB error'));

      const result = await getRediscoverAction();

      expect(result.success).toBe(false);
      expect(result.results).toEqual([]);
    });
  });

  describe('getBlendedRecommendationsAction', () => {
    it('should return error when not authenticated', async () => {
      mockAuth.mockResolvedValueOnce(null);

      const result = await getBlendedRecommendationsAction();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unauthorized');
    });

    it('should return empty when user has no content', async () => {
      mockDbSelect.mockResolvedValueOnce([]);

      const result = await getBlendedRecommendationsAction();

      expect(result.success).toBe(true);
      expect(result.results).toEqual([]);
    });

    it('should return blended recommendations', async () => {
      mockDbSelect.mockResolvedValueOnce([
        { id: 'content-1' },
        { id: 'content-2' },
      ]);

      // view history
      mockDbExecute.mockResolvedValueOnce([
        { contentId: 'content-1', viewedAt: new Date() },
      ]);

      mockGetRecommendations
        .mockResolvedValueOnce([makeRec('rec-1', 0.9)])
        .mockResolvedValueOnce([makeRec('rec-2', 0.7)]);

      const result = await getBlendedRecommendationsAction();

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
    });

    it('should deduplicate recommendations across seeds', async () => {
      mockDbSelect.mockResolvedValueOnce([
        { id: 'content-1' },
        { id: 'content-2' },
      ]);

      mockDbExecute.mockResolvedValueOnce([]);

      mockGetRecommendations
        .mockResolvedValueOnce([makeRec('rec-1', 0.9)])
        .mockResolvedValueOnce([makeRec('rec-1', 0.8)]); // same rec from different seed

      const result = await getBlendedRecommendationsAction();

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
    });

    it('should not recommend seed content', async () => {
      mockDbSelect.mockResolvedValueOnce([
        { id: 'content-1' },
      ]);

      mockDbExecute.mockResolvedValueOnce([]);

      mockGetRecommendations.mockResolvedValueOnce([
        makeRec('content-1', 1.0), // same as seed
        makeRec('rec-1', 0.8),
      ]);

      const result = await getBlendedRecommendationsAction();

      expect(result.success).toBe(true);
      expect(result.results.map(r => r.id)).not.toContain('content-1');
    });

    it('should handle errors gracefully', async () => {
      mockDbSelect.mockRejectedValueOnce(new Error('DB error'));

      const result = await getBlendedRecommendationsAction();

      expect(result.success).toBe(false);
      expect(result.results).toEqual([]);
    });
  });
});
