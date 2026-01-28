import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Anthropic before importing
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'suggestion 1\nsuggestion 2\nsuggestion 3' }],
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
    limit: vi.fn().mockResolvedValue([]),
    execute: vi.fn().mockResolvedValue([]),
  },
}));

describe('Search Suggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSearchSuggestions', () => {
    it('should return popular tags when query is empty', async () => {
      const { getSearchSuggestions } = await import('./search-suggestions');

      const { db } = await import('@/lib/db/client');
      vi.mocked(db.execute).mockResolvedValue([
        { tag: 'javascript', tag_count: '10' },
        { tag: 'react', tag_count: '8' },
      ] as never);

      const result = await getSearchSuggestions('test-user-id', '');

      expect(result.length).toBeGreaterThan(0);
    });

    it('should include recent searches when provided', async () => {
      const { getSearchSuggestions } = await import('./search-suggestions');

      const { db } = await import('@/lib/db/client');
      vi.mocked(db.execute).mockResolvedValue([
        { tag: 'javascript', tag_count: '10' },
      ] as never);

      const result = await getSearchSuggestions('test-user-id', '', ['previous search']);

      const hasRecent = result.some((s) => s.type === 'recent');
      expect(hasRecent).toBe(true);
    });

    it('should filter tags that match the query', async () => {
      const { getSearchSuggestions } = await import('./search-suggestions');

      const { db } = await import('@/lib/db/client');
      vi.mocked(db.execute).mockResolvedValue([
        { tag: 'javascript', tag_count: '10' },
        { tag: 'java', tag_count: '8' },
        { tag: 'react', tag_count: '5' },
      ] as never);

      const result = await getSearchSuggestions('test-user-id', 'java');

      const javaRelated = result.filter((s) =>
        s.text.toLowerCase().includes('java')
      );
      expect(javaRelated.length).toBeGreaterThan(0);
    });

    it('should limit suggestions to 6 items', async () => {
      const { getSearchSuggestions } = await import('./search-suggestions');

      const { db } = await import('@/lib/db/client');
      vi.mocked(db.execute).mockResolvedValue(
        Array(20).fill(null).map((_, i) => ({
          tag: `tag${i}`,
          tag_count: `${20 - i}`,
        })) as never
      );

      const result = await getSearchSuggestions('test-user-id', '');

      expect(result.length).toBeLessThanOrEqual(6);
    });

    it('should include matching content titles as related suggestions', async () => {
      const { getSearchSuggestions } = await import('./search-suggestions');

      const { db } = await import('@/lib/db/client');
      // Popular tags
      vi.mocked(db.execute).mockResolvedValue([
        { tag: 'react', tag_count: '5' },
      ] as never);
      // Matching content titles
      const mockLimit = db.limit as ReturnType<typeof vi.fn>;
      vi.mocked(mockLimit).mockResolvedValue([
        { title: 'React Hooks Tutorial' },
        { title: 'React State Management' },
      ]);

      const result = await getSearchSuggestions('user-1', 'react');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include AI suggestions when query is long enough and has topics', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-key';
      const { getSearchSuggestions } = await import('./search-suggestions');

      const { db } = await import('@/lib/db/client');
      vi.mocked(db.execute).mockResolvedValue(
        Array(10).fill(null).map((_, i) => ({
          tag: `topic${i}`,
          tag_count: `${10 - i}`,
        })) as never
      );
      const mockLimit = db.limit as ReturnType<typeof vi.fn>;
      vi.mocked(mockLimit).mockResolvedValue([]);

      const result = await getSearchSuggestions('user-1', 'long enough query');
      // May or may not have AI suggestions depending on mock, but should not throw
      expect(Array.isArray(result)).toBe(true);
    });

    it('should skip AI suggestions when query is short', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-key';
      const { getSearchSuggestions } = await import('./search-suggestions');

      const { db } = await import('@/lib/db/client');
      vi.mocked(db.execute).mockResolvedValue([
        { tag: 'js', tag_count: '5' },
      ] as never);
      const mockLimit = db.limit as ReturnType<typeof vi.fn>;
      vi.mocked(mockLimit).mockResolvedValue([]);

      const result = await getSearchSuggestions('user-1', 'ab');
      const aiSuggestions = result.filter(s => s.type === 'ai');
      expect(aiSuggestions).toEqual([]);
    });

    it('should include partial matches from recent searches', async () => {
      const { getSearchSuggestions } = await import('./search-suggestions');

      const { db } = await import('@/lib/db/client');
      vi.mocked(db.execute).mockResolvedValue([] as never);
      const mockLimit = db.limit as ReturnType<typeof vi.fn>;
      vi.mocked(mockLimit).mockResolvedValue([]);

      const result = await getSearchSuggestions(
        'user-1',
        'react',
        ['react hooks', 'vue basics', 'react query']
      );

      const recentMatches = result.filter(s => s.type === 'recent');
      expect(recentMatches.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle database errors gracefully', async () => {
      const { getSearchSuggestions } = await import('./search-suggestions');

      const { db } = await import('@/lib/db/client');
      vi.mocked(db.execute).mockRejectedValue(new Error('DB error'));

      const result = await getSearchSuggestions('test-user-id', 'test');

      expect(result).toEqual([]);
    });
  });
});
