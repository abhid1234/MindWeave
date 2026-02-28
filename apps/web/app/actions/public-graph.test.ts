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

// Mock graphology and its algorithms
vi.mock('graphology', () => {
  class MockGraph {
    _nodes = new Map<string, Record<string, unknown>>();
    _edges: Array<{ source: string; target: string; attrs: Record<string, unknown> }> = [];

    addNode(id: string, attrs: Record<string, unknown>) { this._nodes.set(id, attrs); }
    hasNode(id: string) { return this._nodes.has(id); }
    addEdge(source: string, target: string, attrs: Record<string, unknown>) {
      this._edges.push({ source, target, attrs });
    }
    nodes() { return Array.from(this._nodes.keys()); }
    get order() { return this._nodes.size; }
    get size() { return this._edges.length; }
  }
  return { default: MockGraph };
});

vi.mock('graphology-communities-louvain', () => ({
  default: vi.fn().mockImplementation(function () {
    return { c1: 0, c2: 1, c3: 0 };
  }),
}));

vi.mock('graphology-metrics/centrality/pagerank', () => ({
  default: vi.fn().mockImplementation(function () {
    return { c1: 0.4, c2: 0.35, c3: 0.25 };
  }),
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

    it('should include stats in graphData', async () => {
      mockWhere.mockResolvedValue([
        { id: 'c1', title: 'Note 1', type: 'note', tags: ['react', 'js'], autoTags: ['frontend'] },
        { id: 'c2', title: 'Link 1', type: 'link', tags: ['react'], autoTags: [] },
        { id: 'c3', title: 'Note 2', type: 'note', tags: ['python'], autoTags: ['backend'] },
      ]);
      mockExecute.mockResolvedValue([
        { source: 'c1', target: 'c2', weight: '0.5' },
        { source: 'c1', target: 'c3', weight: '0.35' },
      ]);

      const { generatePublicGraphAction } = await import('./public-graph');
      const result = await generatePublicGraphAction('Stats Graph', 'Test stats');

      expect(result.success).toBe(true);

      const savedData = mockValues.mock.calls[0][0];
      const graphData = savedData.graphData;

      expect(graphData.stats).toBeDefined();
      expect(graphData.stats.nodeCount).toBe(3);
      expect(graphData.stats.edgeCount).toBe(2);
      expect(graphData.stats.communityCount).toBeGreaterThan(0);
      expect(graphData.stats.topTags).toBeInstanceOf(Array);
      expect(graphData.stats.topTags.length).toBeGreaterThan(0);
      // 'react' appears twice, should be first
      expect(graphData.stats.topTags[0]).toBe('react');
    });

    it('should include community and pageRank on nodes', async () => {
      mockWhere.mockResolvedValue([
        { id: 'c1', title: 'Note 1', type: 'note', tags: ['tag1'], autoTags: [] },
        { id: 'c2', title: 'Link 1', type: 'link', tags: ['tag2'], autoTags: [] },
      ]);
      mockExecute.mockResolvedValue([
        { source: 'c1', target: 'c2', weight: '0.45' },
      ]);

      const { generatePublicGraphAction } = await import('./public-graph');
      const result = await generatePublicGraphAction('Enriched Graph', '');

      expect(result.success).toBe(true);

      const savedData = mockValues.mock.calls[0][0];
      const nodes = savedData.graphData.nodes;

      for (const node of nodes) {
        expect(node).toHaveProperty('community');
        expect(typeof node.community).toBe('number');
        expect(node).toHaveProperty('pageRank');
        expect(typeof node.pageRank).toBe('number');
      }
    });

    it('should persist settings when provided', async () => {
      mockWhere.mockResolvedValue([
        { id: 'c1', title: 'Note 1', type: 'note', tags: [], autoTags: [] },
      ]);
      mockExecute.mockResolvedValue([]);

      const settings = { showLabels: false, colorBy: 'type' as const };

      const { generatePublicGraphAction } = await import('./public-graph');
      const result = await generatePublicGraphAction('Settings Graph', '', settings);

      expect(result.success).toBe(true);

      const savedData = mockValues.mock.calls[0][0];
      expect(savedData.settings).toEqual(settings);
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

    it('should return settings when present', async () => {
      mockFindFirst.mockResolvedValue({
        graphId: 'abc123',
        title: 'Graph with Settings',
        description: null,
        graphData: {
          nodes: [{ id: 'n1', title: 'Node', type: 'note', tags: [], community: 0, pageRank: 0.5 }],
          edges: [],
          stats: { nodeCount: 1, edgeCount: 0, communityCount: 1, topTags: [] },
        },
        settings: { showLabels: true, colorBy: 'community' },
        createdAt: new Date('2026-02-28'),
      });

      const { getPublicGraphAction } = await import('./public-graph');
      const result = await getPublicGraphAction('abc123');
      expect(result.success).toBe(true);
      expect(result.data!.settings).toEqual({ showLabels: true, colorBy: 'community' });
      expect(result.data!.graphData.stats).toBeDefined();
      expect(result.data!.graphData.stats!.nodeCount).toBe(1);
    });
  });
});
