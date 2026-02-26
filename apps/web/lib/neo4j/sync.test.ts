import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockIsConfigured,
  mockGetSession,
  mockSessionRun,
  mockSessionClose,
  mockFindFirstContent,
  mockFindFirstEmbeddings,
  mockWhere,
  mockFrom,
  mockSelect,
  mockExecute,
} = vi.hoisted(() => {
  const mockWhere = vi.fn().mockResolvedValue([]);
  const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
  const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
  const mockExecute = vi.fn().mockResolvedValue([]);

  return {
    mockIsConfigured: vi.fn().mockReturnValue(false),
    mockGetSession: vi.fn().mockReturnValue(null),
    mockSessionRun: vi.fn().mockResolvedValue({}),
    mockSessionClose: vi.fn().mockResolvedValue(undefined),
    mockFindFirstContent: vi.fn().mockResolvedValue(null),
    mockFindFirstEmbeddings: vi.fn().mockResolvedValue(null),
    mockWhere,
    mockFrom,
    mockSelect,
    mockExecute,
  };
});

vi.mock('@/lib/neo4j/client', () => ({
  isNeo4jConfigured: mockIsConfigured,
  getNeo4jSession: mockGetSession,
}));

vi.mock('@/lib/db/client', () => ({
  db: {
    query: {
      content: { findFirst: mockFindFirstContent },
      embeddings: { findFirst: mockFindFirstEmbeddings },
    },
    select: mockSelect,
    execute: mockExecute,
  },
}));

vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>();
  return {
    ...actual,
    eq: vi.fn((...args: unknown[]) => args),
    sql: vi.fn((...args: unknown[]) => args),
  };
});

import {
  syncContentToNeo4j,
  deleteContentFromNeo4j,
  syncSimilarityEdges,
  fullSyncUserGraph,
} from './sync';

