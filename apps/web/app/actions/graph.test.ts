import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAuth, mockSelect, mockExecute, mockRateLimit } = vi.hoisted(() => {
  const mockLimit = vi.fn();
  const mockOrderBy = vi.fn(() => ({ limit: mockLimit }));
  const mockWhere = vi.fn(() => ({ orderBy: mockOrderBy }));
  const mockFrom = vi.fn(() => ({ where: mockWhere }));
  const mockSelect = vi.fn(() => ({ from: mockFrom }));
  const mockExecute = vi.fn();
  const mockAuth = vi.fn();
  const mockRateLimit = vi.fn();

  // Expose inner chain fns on mockSelect for easy setup
  Object.assign(mockSelect, { from: mockFrom, where: mockWhere, orderBy: mockOrderBy, limit: mockLimit });

  return { mockAuth, mockSelect, mockExecute, mockRateLimit };
});

vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

vi.mock('@/lib/db/client', () => ({
  db: {
    select: () => mockSelect(),
    execute: (query: unknown) => mockExecute(query),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  content: {
    id: 'id',
    title: 'title',
    type: 'type',
    tags: 'tags',
    userId: 'userId',
    createdAt: 'createdAt',
  },
  embeddings: {},
}));

vi.mock('@/lib/rate-limit', () => ({
  checkServerActionRateLimit: (...args: unknown[]) => mockRateLimit(...args),
  RATE_LIMITS: { serverActionAI: { maxRequests: 10, windowMs: 60000 } },
}));

vi.mock('drizzle-orm', () => ({
  eq: (...args: unknown[]) => args,
  desc: (col: unknown) => col,
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values }),
}));

import { getContentGraphAction } from './graph';

function setupDbChain(items: unknown[]) {
  const mockLimitFn = vi.fn().mockResolvedValue(items);
  const mockOrderByFn = vi.fn(() => ({ limit: mockLimitFn }));
  const mockWhereFn = vi.fn(() => ({ orderBy: mockOrderByFn }));
  const mockFromFn = vi.fn(() => ({ where: mockWhereFn }));
  mockSelect.mockReturnValue({ from: mockFromFn });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
  mockRateLimit.mockReturnValue({ success: true });
  setupDbChain([]);
  mockExecute.mockResolvedValue([]);
});

describe('getContentGraphAction', () => {
  it('returns unauthorized when no session', async () => {
    mockAuth.mockResolvedValue(null);
    const result = await getContentGraphAction();
    expect(result.success).toBe(false);
    expect(result.message).toBe('Unauthorized');
    expect(result.data).toBeUndefined();
  });

  it('returns empty graph when no content', async () => {
    setupDbChain([]);
    const result = await getContentGraphAction();
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ nodes: [], edges: [] });
  });

  it('returns correct nodes and edges', async () => {
    const items = [
      { id: 'c1', title: 'Note One', type: 'note', tags: ['js'] },
      { id: 'c2', title: 'Link Two', type: 'link', tags: ['ts'] },
      { id: 'c3', title: 'File Three', type: 'file', tags: [] },
    ];
    setupDbChain(items);

    const edgeRows = [
      { source: 'c1', target: 'c2', similarity: 0.85 },
      { source: 'c1', target: 'c3', similarity: 0.72 },
    ];
    mockExecute.mockResolvedValue(edgeRows);

    const result = await getContentGraphAction();
    expect(result.success).toBe(true);
    expect(result.data!.edges).toEqual([
      { source: 'c1', target: 'c2', similarity: 0.85 },
      { source: 'c1', target: 'c3', similarity: 0.72 },
    ]);
    expect(result.data!.nodes).toEqual([
      { id: 'c1', title: 'Note One', type: 'note', tags: ['js'] },
      { id: 'c2', title: 'Link Two', type: 'link', tags: ['ts'] },
      { id: 'c3', title: 'File Three', type: 'file', tags: [] },
    ]);
  });

  it('filters nodes to only those in edges', async () => {
    const items = [
      { id: 'c1', title: 'Note One', type: 'note', tags: ['js'] },
      { id: 'c2', title: 'Link Two', type: 'link', tags: [] },
      { id: 'c3', title: 'File Three', type: 'file', tags: ['py'] },
      { id: 'c4', title: 'Orphan Note', type: 'note', tags: [] },
    ];
    setupDbChain(items);

    const edgeRows = [
      { source: 'c1', target: 'c3', similarity: 0.65 },
    ];
    mockExecute.mockResolvedValue(edgeRows);

    const result = await getContentGraphAction();
    expect(result.success).toBe(true);

    const nodeIds = result.data!.nodes.map((n) => n.id);
    expect(nodeIds).toContain('c1');
    expect(nodeIds).toContain('c3');
    expect(nodeIds).not.toContain('c2');
    expect(nodeIds).not.toContain('c4');
    expect(result.data!.nodes).toHaveLength(2);
  });

  it('returns failure on error', async () => {
    setupDbChain([]);
    // Make the select chain throw
    const mockLimitFn = vi.fn().mockRejectedValue(new Error('DB connection failed'));
    const mockOrderByFn = vi.fn(() => ({ limit: mockLimitFn }));
    const mockWhereFn = vi.fn(() => ({ orderBy: mockOrderByFn }));
    const mockFromFn = vi.fn(() => ({ where: mockWhereFn }));
    mockSelect.mockReturnValue({ from: mockFromFn });

    const result = await getContentGraphAction();
    expect(result.success).toBe(false);
    expect(result.message).toBe('Failed to load graph data');
    expect(result.data).toBeUndefined();
  });
});
