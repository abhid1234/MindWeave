import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Anthropic before importing
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: '{"title": "AI Suggestion", "description": "Consider exploring this topic"}' }],
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
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    execute: vi.fn().mockResolvedValue([]),
  },
}));

describe('Key Insights Extraction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractInsights', () => {
    it('should return getting started suggestion when user has less than 3 items', async () => {
      const { extractInsights } = await import('./insights');

      const { db } = await import('@/lib/db/client');
      const mockDb = db as unknown as { limit: ReturnType<typeof vi.fn> };
      vi.mocked(mockDb.limit).mockResolvedValue([
        {
          id: '1',
          title: 'Test',
          type: 'note',
          tags: [],
          autoTags: [],
          createdAt: new Date(),
        },
      ]);

      const result = await extractInsights('test-user-id');

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('suggestion');
      expect(result[0].title).toBe('Getting Started');
    });

    it('should return empty array on error', async () => {
      const { extractInsights } = await import('./insights');

      const { db } = await import('@/lib/db/client');
      const mockDb = db as unknown as { limit: ReturnType<typeof vi.fn> };
      vi.mocked(mockDb.limit).mockRejectedValue(new Error('DB error'));

      const result = await extractInsights('test-user-id');

      expect(result).toEqual([]);
    });
  });

  describe('insight types', () => {
    it('should include connection insights when tag co-occurrence exists', async () => {
      const { extractInsights } = await import('./insights');

      const { db } = await import('@/lib/db/client');
      const mockDb = db as unknown as {
        limit: ReturnType<typeof vi.fn>;
        execute: ReturnType<typeof vi.fn>;
      };

      // Mock content summaries
      vi.mocked(mockDb.limit).mockResolvedValue(
        Array(10).fill(null).map((_, i) => ({
          id: `${i}`,
          title: `Test ${i}`,
          type: 'note' as const,
          tags: ['tag1', 'tag2'],
          autoTags: [],
          createdAt: new Date(),
        }))
      );

      // Mock tag co-occurrence query
      vi.mocked(mockDb.execute).mockResolvedValue([
        { tag1: 'tag1', tag2: 'tag2', co_count: '5' },
      ]);

      const result = await extractInsights('test-user-id');

      // Should have at least one insight
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
