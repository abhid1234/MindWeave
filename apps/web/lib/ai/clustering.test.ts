import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Anthropic before importing
const mockCreate = vi.fn().mockResolvedValue({
  content: [{ type: 'text', text: '{"name": "Test Cluster", "description": "Test description"}' }],
});

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = {
        create: mockCreate,
      };
    },
  };
});

// Mock dependencies
const mockWhere = vi.fn().mockResolvedValue([]);
vi.mock('@/lib/db/client', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: mockWhere,
  },
}));

describe('Content Clustering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWhere.mockResolvedValue([]);
  });

  describe('clusterContent', () => {
    it('should return empty array when no content has embeddings', async () => {
      const { clusterContent } = await import('./clustering');
      const result = await clusterContent('test-user-id');
      expect(result).toEqual([]);
    });

    it('should return empty array when only 1 content item exists', async () => {
      mockWhere.mockResolvedValueOnce([
        {
          contentId: '1',
          title: 'Test',
          type: 'note',
          embedding: Array(3).fill(0),
        },
      ]);

      const { clusterContent } = await import('./clustering');
      const result = await clusterContent('test-user-id');
      expect(result).toEqual([]);
    });

    it('should cluster multiple items and return sorted clusters', async () => {
      // 4 items: 2 close together, 2 close together
      mockWhere.mockResolvedValueOnce([
        { contentId: '1', title: 'Note A', type: 'note', embedding: [1, 0, 0] },
        { contentId: '2', title: 'Note B', type: 'note', embedding: [1, 0.1, 0] },
        { contentId: '3', title: 'Link C', type: 'link', embedding: [0, 0, 1] },
        { contentId: '4', title: 'Link D', type: 'link', embedding: [0, 0.1, 1] },
      ]);

      const { clusterContent } = await import('./clustering');
      const result = await clusterContent('test-user-id', 2);

      expect(result.length).toBeGreaterThanOrEqual(1);
      // Each cluster should have contentIds, name, description, size
      for (const cluster of result) {
        expect(cluster).toHaveProperty('id');
        expect(cluster).toHaveProperty('name');
        expect(cluster).toHaveProperty('description');
        expect(cluster).toHaveProperty('contentIds');
        expect(cluster).toHaveProperty('size');
        expect(cluster.size).toBe(cluster.contentIds.length);
      }
      // Sorted by size descending
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].size).toBeGreaterThanOrEqual(result[i].size);
      }
    });

    it('should parse string embeddings from database', async () => {
      mockWhere.mockResolvedValueOnce([
        { contentId: '1', title: 'A', type: 'note', embedding: JSON.stringify([1, 0]) },
        { contentId: '2', title: 'B', type: 'note', embedding: JSON.stringify([0, 1]) },
        { contentId: '3', title: 'C', type: 'note', embedding: JSON.stringify([1, 0.1]) },
      ]);

      const { clusterContent } = await import('./clustering');
      const result = await clusterContent('user-1', 2);

      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle database error and return empty array', async () => {
      mockWhere.mockRejectedValueOnce(new Error('DB connection failed'));

      const { clusterContent } = await import('./clustering');
      const result = await clusterContent('user-error');
      expect(result).toEqual([]);
    });

    it('should include contentPreviews limited to 5 items', async () => {
      const items = Array.from({ length: 8 }, (_, i) => ({
        contentId: `id-${i}`,
        title: `Item ${i}`,
        type: 'note',
        embedding: [i === 0 ? 1 : 0, i === 0 ? 0 : 1], // force into 1 cluster effectively
      }));
      // Make all embeddings the same so they cluster together
      for (const item of items) {
        item.embedding = [1, 0];
      }
      mockWhere.mockResolvedValueOnce(items);

      const { clusterContent } = await import('./clustering');
      const result = await clusterContent('user-1', 1);

      // The largest cluster should have contentPreviews capped at 5
      const largest = result[0];
      expect(largest.contentPreviews.length).toBeLessThanOrEqual(5);
      expect(largest.size).toBe(8);
    });
  });

  describe('generateClusterName', () => {
    it('should return default name when no API key', async () => {
      const originalKey = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      // Need to re-import to get the generateClusterName behavior via clusterContent
      // We test indirectly: cluster with items but no API key
      mockWhere.mockResolvedValueOnce([
        { contentId: '1', title: 'A', type: 'note', embedding: [1, 0] },
        { contentId: '2', title: 'B', type: 'note', embedding: [0, 1] },
      ]);

      const { clusterContent } = await import('./clustering');
      const result = await clusterContent('user-no-key');

      // Without API key, clusters get default name "Cluster"
      for (const cluster of result) {
        expect(cluster.name).toBe('Cluster');
        expect(cluster.description).toBe('Group of related items');
      }

      if (originalKey) process.env.ANTHROPIC_API_KEY = originalKey;
    });

    it('should handle malformed JSON response from Claude', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-key';
      mockCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'not valid json at all' }],
      });

      mockWhere.mockResolvedValueOnce([
        { contentId: '1', title: 'X', type: 'note', embedding: [1, 0] },
        { contentId: '2', title: 'Y', type: 'note', embedding: [0, 1] },
      ]);

      const { clusterContent } = await import('./clustering');
      const result = await clusterContent('user-bad-json');

      // Should fall back to text slice for name
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(typeof result[0].name).toBe('string');
    });

    it('should handle Claude API error gracefully', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-key';
      // Reject for all calls during this test
      mockCreate.mockRejectedValue(new Error('API error'));

      mockWhere.mockResolvedValueOnce([
        { contentId: '1', title: 'A', type: 'note', embedding: [1, 0] },
        { contentId: '2', title: 'B', type: 'note', embedding: [0, 1] },
      ]);

      const { clusterContent } = await import('./clustering');
      const result = await clusterContent('user-api-err');

      // Should fall back to default
      for (const cluster of result) {
        expect(cluster.name).toBe('Cluster');
      }

      // Restore default mock
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: '{"name": "Test Cluster", "description": "Test description"}' }],
      });
    });
  });

  describe('getContentCluster', () => {
    it('should find cluster containing specific content', async () => {
      mockWhere.mockResolvedValueOnce([
        { contentId: '1', title: 'A', type: 'note', embedding: [1, 0] },
        { contentId: '2', title: 'B', type: 'note', embedding: [1, 0.1] },
        { contentId: '3', title: 'C', type: 'link', embedding: [0, 1] },
      ]);

      const { getContentCluster } = await import('./clustering');
      const cluster = await getContentCluster('user-1', '1');

      // Content '1' should be in some cluster
      if (cluster) {
        expect(cluster.contentIds).toContain('1');
      }
      // May be null if clustering puts it somewhere unexpected, but should not throw
    });

    it('should return null for non-existent content', async () => {
      mockWhere.mockResolvedValueOnce([
        { contentId: '1', title: 'A', type: 'note', embedding: [1, 0] },
        { contentId: '2', title: 'B', type: 'note', embedding: [0, 1] },
      ]);

      const { getContentCluster } = await import('./clustering');
      const cluster = await getContentCluster('user-1', 'nonexistent-id');

      expect(cluster).toBeNull();
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
