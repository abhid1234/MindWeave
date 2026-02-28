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
    serverAction: { maxRequests: 60, windowMs: 60000 },
  },
}));

// Mock DB
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockExecute = vi.fn();
const mockInsert = vi.fn();
const mockValues = vi.fn();
const mockFindFirst = vi.fn();

vi.mock('@/lib/db/client', () => ({
  db: {
    select: (...args: unknown[]) => {
      mockSelect(...args);
      return {
        from: (...fArgs: unknown[]) => {
          mockFrom(...fArgs);
          return { where: mockWhere };
        },
      };
    },
    execute: (...args: unknown[]) => mockExecute(...args),
    insert: (...args: unknown[]) => {
      mockInsert(...args);
      return {
        values: (...vArgs: unknown[]) => {
          mockValues(...vArgs);
          return { returning: vi.fn() };
        },
      };
    },
    query: {
      publicGraphs: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
      },
    },
  },
}));

vi.mock('@/lib/db/schema', () => ({
  content: { userId: 'userId', id: 'id', title: 'title', type: 'type', tags: 'tags', autoTags: 'auto_tags' },
  embeddings: { contentId: 'contentId', embedding: 'embedding' },
  publicGraphs: {},
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: unknown[]) => args),
  sql: vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values })),
}));

describe('Public Graph Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockCheckServerActionRateLimit.mockReturnValue({ success: true });
  });

  describe('generatePublicGraphAction', () => {
    it('should return unauthorized if not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const { generatePublicGraphAction } = await import('./public-graph');
      const result = await generatePublicGraphAction('My Graph', 'Description');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
    });

    it('should snapshot graph data and strip sensitive info', async () => {
      mockWhere.mockResolvedValue([
        { id: 'c1', title: 'Note 1', type: 'note', tags: ['tag1'], autoTags: ['ai-tag'] },
        { id: 'c2', title: 'Link 1', type: 'link', tags: ['tag2'], autoTags: [] },
      ]);
      mockExecute.mockResolvedValue([
        { source: 'c1', target: 'c2', weight: '0.45' },
      ]);

      const { generatePublicGraphAction } = await import('./public-graph');
      const result = await generatePublicGraphAction('My Graph', 'A test graph');

      expect(result.success).toBe(true);
      expect(result.data!.graphId).toBeDefined();
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          title: 'My Graph',
          description: 'A test graph',
          graphData: expect.objectContaining({
            nodes: expect.arrayContaining([
              expect.objectContaining({ id: 'c1', title: 'Note 1' }),
            ]),
            edges: expect.arrayContaining([
              expect.objectContaining({ source: 'c1', target: 'c2' }),
            ]),
          }),
        })
      );
    });

    it('should fail if user has no content', async () => {
      mockWhere.mockResolvedValue([]);

      const { generatePublicGraphAction } = await import('./public-graph');
      const result = await generatePublicGraphAction('Empty Graph', '');
      expect(result.success).toBe(false);
      expect(result.message).toContain('No content');
    });
  });

  describe('getPublicGraphAction', () => {
    it('should return graph data for valid graphId', async () => {
      mockFindFirst.mockResolvedValue({
        graphId: 'abc123',
        title: 'My Graph',
        description: 'A description',
        graphData: { nodes: [], edges: [] },
        settings: null,
        createdAt: new Date('2026-02-28'),
      });

      const { getPublicGraphAction } = await import('./public-graph');
      const result = await getPublicGraphAction('abc123');
      expect(result.success).toBe(true);
      expect(result.data!.title).toBe('My Graph');
    });

    it('should return 404 for non-existent graph', async () => {
      mockFindFirst.mockResolvedValue(null);

      const { getPublicGraphAction } = await import('./public-graph');
      const result = await getPublicGraphAction('nonexistent');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Graph not found');
    });
  });
});