describe('Neo4j Sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsConfigured.mockReturnValue(false);
    mockGetSession.mockReturnValue(null);
    mockSessionRun.mockResolvedValue({});
    mockSessionClose.mockResolvedValue(undefined);
    mockFindFirstContent.mockResolvedValue(null);
    mockFindFirstEmbeddings.mockResolvedValue(null);
    mockWhere.mockResolvedValue([]);
    mockExecute.mockResolvedValue([]);
    mockFrom.mockReturnValue({ where: mockWhere });
    mockSelect.mockReturnValue({ from: mockFrom });
  });

  // ---------- syncContentToNeo4j ----------

  describe('syncContentToNeo4j', () => {
    it('returns early if Neo4j is not configured', async () => {
      await syncContentToNeo4j('content-1');

      expect(mockIsConfigured).toHaveBeenCalled();
      expect(mockFindFirstContent).not.toHaveBeenCalled();
      expect(mockGetSession).not.toHaveBeenCalled();
    });

    it('returns early if content is not found', async () => {
      mockIsConfigured.mockReturnValue(true);
      mockFindFirstContent.mockResolvedValue(null);

      await syncContentToNeo4j('nonexistent-id');

      expect(mockFindFirstContent).toHaveBeenCalled();
      expect(mockGetSession).not.toHaveBeenCalled();
    });

    it('calls session.run with MERGE Cypher when configured', async () => {
      mockIsConfigured.mockReturnValue(true);
      mockGetSession.mockReturnValue({ run: mockSessionRun, close: mockSessionClose });
      mockFindFirstContent.mockResolvedValue({
        id: 'c-1',
        title: 'Test Note',
        type: 'note',
        userId: 'user-1',
        tags: ['javascript'],
        autoTags: ['programming'],
      });

      await syncContentToNeo4j('c-1');

      // First call: MERGE the Content node
      expect(mockSessionRun).toHaveBeenCalledWith(
        expect.stringContaining('MERGE (c:Content {id: $id})'),
        expect.objectContaining({ id: 'c-1', title: 'Test Note', type: 'note', userId: 'user-1' })
      );

      // Second call: remove old TAGGED_WITH edges
      expect(mockSessionRun).toHaveBeenCalledWith(
        expect.stringContaining('TAGGED_WITH'),
        expect.objectContaining({ id: 'c-1' })
      );

      // Third call: create tag nodes and edges (unique tags: javascript, programming)
      expect(mockSessionRun).toHaveBeenCalledWith(
        expect.stringContaining('UNWIND $tags AS tagName'),
        expect.objectContaining({
          tags: expect.arrayContaining(['javascript', 'programming']),
          id: 'c-1',
        })
      );

      expect(mockSessionClose).toHaveBeenCalled();
    });
  });

  // ---------- deleteContentFromNeo4j ----------

  describe('deleteContentFromNeo4j', () => {
    it('returns early if Neo4j is not configured', async () => {
      await deleteContentFromNeo4j('content-1');

      expect(mockIsConfigured).toHaveBeenCalled();
      expect(mockGetSession).not.toHaveBeenCalled();
    });

    it('calls DETACH DELETE when configured', async () => {
      mockIsConfigured.mockReturnValue(true);
      mockGetSession.mockReturnValue({ run: mockSessionRun, close: mockSessionClose });

      await deleteContentFromNeo4j('c-1');

      expect(mockSessionRun).toHaveBeenCalledWith(
        expect.stringContaining('DETACH DELETE'),
        expect.objectContaining({ id: 'c-1' })
      );
      expect(mockSessionClose).toHaveBeenCalled();
    });
  });

  // ---------- syncSimilarityEdges ----------

  describe('syncSimilarityEdges', () => {
    it('returns early if Neo4j is not configured', async () => {
      await syncSimilarityEdges('content-1', 'user-1');

      expect(mockIsConfigured).toHaveBeenCalled();
      expect(mockFindFirstEmbeddings).not.toHaveBeenCalled();
    });

    it('returns early if no embedding is found', async () => {
      mockIsConfigured.mockReturnValue(true);
      mockFindFirstEmbeddings.mockResolvedValue(null);

      await syncSimilarityEdges('content-1', 'user-1');

      expect(mockFindFirstEmbeddings).toHaveBeenCalled();
      expect(mockGetSession).not.toHaveBeenCalled();
    });

    it('creates SIMILAR_TO edges when similar items found', async () => {
      mockIsConfigured.mockReturnValue(true);
      mockGetSession.mockReturnValue({ run: mockSessionRun, close: mockSessionClose });
      mockFindFirstEmbeddings.mockResolvedValue({
        contentId: 'c-1',
        embedding: [0.1, 0.2, 0.3],
      });
      // db.execute returns similar items
      mockExecute.mockResolvedValue([
        { contentId: 'c-2', similarity: 0.85 },
        { contentId: 'c-3', similarity: 0.72 },
      ]);

      await syncSimilarityEdges('c-1', 'user-1');

      // First call: remove old SIMILAR_TO edges
      expect(mockSessionRun).toHaveBeenCalledWith(
        expect.stringContaining('SIMILAR_TO'),
        expect.objectContaining({ id: 'c-1' })
      );

      // Second call: create new SIMILAR_TO edges with scores
      expect(mockSessionRun).toHaveBeenCalledWith(
        expect.stringContaining('UNWIND $edges AS edge'),
        expect.objectContaining({
          sourceId: 'c-1',
          edges: [
            { targetId: 'c-2', score: 0.85 },
            { targetId: 'c-3', score: 0.72 },
          ],
        })
      );

      expect(mockSessionClose).toHaveBeenCalled();
    });
  });

  // ---------- fullSyncUserGraph ----------

  describe('fullSyncUserGraph', () => {
    it('returns zeros when Neo4j is not configured', async () => {
      const result = await fullSyncUserGraph('user-1');

      expect(result).toEqual({ nodesCreated: 0, edgesCreated: 0 });
      expect(mockGetSession).not.toHaveBeenCalled();
    });

    it('creates nodes and edges when configured', async () => {
      mockIsConfigured.mockReturnValue(true);
      mockGetSession.mockReturnValue({ run: mockSessionRun, close: mockSessionClose });

      // db.select().from().where() returns user content
      mockWhere.mockResolvedValue([
        { id: 'c-1', title: 'Note 1', type: 'note', tags: ['typescript'], autoTags: ['dev'] },
        { id: 'c-2', title: 'Link 1', type: 'link', tags: ['react'], autoTags: [] },
      ]);

      // db.execute returns similarity rows
      mockExecute.mockResolvedValue([
        { source: 'c-1', target: 'c-2', similarity: 0.65 },
      ]);

      const result = await fullSyncUserGraph('user-1');

      // Should clear existing graph
      expect(mockSessionRun).toHaveBeenCalledWith(
        expect.stringContaining('DETACH DELETE'),
        expect.objectContaining({ userId: 'user-1' })
      );

      // Should batch create content nodes
      expect(mockSessionRun).toHaveBeenCalledWith(
        expect.stringContaining('CREATE (c:Content'),
        expect.objectContaining({
          userId: 'user-1',
          items: [
            { id: 'c-1', title: 'Note 1', type: 'note' },
            { id: 'c-2', title: 'Link 1', type: 'link' },
          ],
        })
      );

      // Should create tag edges (typescript, dev for c-1; react for c-2 = 3 edges)
      expect(mockSessionRun).toHaveBeenCalledWith(
        expect.stringContaining('TAGGED_WITH'),
        expect.objectContaining({
          edges: expect.arrayContaining([
            { contentId: 'c-1', tag: 'typescript' },
            { contentId: 'c-1', tag: 'dev' },
            { contentId: 'c-2', tag: 'react' },
          ]),
        })
      );

      // Should create similarity edges
      expect(mockSessionRun).toHaveBeenCalledWith(
        expect.stringContaining('SIMILAR_TO'),
        expect.objectContaining({
          edges: [{ source: 'c-1', target: 'c-2', score: 0.65 }],
        })
      );

      // nodesCreated = 2 content items, edgesCreated = 1 similarity + 3 tag = 4
      expect(result).toEqual({ nodesCreated: 2, edgesCreated: 4 });
      expect(mockSessionClose).toHaveBeenCalled();
    });
  });
});
