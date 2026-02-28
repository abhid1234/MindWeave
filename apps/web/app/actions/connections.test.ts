import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock auth
const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

// Mock rate limit
const mockCheckServerActionRateLimit = vi.fn();
vi.mock('@/lib/rate-limit', () => ({
  checkServerActionRateLimit: (...args: unknown[]) => mockCheckServerActionRateLimit(...args),
  RATE_LIMITS: {
    connectionGeneration: { maxRequests: 10, windowMs: 3600000 },
  },
}));

// Mock AI
const mockGenerateConnectionInsight = vi.fn();
vi.mock('@/lib/ai/gemini', () => ({
  generateConnectionInsight: (...args: unknown[]) => mockGenerateConnectionInsight(...args),
}));

// Mock DB
const mockExecute = vi.fn();
const mockFindMany = vi.fn();
const mockFindFirst = vi.fn();
const mockInsert = vi.fn();
const mockValues = vi.fn();
const mockReturning = vi.fn();

vi.mock('@/lib/db/client', () => ({
  db: {
    execute: (...args: unknown[]) => mockExecute(...args),
    insert: (...args: unknown[]) => {
      mockInsert(...args);
      return {
        values: (...vArgs: unknown[]) => {
          mockValues(...vArgs);
          return { returning: mockReturning };
        },
      };
    },
    query: {
      connections: {
        findMany: (...args: unknown[]) => mockFindMany(...args),
      },
      content: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
      },
    },
  },
}));

vi.mock('@/lib/db/schema', () => ({
  content: { userId: 'userId', id: 'id', tags: 'tags', autoTags: 'auto_tags' },
  embeddings: { contentId: 'contentId', embedding: 'embedding' },
  connections: {},
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: unknown[]) => args),
  sql: vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values })),
}));

describe('Connections Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockCheckServerActionRateLimit.mockReturnValue({ success: true });
    mockGenerateConnectionInsight.mockResolvedValue('An unexpected connection between AI and cooking.');
  });

  describe('getConnectionsAction', () => {
    it('should return unauthorized if not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const { getConnectionsAction } = await import('./connections');
      const result = await getConnectionsAction();
      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
    });

    it('should check rate limit', async () => {
      mockCheckServerActionRateLimit.mockReturnValue({
        success: false,
        message: 'Rate limit exceeded.',
      });

      const { getConnectionsAction } = await import('./connections');
      const result = await getConnectionsAction();
      expect(result.success).toBe(false);
      expect(result.message).toContain('Rate limit');
    });

    it('should return cached connections if available', async () => {
      const cached = [
        {
          id: 'conn-1',
          contentIdA: 'c1',
          contentIdB: 'c2',
          insight: 'Cached insight',
          similarity: 45,
          tagGroupA: ['ai'],
          tagGroupB: ['cooking'],
          createdAt: new Date(),
        },
        {
          id: 'conn-2',
          contentIdA: 'c3',
          contentIdB: 'c4',
          insight: 'Another cached insight',
          similarity: 38,
          tagGroupA: ['music'],
          tagGroupB: ['math'],
          createdAt: new Date(),
        },
        {
          id: 'conn-3',
          contentIdA: 'c5',
          contentIdB: 'c6',
          insight: 'Third cached insight',
          similarity: 52,
          tagGroupA: ['art'],
          tagGroupB: ['science'],
          createdAt: new Date(),
        },
        {
          id: 'conn-4',
          contentIdA: 'c7',
          contentIdB: 'c8',
          insight: 'Fourth cached insight',
          similarity: 41,
          tagGroupA: ['design'],
          tagGroupB: ['engineering'],
          createdAt: new Date(),
        },
        {
          id: 'conn-5',
          contentIdA: 'c9',
          contentIdB: 'c10',
          insight: 'Fifth cached insight',
          similarity: 55,
          tagGroupA: ['writing'],
          tagGroupB: ['coding'],
          createdAt: new Date(),
        },
      ];
      mockFindMany.mockResolvedValue(cached);
      mockFindFirst
        .mockResolvedValueOnce({ id: 'c1', title: 'AI Basics', type: 'note', tags: ['ai'], autoTags: [] })
        .mockResolvedValueOnce({ id: 'c2', title: 'Cooking Tips', type: 'link', tags: ['cooking'], autoTags: [] })
        .mockResolvedValueOnce({ id: 'c3', title: 'Music Theory', type: 'note', tags: ['music'], autoTags: [] })
        .mockResolvedValueOnce({ id: 'c4', title: 'Math Basics', type: 'note', tags: ['math'], autoTags: [] })
        .mockResolvedValueOnce({ id: 'c5', title: 'Art History', type: 'note', tags: ['art'], autoTags: [] })
        .mockResolvedValueOnce({ id: 'c6', title: 'Science News', type: 'link', tags: ['science'], autoTags: [] })
        .mockResolvedValueOnce({ id: 'c7', title: 'Design Patterns', type: 'note', tags: ['design'], autoTags: [] })
        .mockResolvedValueOnce({ id: 'c8', title: 'Engineering 101', type: 'note', tags: ['engineering'], autoTags: [] })
        .mockResolvedValueOnce({ id: 'c9', title: 'Writing Guide', type: 'note', tags: ['writing'], autoTags: [] })
        .mockResolvedValueOnce({ id: 'c10', title: 'Coding Tips', type: 'link', tags: ['coding'], autoTags: [] });

      const { getConnectionsAction } = await import('./connections');
      const result = await getConnectionsAction(5);
      expect(result.success).toBe(true);
      expect(result.data!.length).toBeLessThanOrEqual(5);
      // Should not call AI when using cache
      expect(mockGenerateConnectionInsight).not.toHaveBeenCalled();
    });

    it('should generate new connections when cache is empty', async () => {
      mockFindMany.mockResolvedValue([]);
      mockExecute.mockResolvedValue([
        {
          id_a: 'c1', title_a: 'AI Basics', type_a: 'note', tags_a: ['ai'], body_a: 'About AI',
          id_b: 'c2', title_b: 'Cooking Tips', type_b: 'link', tags_b: ['cooking'], body_b: null,
          similarity: '0.45',
        },
      ]);
      mockReturning.mockResolvedValue([{ id: 'new-conn-1' }]);

      const { getConnectionsAction } = await import('./connections');
      const result = await getConnectionsAction(5);
      expect(result.success).toBe(true);
      expect(mockGenerateConnectionInsight).toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should return empty array when no pairs found', async () => {
      mockFindMany.mockResolvedValue([]);
      mockExecute.mockResolvedValue([]);

      const { getConnectionsAction } = await import('./connections');
      const result = await getConnectionsAction();
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      mockFindMany.mockRejectedValue(new Error('DB error'));

      const { getConnectionsAction } = await import('./connections');
      const result = await getConnectionsAction();
      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed');
    });
  });
});
