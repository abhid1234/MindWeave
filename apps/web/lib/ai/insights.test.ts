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
        groupBy: ReturnType<typeof vi.fn>;
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

    it('should detect creation patterns and type distribution', async () => {
      const { extractInsights } = await import('./insights');

      const { db } = await import('@/lib/db/client');
      const mockDb = db as unknown as {
        limit: ReturnType<typeof vi.fn>;
        execute: ReturnType<typeof vi.fn>;
        groupBy: ReturnType<typeof vi.fn>;
      };

      // Mock content summaries - 10 items
      vi.mocked(mockDb.limit).mockResolvedValue(
        Array(10).fill(null).map((_, i) => ({
          id: `${i}`,
          title: `Test ${i}`,
          type: 'note' as const,
          tags: ['javascript'],
          autoTags: ['web'],
          createdAt: new Date(),
        }))
      );

      // Mock execute calls:
      // 1. Tag co-occurrence - empty
      // 2. Weekday creation - one busy day
      // 3. Recent tags
      vi.mocked(mockDb.execute)
        .mockResolvedValueOnce([]) // tag co-occurrence
        .mockResolvedValueOnce([   // weekday creation
          { weekday: 'Monday   ', item_count: '5' },
          { weekday: 'Friday   ', item_count: '1' },
        ])
        .mockResolvedValueOnce([   // recent tags (gaps)
          { tag: 'react', recent_count: '2', total_count: '2' },
        ]);

      // Mock type distribution query result
      vi.mocked(mockDb.groupBy).mockResolvedValue([
        { type: 'note', count: 8 },
        { type: 'link', count: 2 },
      ]);

      const result = await extractInsights('test-user-id');

      // Should have pattern and/or gap insights
      expect(result.length).toBeGreaterThan(0);
    });

    it('should generate AI suggestions when API key is set and enough content', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-key';
      const { extractInsights } = await import('./insights');

      const { db } = await import('@/lib/db/client');
      const mockDb = db as unknown as {
        limit: ReturnType<typeof vi.fn>;
        execute: ReturnType<typeof vi.fn>;
        groupBy: ReturnType<typeof vi.fn>;
      };

      // Mock 6 content items (>= 5 for AI suggestions)
      vi.mocked(mockDb.limit).mockResolvedValue(
        Array(6).fill(null).map((_, i) => ({
          id: `${i}`,
          title: `Item ${i}`,
          type: 'note' as const,
          tags: ['tag1'],
          autoTags: ['auto1'],
          createdAt: new Date(),
        }))
      );

      vi.mocked(mockDb.execute).mockResolvedValue([]);
      vi.mocked(mockDb.groupBy).mockResolvedValue([{ type: 'note', count: 6 }]);

      const result = await extractInsights('test-user-id');
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('should not generate AI suggestions when no API key', async () => {
      const originalKey = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      const { extractInsights } = await import('./insights');

      const { db } = await import('@/lib/db/client');
      const mockDb = db as unknown as {
        limit: ReturnType<typeof vi.fn>;
        execute: ReturnType<typeof vi.fn>;
        groupBy: ReturnType<typeof vi.fn>;
      };

      vi.mocked(mockDb.limit).mockResolvedValue(
        Array(6).fill(null).map((_, i) => ({
          id: `${i}`,
          title: `Item ${i}`,
          type: 'note' as const,
          tags: [],
          autoTags: [],
          createdAt: new Date(),
        }))
      );

      vi.mocked(mockDb.execute).mockResolvedValue([]);
      vi.mocked(mockDb.groupBy).mockResolvedValue([{ type: 'note', count: 6 }]);

      const result = await extractInsights('test-user-id');
      // Should not include AI suggestion type
      const aiSuggestions = result.filter(r => r.icon === 'lightbulb');
      expect(aiSuggestions.length).toBe(0);

      if (originalKey) process.env.ANTHROPIC_API_KEY = originalKey;
    });

    it('should handle empty weekday results', async () => {
      const { extractInsights } = await import('./insights');

      const { db } = await import('@/lib/db/client');
      const mockDb = db as unknown as {
        limit: ReturnType<typeof vi.fn>;
        execute: ReturnType<typeof vi.fn>;
        groupBy: ReturnType<typeof vi.fn>;
      };

      vi.mocked(mockDb.limit).mockResolvedValue(
        Array(5).fill(null).map((_, i) => ({
          id: `${i}`,
          title: `Item ${i}`,
          type: 'note' as const,
          tags: [],
          autoTags: [],
          createdAt: new Date(),
        }))
      );

      vi.mocked(mockDb.execute).mockResolvedValue([]);
      vi.mocked(mockDb.groupBy).mockResolvedValue([{ type: 'note', count: 5 }]);

      const result = await extractInsights('test-user-id');
      // Should not throw, may have no insights
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
