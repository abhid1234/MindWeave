import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Anthropic before importing
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: '{"name": "Test Cluster", "description": "Test description"}' }],
        }),
      };
    },
  };
});

// Mock dependencies
vi.mock('@/lib/db/client', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([]),
  },
}));

describe('Content Clustering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('clusterContent', () => {
    it('should return empty array when no content has embeddings', async () => {
      const { clusterContent } = await import('./clustering');

      const result = await clusterContent('test-user-id');

      expect(result).toEqual([]);
    });

    it('should return empty array when only 1 content item exists', async () => {
      const { clusterContent } = await import('./clustering');

      // Mock db to return only 1 item
      const { db } = await import('@/lib/db/client');
      const mockDb = db as unknown as {
        select: ReturnType<typeof vi.fn>;
        from: ReturnType<typeof vi.fn>;
        innerJoin: ReturnType<typeof vi.fn>;
        where: ReturnType<typeof vi.fn>;
      };
      vi.mocked(mockDb.select).mockReturnThis();
      vi.mocked(mockDb.from).mockReturnThis();
      vi.mocked(mockDb.innerJoin).mockReturnThis();
      vi.mocked(mockDb.where).mockResolvedValue([
        {
          contentId: '1',
          title: 'Test',
          type: 'note',
          embedding: Array(768).fill(0),
        },
      ]);

      const result = await clusterContent('test-user-id');

      expect(result).toEqual([]);
    });
  });

  describe('k-means algorithm edge cases', () => {
    it('should handle empty data', async () => {
      const { clusterContent } = await import('./clustering');

      const result = await clusterContent('empty-user');

      expect(result).toEqual([]);
    });
  });
});
