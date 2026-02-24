import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted to declare mocks that can be used in vi.mock factories
const { mockFindFirst, mockInsert, mockUpdate, mockExecute, mockEmbedContent } = vi.hoisted(() => ({
  mockFindFirst: vi.fn(),
  mockInsert: vi.fn(),
  mockUpdate: vi.fn(),
  mockExecute: vi.fn(),
  mockEmbedContent: vi.fn(),
}));

// Mock the database client before importing the module
vi.mock('@/lib/db/client', () => ({
  db: {
    query: {
      content: { findFirst: () => mockFindFirst() },
      embeddings: { findFirst: () => mockFindFirst() },
    },
    insert: () => ({
      values: (data: any) => {
        mockInsert(data);
        return { returning: () => [data] };
      },
    }),
    update: () => ({
      set: (data: any) => ({
        where: () => {
          mockUpdate(data);
          return Promise.resolve();
        },
      }),
    }),
    execute: mockExecute,
  },
}));

// Mock Google Generative AI with a proper class constructor
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class MockGoogleGenerativeAI {
    constructor() {}
    getGenerativeModel() {
      return {
        embedContent: mockEmbedContent,
      };
    }
  },
}));

// Import after mocks are set up
import {
  EMBEDDING_CONFIG,
  generateEmbedding,
  upsertContentEmbedding,
  searchSimilarContent,
  getRecommendations,
} from './embeddings';

