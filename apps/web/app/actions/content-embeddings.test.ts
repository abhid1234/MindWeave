import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted for mock functions
const {
  mockAuth,
  mockInsert,
  mockSelectResult,
  mockUpdate,
  mockUpsertContentEmbedding,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockInsert: vi.fn(),
  mockSelectResult: vi.fn(),
  mockUpdate: vi.fn(),
  mockUpsertContentEmbedding: vi.fn(),
}));

// Mock the auth module
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn) => fn),
}));

// Mock @/lib/cache
vi.mock('@/lib/cache', () => ({
  createCachedFn: vi.fn((fn) => fn),
  CacheTags: {
    ANALYTICS: 'analytics',
    CONTENT: 'content',
    COLLECTIONS: 'collections',
    USER: 'user',
  },
  CacheDuration: {
    SHORT: 30,
    MEDIUM: 60,
    LONG: 300,
    EXTRA_LONG: 600,
    INFINITE: false,
  },
}));

// Mock the database client
vi.mock('@/lib/db/client', () => ({
  db: {
    insert: () => ({
      values: (data: any) => {
        mockInsert(data);
        return {
          returning: () => Promise.resolve([{ id: 'new-content-id' }]),
        };
      },
    }),
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => mockSelectResult(),
        }),
      }),
    }),
    update: () => ({
      set: (data: any) => ({
        where: () => {
          mockUpdate(data);
          return Promise.resolve();
        },
      }),
    }),
  },
}));

// Mock Claude AI (auto-tagging)
vi.mock('@/lib/ai/claude', () => ({
  generateTags: vi.fn().mockResolvedValue(['auto-tag-1', 'auto-tag-2']),
}));

// Mock summarization module (AI SDK not available in test environment)
vi.mock('@/lib/ai/summarization', () => ({
  generateSummary: vi.fn().mockResolvedValue(null),
  regenerateSummary: vi.fn().mockResolvedValue(null),
}));

// Mock the embeddings module - this is what we want to test
vi.mock('@/lib/ai/embeddings', () => ({
  upsertContentEmbedding: (...args: any[]) => mockUpsertContentEmbedding(...args),
}));

// Import after mocks are set up
import { createContentAction, updateContentTagsAction } from './content';

