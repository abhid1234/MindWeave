import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getFullGraph, getNodeNeighborhood, getShortestPath, getTagClusters } from './queries';

const { mockWithNeo4jSession } = vi.hoisted(() => ({
  mockWithNeo4jSession: vi.fn(),
}));

vi.mock('@/lib/neo4j/client', () => ({
  withNeo4jSession: mockWithNeo4jSession,
}));

describe('Neo4j queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // getFullGraph
  // ---------------------------------------------------------------------------

  describe('getFullGraph', () => {
    it('returns null when Neo4j is unavailable', async () => {
      mockWithNeo4jSession.mockResolvedValue(null);

      const result = await getFullGraph('user-1');

      expect(result).toBeNull();
      expect(mockWithNeo4jSession).toHaveBeenCalledOnce();
    });

    it('returns nodes and edges on success', async () => {
      const mockSession = {
        run: vi
          .fn()
          // First call: edge query
          .mockResolvedValueOnce({
            records: [
              {
                get: (key: string) => {
                  const data: Record<string, unknown> = {
                    source: 'id1',
                    target: 'id2',
                    similarity: 0.85,
                  };
                  return data[key];
                },
              },
            ],
          })
          // Second call: node query
          .mockResolvedValueOnce({
            records: [
              {
                get: (key: string) => {
                  const data: Record<string, unknown> = {
                    id: 'id1',
                    title: 'Note 1',
                    type: 'note',
                    tags: ['ai'],
                  };
                  return data[key];
                },
              },
              {
                get: (key: string) => {
                  const data: Record<string, unknown> = {
                    id: 'id2',
                    title: 'Note 2',
                    type: 'link',
                    tags: ['web'],
                  };
                  return data[key];
                },
              },
            ],
          }),
      };

      mockWithNeo4jSession.mockImplementation(async (fn: (s: typeof mockSession) => Promise<unknown>) =>
        fn(mockSession)
      );

      const result = await getFullGraph('user-1');

      expect(result).toEqual({
        nodes: [
          { id: 'id1', title: 'Note 1', type: 'note', tags: ['ai'] },
          { id: 'id2', title: 'Note 2', type: 'link', tags: ['web'] },
        ],
        edges: [{ source: 'id1', target: 'id2', similarity: 0.85 }],
      });
      expect(mockSession.run).toHaveBeenCalledTimes(2);
    });

    it('returns empty nodes and edges when no edges match', async () => {
      const mockSession = {
        run: vi.fn().mockResolvedValueOnce({ records: [] }),
      };

      mockWithNeo4jSession.mockImplementation(async (fn: (s: typeof mockSession) => Promise<unknown>) =>
        fn(mockSession)
      );

      const result = await getFullGraph('user-1', 0.99);

      expect(result).toEqual({ nodes: [], edges: [] });
      // Only the edge query should run; node query is skipped when there are no edges
      expect(mockSession.run).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // getNodeNeighborhood
  // ---------------------------------------------------------------------------

  describe('getNodeNeighborhood', () => {
    it('returns null when Neo4j is unavailable', async () => {
      mockWithNeo4jSession.mockResolvedValue(null);

      const result = await getNodeNeighborhood('node-1', 'user-1');

      expect(result).toBeNull();
      expect(mockWithNeo4jSession).toHaveBeenCalledOnce();
    });

    it('returns neighborhood data', async () => {
      const mockSession = {
        run: vi
          .fn()
          // First call: neighborhood edges
          .mockResolvedValueOnce({
            records: [
              {
                get: (key: string) => {
                  const data: Record<string, unknown> = {
                    source: 'node-1',
                    target: 'node-2',
                    similarity: 0.72,
                  };
                  return data[key];
                },
              },
            ],
          })
          // Second call: node details
          .mockResolvedValueOnce({
            records: [
              {
                get: (key: string) => {
                  const data: Record<string, unknown> = {
                    id: 'node-1',
                    title: 'Center',
                    type: 'note',
                    tags: ['core'],
                  };
                  return data[key];
                },
              },
              {
                get: (key: string) => {
                  const data: Record<string, unknown> = {
                    id: 'node-2',
                    title: 'Neighbor',
                    type: 'link',
                    tags: [],
                  };
                  return data[key];
                },
              },
            ],
          }),
      };

      mockWithNeo4jSession.mockImplementation(async (fn: (s: typeof mockSession) => Promise<unknown>) =>
        fn(mockSession)
      );

      const result = await getNodeNeighborhood('node-1', 'user-1', 2);

      expect(result).toEqual({
        nodes: [
          { id: 'node-1', title: 'Center', type: 'note', tags: ['core'] },
          { id: 'node-2', title: 'Neighbor', type: 'link', tags: [] },
        ],
        edges: [{ source: 'node-1', target: 'node-2', similarity: 0.72 }],
      });
      expect(mockSession.run).toHaveBeenCalledTimes(2);
    });
  });

  // ---------------------------------------------------------------------------
  // getShortestPath
  // ---------------------------------------------------------------------------

  describe('getShortestPath', () => {
    it('returns null when Neo4j is unavailable', async () => {
      mockWithNeo4jSession.mockResolvedValue(null);

      const result = await getShortestPath('src-1', 'tgt-1', 'user-1');

      expect(result).toBeNull();
      expect(mockWithNeo4jSession).toHaveBeenCalledOnce();
    });

    it('returns path data', async () => {
      const mockSession = {
        run: vi
          .fn()
          // First call: shortest path query
          .mockResolvedValueOnce({
            records: [
              {
                get: (key: string) => {
                  const data: Record<string, unknown> = {
                    source: 'a',
                    target: 'b',
                    similarity: 0.9,
                    nodeIds: ['a', 'b'],
                  };
                  return data[key];
                },
              },
            ],
          })
          // Second call: node details
          .mockResolvedValueOnce({
            records: [
              {
                get: (key: string) => {
                  const data: Record<string, unknown> = {
                    id: 'a',
                    title: 'Start',
                    type: 'note',
                    tags: ['start'],
                  };
                  return data[key];
                },
              },
              {
                get: (key: string) => {
                  const data: Record<string, unknown> = {
                    id: 'b',
                    title: 'End',
                    type: 'file',
                    tags: ['end'],
                  };
                  return data[key];
                },
              },
            ],
          }),
      };

      mockWithNeo4jSession.mockImplementation(async (fn: (s: typeof mockSession) => Promise<unknown>) =>
        fn(mockSession)
      );

      const result = await getShortestPath('a', 'b', 'user-1');

      expect(result).toEqual({
        nodes: [
          { id: 'a', title: 'Start', type: 'note', tags: ['start'] },
          { id: 'b', title: 'End', type: 'file', tags: ['end'] },
        ],
        edges: [{ source: 'a', target: 'b', similarity: 0.9 }],
      });
      expect(mockSession.run).toHaveBeenCalledTimes(2);
    });
  });

  // ---------------------------------------------------------------------------
  // getTagClusters
  // ---------------------------------------------------------------------------

  describe('getTagClusters', () => {
    it('returns clusters', async () => {
      const mockSession = {
        run: vi.fn().mockResolvedValueOnce({
          records: [
            {
              get: (key: string) => {
                const data: Record<string, unknown> = {
                  tag: 'typescript',
                  contentIds: ['c1', 'c2', 'c3'],
                  count: { low: 3 },
                };
                return data[key];
              },
            },
            {
              get: (key: string) => {
                const data: Record<string, unknown> = {
                  tag: 'react',
                  contentIds: ['c2', 'c4'],
                  count: { low: 2 },
                };
                return data[key];
              },
            },
          ],
        }),
      };

      mockWithNeo4jSession.mockImplementation(async (fn: (s: typeof mockSession) => Promise<unknown>) =>
        fn(mockSession)
      );

      const result = await getTagClusters('user-1');

      expect(result).toEqual([
        { tag: 'typescript', contentIds: ['c1', 'c2', 'c3'], count: 3 },
        { tag: 'react', contentIds: ['c2', 'c4'], count: 2 },
      ]);
      expect(mockSession.run).toHaveBeenCalledOnce();
    });
  });
});