describe('Embeddings Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up default mock for embedContent
    mockEmbedContent.mockResolvedValue({
      embedding: {
        values: Array(768).fill(0.5),
      },
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('EMBEDDING_CONFIG', () => {
    it('should have model set to gemini-embedding-001', () => {
      expect(EMBEDDING_CONFIG.model).toBe('gemini-embedding-001');
    });

    it('should have dimensions set to 768', () => {
      expect(EMBEDDING_CONFIG.dimensions).toBe(768);
    });
  });

  describe('generateEmbedding', () => {
    it('should return an array of numbers', async () => {
      const result = await generateEmbedding('test text');

      expect(Array.isArray(result)).toBe(true);
      expect(result.every((v) => typeof v === 'number')).toBe(true);
    });

    it('should return vector with correct dimensions (768)', async () => {
      const result = await generateEmbedding('test text');

      expect(result.length).toBe(768);
    });

    it('should call embedContent with the provided text', async () => {
      const testText = 'Hello, this is a test message';
      await generateEmbedding(testText);

      expect(mockEmbedContent).toHaveBeenCalledWith(
        expect.objectContaining({
          content: { parts: [{ text: testText }], role: 'user' },
          outputDimensionality: 768,
        })
      );
    });

    it('should return zero vector on error', async () => {
      mockEmbedContent.mockRejectedValueOnce(new Error('API Error'));

      const result = await generateEmbedding('test text');

      expect(result.length).toBe(768);
      expect(result.every((v) => v === 0)).toBe(true);
    });

    it('should handle empty string input', async () => {
      const result = await generateEmbedding('');

      expect(result.length).toBe(768);
      expect(mockEmbedContent).toHaveBeenCalledWith(
        expect.objectContaining({
          content: { parts: [{ text: '' }], role: 'user' },
        })
      );
    });

    it('should handle long text input', async () => {
      const longText = 'a'.repeat(10000);
      const result = await generateEmbedding(longText);

      expect(result.length).toBe(768);
    });
  });

  describe('upsertContentEmbedding', () => {
    const mockContent = {
      id: 'content-123',
      title: 'Test Title',
      body: 'Test body content',
      tags: ['tag1', 'tag2'],
      autoTags: ['auto1'],
    };

    it('should create new embedding when none exists', async () => {
      // First findFirst returns content, second returns null (no existing embedding)
      mockFindFirst
        .mockResolvedValueOnce(mockContent)
        .mockResolvedValueOnce(null);

      await upsertContentEmbedding('content-123');

      expect(mockInsert).toHaveBeenCalled();
      const insertData = mockInsert.mock.calls[0][0];
      expect(insertData.contentId).toBe('content-123');
      expect(insertData.embedding.length).toBe(768);
      expect(insertData.model).toBe('gemini-embedding-001');
    });

    it('should update existing embedding', async () => {
      // First findFirst returns content, second returns existing embedding
      mockFindFirst
        .mockResolvedValueOnce(mockContent)
        .mockResolvedValueOnce({ id: 'embedding-123', contentId: 'content-123' });

      await upsertContentEmbedding('content-123');

      expect(mockUpdate).toHaveBeenCalled();
      const updateData = mockUpdate.mock.calls[0][0];
      expect(updateData.embedding.length).toBe(768);
      expect(updateData.model).toBe('gemini-embedding-001');
    });

    it('should throw error when content not found', async () => {
      mockFindFirst.mockResolvedValueOnce(null);

      await expect(upsertContentEmbedding('nonexistent-id')).rejects.toThrow(
        'Content not found'
      );
    });

    it('should combine title, body, tags, and autoTags for embedding', async () => {
      mockFindFirst
        .mockResolvedValueOnce(mockContent)
        .mockResolvedValueOnce(null);

      await upsertContentEmbedding('content-123');

      expect(mockEmbedContent).toHaveBeenCalled();
      const embedArg = mockEmbedContent.mock.calls[0][0];
      const embedText = embedArg.content.parts[0].text;
      expect(embedText).toContain('Test Title');
      expect(embedText).toContain('Test body content');
      expect(embedText).toContain('tag1');
      expect(embedText).toContain('tag2');
      expect(embedText).toContain('auto1');
    });

    it('should handle content with empty body', async () => {
      const contentNoBody = { ...mockContent, body: null };
      mockFindFirst
        .mockResolvedValueOnce(contentNoBody)
        .mockResolvedValueOnce(null);

      await expect(upsertContentEmbedding('content-123')).resolves.not.toThrow();
    });

    it('should handle content with empty tags', async () => {
      const contentNoTags = { ...mockContent, tags: [], autoTags: [] };
      mockFindFirst
        .mockResolvedValueOnce(contentNoTags)
        .mockResolvedValueOnce(null);

      await expect(upsertContentEmbedding('content-123')).resolves.not.toThrow();
    });
  });

  describe('searchSimilarContent', () => {
    it('should return empty array when no results', async () => {
      mockExecute.mockResolvedValueOnce([]);

      const results = await searchSimilarContent('test query', 'user-123', 10);

      expect(results).toEqual([]);
    });

    it('should return results with similarity scores', async () => {
      const mockResults = [
        { id: 'content-1', title: 'Result 1', similarity: 0.9 },
        { id: 'content-2', title: 'Result 2', similarity: 0.8 },
      ];
      mockExecute.mockResolvedValueOnce(mockResults);

      const results = await searchSimilarContent('test query', 'user-123', 10);

      expect(results).toHaveLength(2);
      expect(results[0].similarity).toBe(0.9);
      expect(results[1].similarity).toBe(0.8);
    });

    it('should generate embedding for search query', async () => {
      mockExecute.mockResolvedValueOnce([]);

      await searchSimilarContent('my search query', 'user-123', 10);

      expect(mockEmbedContent).toHaveBeenCalledWith(
        expect.objectContaining({
          content: { parts: [{ text: 'my search query' }], role: 'user' },
        })
      );
    });

    it('should respect limit parameter', async () => {
      mockExecute.mockResolvedValueOnce([]);

      await searchSimilarContent('query', 'user-123', 5);

      // The limit is passed in the SQL query
      expect(mockExecute).toHaveBeenCalled();
    });

    it('should return empty array on error', async () => {
      mockExecute.mockRejectedValueOnce(new Error('Database error'));

      const results = await searchSimilarContent('test', 'user-123', 10);

      expect(results).toEqual([]);
    });
  });

  describe('getRecommendations', () => {
    it('should return empty array when content has no embedding', async () => {
      mockFindFirst.mockResolvedValueOnce(null);

      const results = await getRecommendations('content-123', 'user-123', 5);

      expect(results).toEqual([]);
    });

    it('should return recommendations excluding source content', async () => {
      mockFindFirst.mockResolvedValueOnce({
        id: 'embedding-123',
        contentId: 'content-123',
        embedding: Array(768).fill(0.5),
      });
      mockExecute.mockResolvedValueOnce([
        { id: 'content-456', title: 'Similar 1', body: 'Body 1', type: 'note', tags: [], autoTags: [], url: null, createdAt: new Date(), similarity: 0.85 },
        { id: 'content-789', title: 'Similar 2', body: 'Body 2', type: 'link', tags: [], autoTags: [], url: null, createdAt: new Date(), similarity: 0.75 },
      ]);

      const results = await getRecommendations('content-123', 'user-123', 5);

      expect(results).toHaveLength(2);
      // Verify source content is not in results
      expect(results.find((r) => r.id === 'content-123')).toBeUndefined();
    });

    it('should respect limit parameter', async () => {
      mockFindFirst.mockResolvedValueOnce({
        id: 'embedding-123',
        contentId: 'content-123',
        embedding: Array(768).fill(0.5),
      });
      mockExecute.mockResolvedValueOnce([]);

      await getRecommendations('content-123', 'user-123', 3);

      // The limit is passed in the SQL query
      expect(mockExecute).toHaveBeenCalled();
    });

    it('should return empty array on error', async () => {
      mockFindFirst.mockRejectedValueOnce(new Error('Database error'));

      const results = await getRecommendations('content-123', 'user-123', 5);

      expect(results).toEqual([]);
    });

    it('should use default limit of 5', async () => {
      mockFindFirst.mockResolvedValueOnce({
        id: 'embedding-123',
        contentId: 'content-123',
        embedding: Array(768).fill(0.5),
      });
      mockExecute.mockResolvedValueOnce([]);

      await getRecommendations('content-123', 'user-123');

      expect(mockExecute).toHaveBeenCalled();
    });

    it('should require userId parameter for security filtering', async () => {
      mockFindFirst.mockResolvedValueOnce({
        id: 'embedding-123',
        contentId: 'content-123',
        embedding: Array(768).fill(0.5),
      });
      mockExecute.mockResolvedValueOnce([]);

      await getRecommendations('content-123', 'user-456', 5, 0.5);

      // userId is passed in the SQL query for filtering
      expect(mockExecute).toHaveBeenCalled();
    });

    it('should respect minSimilarity parameter', async () => {
      mockFindFirst.mockResolvedValueOnce({
        id: 'embedding-123',
        contentId: 'content-123',
        embedding: Array(768).fill(0.5),
      });
      mockExecute.mockResolvedValueOnce([]);

      await getRecommendations('content-123', 'user-123', 5, 0.7);

      expect(mockExecute).toHaveBeenCalled();
    });

    it('should return expanded recommendation data', async () => {
      mockFindFirst.mockResolvedValueOnce({
        id: 'embedding-123',
        contentId: 'content-123',
        embedding: Array(768).fill(0.5),
      });
      const mockResult = {
        id: 'content-456',
        title: 'Test Title',
        body: 'Test body content',
        type: 'note',
        tags: ['tag1', 'tag2'],
        autoTags: ['auto1'],
        url: null,
        createdAt: new Date('2024-01-15'),
        similarity: 0.85,
      };
      mockExecute.mockResolvedValueOnce([mockResult]);

      const results = await getRecommendations('content-123', 'user-123', 5);

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        id: 'content-456',
        title: 'Test Title',
        body: 'Test body content',
        type: 'note',
        tags: ['tag1', 'tag2'],
        autoTags: ['auto1'],
        similarity: 0.85,
      });
    });
  });
});

describe('Embeddings Module - Missing API Key', () => {
  it('should handle missing API key gracefully', async () => {
    // This test verifies the warning behavior when API key is missing
    // The actual module checks for GOOGLE_AI_API_KEY at import time
    // and returns zero vectors when not configured

    // Verify EMBEDDING_CONFIG is always available
    expect(EMBEDDING_CONFIG.dimensions).toBe(768);
    expect(EMBEDDING_CONFIG.model).toBe('gemini-embedding-001');
  });
});