describe('Content Actions - Embedding Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up authenticated user by default
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
    });
    // Set up successful embedding generation
    mockUpsertContentEmbedding.mockResolvedValue(undefined);
    // Default: content exists
    mockSelectResult.mockResolvedValue([{ id: 'existing-content-id' }]);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createContentAction - Embedding Hook', () => {
    it('should call upsertContentEmbedding after content creation', async () => {
      const formData = new FormData();
      formData.set('type', 'note');
      formData.set('title', 'Test Note');
      formData.set('body', 'This is a test note body');
      formData.set('tags', 'test,note');

      const result = await createContentAction(formData);

      expect(result.success).toBe(true);
      expect(mockUpsertContentEmbedding).toHaveBeenCalledTimes(1);
      expect(mockUpsertContentEmbedding).toHaveBeenCalledWith('new-content-id');
    });

    it('should still succeed if embedding generation fails', async () => {
      mockUpsertContentEmbedding.mockRejectedValueOnce(new Error('Embedding failed'));

      const formData = new FormData();
      formData.set('type', 'note');
      formData.set('title', 'Test Note');
      formData.set('body', 'Test body');

      // Content creation should succeed even if embedding fails
      const result = await createContentAction(formData);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('new-content-id');
      expect(mockUpsertContentEmbedding).toHaveBeenCalled();
    });

    it('should call embedding with correct content ID', async () => {
      const formData = new FormData();
      formData.set('type', 'link');
      formData.set('title', 'Test Link');
      formData.set('url', 'https://example.com');

      await createContentAction(formData);

      expect(mockUpsertContentEmbedding).toHaveBeenCalledWith('new-content-id');
    });

    it('should not call embedding if authentication fails', async () => {
      mockAuth.mockResolvedValueOnce(null);

      const formData = new FormData();
      formData.set('type', 'note');
      formData.set('title', 'Test');

      const result = await createContentAction(formData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unauthorized');
      expect(mockUpsertContentEmbedding).not.toHaveBeenCalled();
    });

    it('should not call embedding if validation fails', async () => {
      const formData = new FormData();
      formData.set('type', 'invalid');
      formData.set('title', '');

      const result = await createContentAction(formData);

      expect(result.success).toBe(false);
      expect(mockUpsertContentEmbedding).not.toHaveBeenCalled();
    });
  });

  describe('updateContentTagsAction - Embedding Hook', () => {
    it('should call upsertContentEmbedding after tag update', async () => {
      const params = {
        contentId: 'existing-content-id',
        tags: ['updated-tag-1', 'updated-tag-2'],
      };

      const result = await updateContentTagsAction(params);

      expect(result.success).toBe(true);
      expect(mockUpsertContentEmbedding).toHaveBeenCalledTimes(1);
      expect(mockUpsertContentEmbedding).toHaveBeenCalledWith('existing-content-id');
    });

    it('should still succeed if embedding refresh fails', async () => {
      mockUpsertContentEmbedding.mockRejectedValueOnce(new Error('Embedding failed'));

      const params = {
        contentId: 'existing-content-id',
        tags: ['tag1', 'tag2'],
      };

      // Tag update should succeed even if embedding fails
      const result = await updateContentTagsAction(params);

      expect(result.success).toBe(true);
      expect(mockUpsertContentEmbedding).toHaveBeenCalled();
    });

    it('should not call embedding if content not found', async () => {
      // Return empty array to simulate content not found
      mockSelectResult.mockResolvedValueOnce([]);

      const params = {
        contentId: 'nonexistent-id',
        tags: ['tag1'],
      };

      const result = await updateContentTagsAction(params);

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
      expect(mockUpsertContentEmbedding).not.toHaveBeenCalled();
    });

    it('should not call embedding if not authenticated', async () => {
      mockAuth.mockResolvedValueOnce(null);

      const params = {
        contentId: 'content-id',
        tags: ['tag1'],
      };

      const result = await updateContentTagsAction(params);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unauthorized');
      expect(mockUpsertContentEmbedding).not.toHaveBeenCalled();
    });

    it('should not call embedding with invalid content ID', async () => {
      const params = {
        contentId: '',
        tags: ['tag1'],
      };

      const result = await updateContentTagsAction(params);

      expect(result.success).toBe(false);
      expect(mockUpsertContentEmbedding).not.toHaveBeenCalled();
    });

    it('should call embedding with the correct content ID', async () => {
      const testContentId = 'specific-content-id-456';
      mockSelectResult.mockResolvedValueOnce([{ id: testContentId }]);

      const params = {
        contentId: testContentId,
        tags: ['new-tag'],
      };

      await updateContentTagsAction(params);

      expect(mockUpsertContentEmbedding).toHaveBeenCalledWith(testContentId);
    });
  });

  describe('Non-blocking Behavior', () => {
    it('should not wait for embedding generation to complete', async () => {
      // Simulate a slow embedding generation
      mockUpsertContentEmbedding.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      const formData = new FormData();
      formData.set('type', 'note');
      formData.set('title', 'Test Note');
      formData.set('body', 'Test');

      const result = await createContentAction(formData);

      // Content creation should complete before embedding finishes
      expect(result.success).toBe(true);
      // Embedding was called but may not be complete yet
      expect(mockUpsertContentEmbedding).toHaveBeenCalled();
    });

    it('should log error when embedding fails but not throw', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockUpsertContentEmbedding.mockRejectedValueOnce(new Error('API limit exceeded'));

      const formData = new FormData();
      formData.set('type', 'note');
      formData.set('title', 'Test Note');

      const result = await createContentAction(formData);

      expect(result.success).toBe(true);

      // Wait for the async error handler to execute
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Error should be logged
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
