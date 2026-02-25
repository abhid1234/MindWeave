import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockAuth, mockDbSelect, mockDbInsert, mockDbDelete, mockGenerateLinkedInPost } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDbSelect: vi.fn(),
  mockDbInsert: vi.fn(),
  mockDbDelete: vi.fn(),
  mockGenerateLinkedInPost: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

vi.mock('@/lib/db/client', () => {
  // Each call to select/from/where/orderBy/limit resolves to mockDbSelect()
  // Use mockResolvedValueOnce/mockReturnValueOnce to control per-call returns
  const makeChain = () => {
    const chain: Record<string, unknown> = {};
    chain.from = () => chain;
    chain.where = () => chain;
    chain.orderBy = () => chain;
    chain.limit = () => mockDbSelect();
    chain.then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) =>
      Promise.resolve(mockDbSelect()).then(resolve, reject);
    return chain;
  };

  return {
    db: {
      select: () => makeChain(),
      insert: () => ({
        values: (data: unknown) => ({
          returning: () => mockDbInsert(data),
        }),
      }),
      delete: () => ({
        where: () => mockDbDelete(),
      }),
    },
  };
});

vi.mock('@/lib/db/schema', () => ({
  content: { id: 'id', userId: 'user_id', title: 'title', body: 'body', url: 'url', type: 'type', tags: 'tags', createdAt: 'created_at' },
  generatedPosts: { id: 'id', userId: 'user_id', postContent: 'post_content', tone: 'tone', length: 'length', includeHashtags: 'include_hashtags', sourceContentIds: 'source_content_ids', sourceContentTitles: 'source_content_titles', createdAt: 'created_at' },
}));

vi.mock('@/lib/ai/gemini', () => ({
  generateLinkedInPost: (...args: unknown[]) => mockGenerateLinkedInPost(...args),
}));

import {
  generatePostAction,
  getPostHistoryAction,
  deletePostAction,
  getContentForSelectionAction,
} from './post-generator';

const makeContent = (id: string) => ({
  id,
  title: `Content ${id}`,
  body: 'Body text',
  url: null,
  type: 'note' as const,
  tags: ['test'],
  createdAt: new Date('2025-06-01'),
});

const makeSavedPost = (id: string) => ({
  id,
  userId: 'user-123',
  postContent: 'Generated post text',
  tone: 'professional',
  length: 'medium',
  includeHashtags: true,
  sourceContentIds: ['c1'],
  sourceContentTitles: ['Content c1'],
  createdAt: new Date('2025-06-01'),
});

describe('Post Generator Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('generatePostAction', () => {
    it('should return error when not authenticated', async () => {
      mockAuth.mockResolvedValueOnce(null);

      const result = await generatePostAction({
        contentIds: ['id1'],
        tone: 'professional',
        length: 'medium',
        includeHashtags: true,
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unauthorized');
    });

    it('should return error for invalid input (missing contentIds)', async () => {
      const result = await generatePostAction({
        tone: 'professional',
        length: 'medium',
        includeHashtags: true,
      });

      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('should return error for too many content IDs', async () => {
      const result = await generatePostAction({
        contentIds: ['1', '2', '3', '4', '5', '6'].map(
          (n) => `00000000-0000-0000-0000-00000000000${n}`
        ),
        tone: 'professional',
        length: 'medium',
        includeHashtags: true,
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Maximum 5');
    });

    it('should return error for invalid tone', async () => {
      const result = await generatePostAction({
        contentIds: ['00000000-0000-0000-0000-000000000001'],
        tone: 'angry',
        length: 'medium',
        includeHashtags: true,
      });

      expect(result.success).toBe(false);
    });

    it('should return error when no content found', async () => {
      mockDbSelect.mockResolvedValueOnce([]);

      const result = await generatePostAction({
        contentIds: ['00000000-0000-0000-0000-000000000001'],
        tone: 'professional',
        length: 'medium',
        includeHashtags: true,
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('No content found');
    });

    it('should call AI with correct parameters and save to DB', async () => {
      const contentItem = makeContent('c1');
      mockDbSelect.mockResolvedValueOnce([contentItem]);
      mockGenerateLinkedInPost.mockResolvedValueOnce('Generated LinkedIn post text');
      mockDbInsert.mockReturnValueOnce([makeSavedPost('post-1')]);

      const result = await generatePostAction({
        contentIds: ['00000000-0000-0000-0000-000000000001'],
        tone: 'professional',
        length: 'medium',
        includeHashtags: true,
      });

      expect(result.success).toBe(true);
      expect(result.post).toBeDefined();
      expect(result.post!.postContent).toBe('Generated post text');
      expect(mockGenerateLinkedInPost).toHaveBeenCalledWith(
        expect.objectContaining({
          tone: 'professional',
          length: 'medium',
          includeHashtags: true,
        })
      );
    });

    it('should handle AI error gracefully', async () => {
      const contentItem = makeContent('c1');
      mockDbSelect.mockResolvedValueOnce([contentItem]);
      mockGenerateLinkedInPost.mockRejectedValueOnce(new Error('AI error'));

      const result = await generatePostAction({
        contentIds: ['00000000-0000-0000-0000-000000000001'],
        tone: 'professional',
        length: 'medium',
        includeHashtags: true,
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to generate');
    });
  });

  describe('getPostHistoryAction', () => {
    it('should return error when not authenticated', async () => {
      mockAuth.mockResolvedValueOnce(null);

      const result = await getPostHistoryAction();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unauthorized');
      expect(result.posts).toEqual([]);
    });

    it('should return posts ordered by date', async () => {
      const posts = [makeSavedPost('p1'), makeSavedPost('p2')];
      mockDbSelect.mockResolvedValueOnce(posts);

      const result = await getPostHistoryAction();

      expect(result.success).toBe(true);
      expect(result.posts).toHaveLength(2);
    });

    it('should return empty when no history', async () => {
      mockDbSelect.mockResolvedValueOnce([]);

      const result = await getPostHistoryAction();

      expect(result.success).toBe(true);
      expect(result.posts).toEqual([]);
    });
  });

  describe('deletePostAction', () => {
    it('should return error when not authenticated', async () => {
      mockAuth.mockResolvedValueOnce(null);

      const result = await deletePostAction('post-1');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unauthorized');
    });

    it('should return error when post not found (ownership check)', async () => {
      mockDbSelect.mockResolvedValueOnce([]);

      const result = await deletePostAction('post-1');

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should delete post successfully', async () => {
      mockDbSelect.mockResolvedValueOnce([{ id: 'post-1' }]);
      mockDbDelete.mockResolvedValueOnce(undefined);

      const result = await deletePostAction('post-1');

      expect(result.success).toBe(true);
    });
  });

  describe('getContentForSelectionAction', () => {
    it('should return error when not authenticated', async () => {
      mockAuth.mockResolvedValueOnce(null);

      const result = await getContentForSelectionAction();

      expect(result.success).toBe(false);
      expect(result.items).toEqual([]);
    });

    it('should return content items', async () => {
      const items = [
        { id: 'c1', title: 'Note 1', type: 'note', tags: ['test'], createdAt: new Date() },
        { id: 'c2', title: 'Link 1', type: 'link', tags: [], createdAt: new Date() },
      ];
      mockDbSelect.mockResolvedValueOnce(items);

      const result = await getContentForSelectionAction();

      expect(result.success).toBe(true);
      expect(result.items).toHaveLength(2);
    });

    it('should support search query', async () => {
      mockDbSelect.mockResolvedValueOnce([]);

      const result = await getContentForSelectionAction('search term');

      expect(result.success).toBe(true);
    });
  });
});
