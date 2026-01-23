import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted for mock functions
const { mockAuth, mockSearchSimilarContent, mockGetRecommendations, mockAnswerQuestion } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockSearchSimilarContent: vi.fn(),
  mockGetRecommendations: vi.fn(),
  mockAnswerQuestion: vi.fn(),
}));

// Mock the auth module
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

// Mock the embeddings module
vi.mock('@/lib/ai/embeddings', () => ({
  searchSimilarContent: (...args: any[]) => mockSearchSimilarContent(...args),
  getRecommendations: (...args: any[]) => mockGetRecommendations(...args),
}));

// Mock the claude module
vi.mock('@/lib/ai/claude', () => ({
  answerQuestion: (...args: any[]) => mockAnswerQuestion(...args),
}));

// Import after mocks are set up
import { semanticSearchAction, getRecommendationsAction, askQuestionAction } from './search';

describe('Semantic Search Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: authenticated user
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('semanticSearchAction', () => {
    it('should return results on successful search', async () => {
      const mockResults = [
        {
          id: 'content-1',
          title: 'Test Note',
          body: 'Test body',
          type: 'note',
          tags: ['test'],
          autoTags: [],
          url: null,
          createdAt: new Date(),
          similarity: 0.95,
        },
        {
          id: 'content-2',
          title: 'Another Note',
          body: 'Another body',
          type: 'note',
          tags: [],
          autoTags: ['auto'],
          url: null,
          createdAt: new Date(),
          similarity: 0.85,
        },
      ];
      mockSearchSimilarContent.mockResolvedValueOnce(mockResults);

      const result = await semanticSearchAction('test query', 10);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.results[0].similarity).toBe(0.95);
      expect(mockSearchSimilarContent).toHaveBeenCalledWith('test query', 'user-123', 10);
    });

    it('should return error when not authenticated', async () => {
      mockAuth.mockResolvedValueOnce(null);

      const result = await semanticSearchAction('test query');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unauthorized');
      expect(result.results).toEqual([]);
      expect(mockSearchSimilarContent).not.toHaveBeenCalled();
    });

    it('should return error for empty query', async () => {
      const result = await semanticSearchAction('');

      expect(result.success).toBe(false);
      expect(result.message).toContain('enter a search query');
      expect(result.results).toEqual([]);
    });

    it('should return error for whitespace-only query', async () => {
      const result = await semanticSearchAction('   ');

      expect(result.success).toBe(false);
      expect(result.message).toContain('enter a search query');
      expect(result.results).toEqual([]);
    });

    it('should return error for query that is too long', async () => {
      const longQuery = 'a'.repeat(1001);
      const result = await semanticSearchAction(longQuery);

      expect(result.success).toBe(false);
      expect(result.message).toContain('too long');
      expect(result.results).toEqual([]);
    });

    it('should trim the query before searching', async () => {
      mockSearchSimilarContent.mockResolvedValueOnce([]);

      await semanticSearchAction('  test query  ', 10);

      expect(mockSearchSimilarContent).toHaveBeenCalledWith('test query', 'user-123', 10);
    });

    it('should use default limit of 10', async () => {
      mockSearchSimilarContent.mockResolvedValueOnce([]);

      await semanticSearchAction('test query');

      expect(mockSearchSimilarContent).toHaveBeenCalledWith('test query', 'user-123', 10);
    });

    it('should cap limit at 50', async () => {
      mockSearchSimilarContent.mockResolvedValueOnce([]);

      await semanticSearchAction('test query', 100);

      expect(mockSearchSimilarContent).toHaveBeenCalledWith('test query', 'user-123', 50);
    });

    it('should ensure minimum limit of 1', async () => {
      mockSearchSimilarContent.mockResolvedValueOnce([]);

      await semanticSearchAction('test query', -5);

      expect(mockSearchSimilarContent).toHaveBeenCalledWith('test query', 'user-123', 1);
    });

    it('should handle search errors gracefully', async () => {
      mockSearchSimilarContent.mockRejectedValueOnce(new Error('Database error'));

      const result = await semanticSearchAction('test query');

      expect(result.success).toBe(false);
      expect(result.message).toContain('failed');
      expect(result.results).toEqual([]);
    });

    it('should return empty results when no matches found', async () => {
      mockSearchSimilarContent.mockResolvedValueOnce([]);

      const result = await semanticSearchAction('nonexistent query');

      expect(result.success).toBe(true);
      expect(result.results).toEqual([]);
    });
  });

  describe('getRecommendationsAction', () => {
    it('should return recommendations on success', async () => {
      const mockRecommendations = [
        { id: 'content-2', title: 'Related Note 1', similarity: 0.9 },
        { id: 'content-3', title: 'Related Note 2', similarity: 0.8 },
      ];
      mockGetRecommendations.mockResolvedValueOnce(mockRecommendations);

      const result = await getRecommendationsAction('content-1', 5);

      expect(result.success).toBe(true);
      expect(result.recommendations).toHaveLength(2);
      expect(result.recommendations[0].similarity).toBe(0.9);
      expect(mockGetRecommendations).toHaveBeenCalledWith('content-1', 5);
    });

    it('should return error when not authenticated', async () => {
      mockAuth.mockResolvedValueOnce(null);

      const result = await getRecommendationsAction('content-1');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unauthorized');
      expect(result.recommendations).toEqual([]);
      expect(mockGetRecommendations).not.toHaveBeenCalled();
    });

    it('should return error for invalid content ID', async () => {
      const result = await getRecommendationsAction('');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid content ID');
      expect(result.recommendations).toEqual([]);
    });

    it('should use default limit of 5', async () => {
      mockGetRecommendations.mockResolvedValueOnce([]);

      await getRecommendationsAction('content-1');

      expect(mockGetRecommendations).toHaveBeenCalledWith('content-1', 5);
    });

    it('should cap limit at 20', async () => {
      mockGetRecommendations.mockResolvedValueOnce([]);

      await getRecommendationsAction('content-1', 50);

      expect(mockGetRecommendations).toHaveBeenCalledWith('content-1', 20);
    });

    it('should ensure minimum limit of 1', async () => {
      mockGetRecommendations.mockResolvedValueOnce([]);

      await getRecommendationsAction('content-1', -5);

      expect(mockGetRecommendations).toHaveBeenCalledWith('content-1', 1);
    });

    it('should handle errors gracefully', async () => {
      mockGetRecommendations.mockRejectedValueOnce(new Error('Database error'));

      const result = await getRecommendationsAction('content-1');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to get recommendations');
      expect(result.recommendations).toEqual([]);
    });

    it('should return empty recommendations when none found', async () => {
      mockGetRecommendations.mockResolvedValueOnce([]);

      const result = await getRecommendationsAction('content-1');

      expect(result.success).toBe(true);
      expect(result.recommendations).toEqual([]);
    });
  });

  describe('askQuestionAction', () => {
    it('should return answer with citations on success', async () => {
      const mockContent = [
        {
          id: 'content-1',
          title: 'React Hooks Guide',
          body: 'useState is a hook for state management',
          type: 'note',
          tags: ['react'],
          autoTags: ['hooks'],
          url: null,
          createdAt: new Date(),
          similarity: 0.95,
        },
        {
          id: 'content-2',
          title: 'TypeScript Tips',
          body: 'Use generics for type safety',
          type: 'note',
          tags: ['typescript'],
          autoTags: [],
          url: null,
          createdAt: new Date(),
          similarity: 0.85,
        },
      ];
      mockSearchSimilarContent.mockResolvedValueOnce(mockContent);
      mockAnswerQuestion.mockResolvedValueOnce('Based on your notes, useState is a React hook for state management [1].');

      const result = await askQuestionAction('What is useState?');

      expect(result.success).toBe(true);
      expect(result.answer).toContain('useState');
      expect(result.citations).toHaveLength(2);
      expect(result.citations?.[0].title).toBe('React Hooks Guide');
      expect(result.citations?.[0].relevance).toBe('95% match');
      expect(result.sourcesUsed).toBe(2);
      expect(mockSearchSimilarContent).toHaveBeenCalledWith('What is useState?', 'user-123', 10);
      expect(mockAnswerQuestion).toHaveBeenCalledWith({
        question: 'What is useState?',
        context: [
          { title: 'React Hooks Guide', body: 'useState is a hook for state management', tags: ['react', 'hooks'] },
          { title: 'TypeScript Tips', body: 'Use generics for type safety', tags: ['typescript'] },
        ],
      });
    });

    it('should return error when not authenticated', async () => {
      mockAuth.mockResolvedValueOnce(null);

      const result = await askQuestionAction('What is useState?');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unauthorized');
      expect(mockSearchSimilarContent).not.toHaveBeenCalled();
    });

    it('should return error for empty question', async () => {
      const result = await askQuestionAction('');

      expect(result.success).toBe(false);
      expect(result.message).toContain('enter a question');
    });

    it('should return error for whitespace-only question', async () => {
      const result = await askQuestionAction('   ');

      expect(result.success).toBe(false);
      expect(result.message).toContain('enter a question');
    });

    it('should return error for question that is too long', async () => {
      const longQuestion = 'a'.repeat(2001);
      const result = await askQuestionAction(longQuestion);

      expect(result.success).toBe(false);
      expect(result.message).toContain('too long');
    });

    it('should trim the question before processing', async () => {
      mockSearchSimilarContent.mockResolvedValueOnce([]);

      await askQuestionAction('  What is React?  ');

      expect(mockSearchSimilarContent).toHaveBeenCalledWith('What is React?', 'user-123', 10);
    });

    it('should return helpful message when no relevant content found', async () => {
      mockSearchSimilarContent.mockResolvedValueOnce([]);

      const result = await askQuestionAction('What is quantum computing?');

      expect(result.success).toBe(true);
      expect(result.answer).toContain("couldn't find any relevant content");
      expect(result.citations).toEqual([]);
      expect(result.sourcesUsed).toBe(0);
      expect(mockAnswerQuestion).not.toHaveBeenCalled();
    });

    it('should handle answerQuestion errors gracefully', async () => {
      mockSearchSimilarContent.mockResolvedValueOnce([
        { id: 'content-1', title: 'Test', body: 'body', type: 'note', tags: [], autoTags: [], similarity: 0.9 },
      ]);
      mockAnswerQuestion.mockRejectedValueOnce(new Error('AI service unavailable'));

      const result = await askQuestionAction('What is this?');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to answer question');
    });

    it('should limit citations to top 5', async () => {
      const mockContent = Array.from({ length: 10 }, (_, i) => ({
        id: `content-${i}`,
        title: `Note ${i}`,
        body: `Body ${i}`,
        type: 'note',
        tags: [],
        autoTags: [],
        url: null,
        createdAt: new Date(),
        similarity: 0.9 - i * 0.05,
      }));
      mockSearchSimilarContent.mockResolvedValueOnce(mockContent);
      mockAnswerQuestion.mockResolvedValueOnce('Here is the answer.');

      const result = await askQuestionAction('Tell me about my notes');

      expect(result.success).toBe(true);
      expect(result.citations).toHaveLength(5);
      expect(result.sourcesUsed).toBe(10);
    });

    it('should handle content with no body', async () => {
      mockSearchSimilarContent.mockResolvedValueOnce([
        { id: 'content-1', title: 'Bookmark', body: null, type: 'link', tags: ['web'], autoTags: [], url: 'https://example.com', similarity: 0.9 },
      ]);
      mockAnswerQuestion.mockResolvedValueOnce('Based on your bookmark...');

      const result = await askQuestionAction('What bookmarks do I have?');

      expect(result.success).toBe(true);
      expect(mockAnswerQuestion).toHaveBeenCalledWith({
        question: 'What bookmarks do I have?',
        context: [{ title: 'Bookmark', body: undefined, tags: ['web'] }],
      });
    });
  });
});
