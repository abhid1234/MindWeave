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

    it('should handle database errors gracefully', async () => {
      const { getSearchSuggestions } = await import('./search-suggestions');

      const { db } = await import('@/lib/db/client');
      vi.mocked(db.execute).mockRejectedValue(new Error('DB error'));

      const result = await getSearchSuggestions('test-user-id', 'test');

      expect(result).toEqual([]);
    });
  });
});
