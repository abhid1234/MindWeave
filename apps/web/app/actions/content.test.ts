import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock auth
const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

// Mock db
const mockReturning = vi.fn();
const mockLimit = vi.fn();
const mockDelete = vi.fn();
const mockUpdate = vi.fn();
const mockOrderBy = vi.fn();
const mockWhere = vi.fn();

vi.mock('@/lib/db/client', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: (...args: unknown[]) => mockWhere(...args),
    limit: (...args: unknown[]) => mockLimit(...args),
    orderBy: (...args: unknown[]) => mockOrderBy(...args),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: mockReturning,
      }),
    }),
    update: (...args: unknown[]) => mockUpdate(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
    execute: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  content: {
    id: 'id',
    userId: 'userId',
    type: 'type',
    title: 'title',
    body: 'body',
    url: 'url',
    tags: 'tags',
    autoTags: 'autoTags',
    createdAt: 'createdAt',
    metadata: 'metadata',
    isShared: 'isShared',
    shareId: 'shareId',
    isFavorite: 'isFavorite',
    summary: 'summary',
  },
  contentCollections: {
    contentId: 'contentId',
    collectionId: 'collectionId',
  },
  contentVersions: {
    id: 'id',
    contentId: 'contentId',
    title: 'title',
    body: 'body',
    url: 'url',
    metadata: 'metadata',
    versionNumber: 'versionNumber',
    createdAt: 'createdAt',
  },
}));

vi.mock('@/lib/validations', () => ({
  createContentSchema: {
    safeParse: vi.fn().mockReturnValue({
      success: true,
      data: { type: 'note', title: 'Test', body: 'Body', tags: [], url: '' },
    }),
  },
  updateContentSchema: {
    safeParse: vi.fn().mockReturnValue({
      success: true,
      data: { title: 'Updated' },
    }),
  },
}));

vi.mock('@/lib/ai/gemini', () => ({
  generateTags: vi.fn().mockResolvedValue(['tag1']),
}));

vi.mock('@/lib/ai/summarization', () => ({
  generateSummary: vi.fn().mockResolvedValue('summary'),
}));

vi.mock('@/lib/ai/embeddings', () => ({
  upsertContentEmbedding: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('@/lib/cache', () => ({
  CacheTags: { ANALYTICS: 'analytics', CONTENT: 'content' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: unknown[]) => args),
  desc: vi.fn(),
  asc: vi.fn(),
  and: vi.fn((...args: unknown[]) => args),
  or: vi.fn(),
  sql: vi.fn(),
  inArray: vi.fn(),
}));

describe('Content Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
  });

  describe('createContentAction', () => {
    it('should return unauthorized when not logged in', async () => {
      mockAuth.mockResolvedValue(null);

      const { createContentAction } = await import('./content');
      const formData = new FormData();
      formData.set('type', 'note');
      formData.set('title', 'Test');

      const result = await createContentAction(formData);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Unauthorized');
    });

    it('should create content successfully', async () => {
      mockReturning.mockResolvedValue([{ id: 'new-id' }]);

      const { createContentAction } = await import('./content');
      const formData = new FormData();
      formData.set('type', 'note');
      formData.set('title', 'Test Note');
      formData.set('body', 'Test body');

      const result = await createContentAction(formData);
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('new-id');
    });

    it('should handle validation failure', async () => {
      const { createContentSchema } = await import('@/lib/validations');
      vi.mocked(createContentSchema.safeParse).mockReturnValueOnce({
        success: false,
        error: { flatten: () => ({ fieldErrors: { title: ['Required'] }, formErrors: [] }) },
      } as any);

      const { createContentAction } = await import('./content');
      const formData = new FormData();
      formData.set('type', 'note');

      const result = await createContentAction(formData);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Validation');
    });
  });

  describe('updateContentTagsAction', () => {
    it('should return unauthorized when not logged in', async () => {
      mockAuth.mockResolvedValue(null);
      const { updateContentTagsAction } = await import('./content');
      const result = await updateContentTagsAction({ contentId: '1', tags: ['tag'] });
      expect(result.success).toBe(false);
    });

    it('should return error for invalid content ID', async () => {
      const { updateContentTagsAction } = await import('./content');
      const result = await updateContentTagsAction({ contentId: '', tags: ['tag'] });
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid content ID');
    });

    it('should return error for non-array tags', async () => {
      const { updateContentTagsAction } = await import('./content');
      const result = await updateContentTagsAction({ contentId: 'id-1', tags: 'not-array' as any });
      expect(result.success).toBe(false);
      expect(result.message).toContain('Tags must be an array');
    });

    it('should return error when content not found', async () => {
      mockWhere.mockReturnValue({ limit: vi.fn().mockResolvedValue([]) });
      const { updateContentTagsAction } = await import('./content');
      const result = await updateContentTagsAction({ contentId: 'id-1', tags: ['tag'] });
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should update tags successfully', async () => {
      mockWhere.mockReturnValueOnce({ limit: vi.fn().mockResolvedValue([{ id: 'id-1' }]) });
      mockUpdate.mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) });

      const { updateContentTagsAction } = await import('./content');
      const result = await updateContentTagsAction({ contentId: 'id-1', tags: ['newtag'] });
      expect(result.success).toBe(true);
    });
  });

  describe('deleteContentAction', () => {
    it('should return unauthorized when not logged in', async () => {
      mockAuth.mockResolvedValue(null);
      const { deleteContentAction } = await import('./content');
      const result = await deleteContentAction('id-1');
      expect(result.success).toBe(false);
    });

    it('should return error for empty content ID', async () => {
      const { deleteContentAction } = await import('./content');
      const result = await deleteContentAction('');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid content ID');
    });

    it('should return error when content not found', async () => {
      mockWhere.mockReturnValue({ limit: vi.fn().mockResolvedValue([]) });
      const { deleteContentAction } = await import('./content');
      const result = await deleteContentAction('id-1');
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should delete content successfully', async () => {
      mockWhere.mockReturnValueOnce({ limit: vi.fn().mockResolvedValue([{ id: 'id-1' }]) });
      mockDelete.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });

      const { deleteContentAction } = await import('./content');
      const result = await deleteContentAction('id-1');
      expect(result.success).toBe(true);
    });
  });

  describe('getContentAction', () => {
    it('should return empty when not logged in', async () => {
      mockAuth.mockResolvedValue(null);
      const { getContentAction } = await import('./content');
      const result = await getContentAction();
      expect(result.success).toBe(false);
      expect(result.items).toEqual([]);
    });

    it('should fetch content successfully', async () => {
      const mockItems = [
        { id: '1', type: 'note', title: 'T', body: null, url: null, tags: [], autoTags: [], createdAt: new Date(), metadata: null, isShared: false, shareId: null, isFavorite: false, summary: null },
      ];
      mockWhere.mockReturnValue({ orderBy: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue(mockItems) }) });

      const { getContentAction } = await import('./content');
      const result = await getContentAction();
      expect(result.success).toBe(true);
      expect(result.items).toHaveLength(1);
    });
  });

  describe('getContentAction with filters', () => {
    const mockOrderByChain = () => ({
      orderBy: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([]),
      }),
    });

    it('should apply type filter', async () => {
      mockWhere.mockReturnValue(mockOrderByChain());
      const { getContentAction } = await import('./content');
      const result = await getContentAction({ type: 'note' });
      expect(result.success).toBe(true);
    });

    it('should apply tag filter', async () => {
      mockWhere.mockReturnValue(mockOrderByChain());
      const { getContentAction } = await import('./content');
      const result = await getContentAction({ tag: 'javascript' });
      expect(result.success).toBe(true);
    });

    it('should apply search query filter', async () => {
      mockWhere.mockReturnValue(mockOrderByChain());
      const { getContentAction } = await import('./content');
      const result = await getContentAction({ query: 'test search' });
      expect(result.success).toBe(true);
    });

    it('should apply favorites filter', async () => {
      mockWhere.mockReturnValue(mockOrderByChain());
      const { getContentAction } = await import('./content');
      const result = await getContentAction({ favoritesOnly: true });
      expect(result.success).toBe(true);
    });

    it('should apply cursor pagination with desc order', async () => {
      mockWhere.mockReturnValue(mockOrderByChain());
      const { getContentAction } = await import('./content');
      const result = await getContentAction({ cursor: '2024-01-01T00:00:00Z', sortOrder: 'desc' });
      expect(result.success).toBe(true);
    });

    it('should apply cursor pagination with asc order', async () => {
      mockWhere.mockReturnValue(mockOrderByChain());
      const { getContentAction } = await import('./content');
      const result = await getContentAction({ cursor: '2024-01-01T00:00:00Z', sortOrder: 'asc' });
      expect(result.success).toBe(true);
    });

    it('should sort by title asc', async () => {
      mockWhere.mockReturnValue(mockOrderByChain());
      const { getContentAction } = await import('./content');
      const result = await getContentAction({ sortBy: 'title', sortOrder: 'asc' });
      expect(result.success).toBe(true);
    });

    it('should sort by title desc', async () => {
      mockWhere.mockReturnValue(mockOrderByChain());
      const { getContentAction } = await import('./content');
      const result = await getContentAction({ sortBy: 'title', sortOrder: 'desc' });
      expect(result.success).toBe(true);
    });

    it('should handle collectionId filter with empty collection', async () => {
      // First call for collection content IDs query
      mockWhere.mockReturnValueOnce([]);

      const { getContentAction } = await import('./content');
      const result = await getContentAction({ collectionId: 'col-1' });
      expect(result.success).toBe(true);
      expect(result.items).toEqual([]);
    });

    it('should handle collectionId filter with content', async () => {
      // Collection content IDs
      mockWhere.mockReturnValueOnce([{ contentId: 'c1' }, { contentId: 'c2' }]);
      // Main content query
      mockWhere.mockReturnValue(mockOrderByChain());

      const { getContentAction } = await import('./content');
      const result = await getContentAction({ collectionId: 'col-1' });
      expect(result.success).toBe(true);
    });

    it('should handle hasMore with extra items', async () => {
      const items = Array.from({ length: 21 }, (_, i) => ({
        id: `${i}`, type: 'note', title: `T${i}`, body: null, url: null,
        tags: [], autoTags: [], createdAt: new Date(), metadata: null,
        isShared: false, shareId: null, isFavorite: false, summary: null,
      }));
      mockWhere.mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(items),
        }),
      });

      const { getContentAction } = await import('./content');
      const result = await getContentAction();
      expect(result.success).toBe(true);
      expect(result.hasMore).toBe(true);
      expect(result.items).toHaveLength(20);
      expect(result.nextCursor).toBeDefined();
    });

    it('should handle error in getContentAction', async () => {
      mockWhere.mockImplementation(() => { throw new Error('DB fail'); });

      const { getContentAction } = await import('./content');
      const result = await getContentAction();
      expect(result.success).toBe(false);
    });
  });

  describe('shareContentAction', () => {
    it('should return unauthorized when not logged in', async () => {
      mockAuth.mockResolvedValue(null);
      const { shareContentAction } = await import('./content');
      const result = await shareContentAction('id-1');
      expect(result.success).toBe(false);
    });

    it('should return existing share URL if already shared', async () => {
      mockWhere.mockReturnValue({ limit: vi.fn().mockResolvedValue([{ id: 'id-1', isShared: true, shareId: 'share-123' }]) });

      const { shareContentAction } = await import('./content');
      const result = await shareContentAction('id-1');
      expect(result.success).toBe(true);
      expect(result.message).toContain('already shared');
      expect(result.shareId).toBe('share-123');
    });

    it('should share content successfully', async () => {
      mockWhere.mockReturnValueOnce({ limit: vi.fn().mockResolvedValue([{ id: 'id-1', isShared: false, shareId: null }]) });
      mockUpdate.mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) });

      const { shareContentAction } = await import('./content');
      const result = await shareContentAction('id-1');
      expect(result.success).toBe(true);
      expect(result.shareId).toBeDefined();
    });
  });

  describe('unshareContentAction', () => {
    it('should return unauthorized when not logged in', async () => {
      mockAuth.mockResolvedValue(null);
      const { unshareContentAction } = await import('./content');
      const result = await unshareContentAction('id-1');
      expect(result.success).toBe(false);
    });

    it('should unshare content successfully', async () => {
      mockWhere.mockReturnValueOnce({ limit: vi.fn().mockResolvedValue([{ id: 'id-1' }]) });
      mockUpdate.mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) });

      const { unshareContentAction } = await import('./content');
      const result = await unshareContentAction('id-1');
      expect(result.success).toBe(true);
    });
  });

  describe('getSharedContentAction', () => {
    it('should return error for invalid share ID', async () => {
      const { getSharedContentAction } = await import('./content');
      const result = await getSharedContentAction('');
      expect(result.success).toBe(false);
    });

    it('should return content when found', async () => {
      mockWhere.mockReturnValue({
        limit: vi.fn().mockResolvedValue([{
          id: 'id-1', type: 'note', title: 'T', body: null, url: null,
          tags: [], autoTags: [], createdAt: new Date(), metadata: null, isShared: true,
        }]),
      });

      const { getSharedContentAction } = await import('./content');
      const result = await getSharedContentAction('share-123');
      expect(result.success).toBe(true);
      expect(result.content?.title).toBe('T');
    });
  });

  describe('bulkDeleteContentAction', () => {
    it('should return unauthorized when not logged in', async () => {
      mockAuth.mockResolvedValue(null);
      const { bulkDeleteContentAction } = await import('./content');
      const result = await bulkDeleteContentAction(['1']);
      expect(result.success).toBe(false);
    });

    it('should return error for empty array', async () => {
      const { bulkDeleteContentAction } = await import('./content');
      const result = await bulkDeleteContentAction([]);
      expect(result.success).toBe(false);
    });

    it('should delete multiple items', async () => {
      mockDelete.mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: '1' }, { id: '2' }]),
        }),
      });

      const { bulkDeleteContentAction } = await import('./content');
      const result = await bulkDeleteContentAction(['1', '2']);
      expect(result.success).toBe(true);
      expect(result.successCount).toBe(2);
    });
  });

  describe('toggleFavoriteAction', () => {
    it('should return unauthorized when not logged in', async () => {
      mockAuth.mockResolvedValue(null);
      const { toggleFavoriteAction } = await import('./content');
      const result = await toggleFavoriteAction('id-1');
      expect(result.success).toBe(false);
    });

    it('should toggle favorite status', async () => {
      mockWhere.mockReturnValueOnce([{ id: 'id-1', isFavorite: false }]);
      mockUpdate.mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) });

      const { toggleFavoriteAction } = await import('./content');
      const result = await toggleFavoriteAction('id-1');
      expect(result.success).toBe(true);
      expect(result.isFavorite).toBe(true);
    });

    it('should return error when content not found', async () => {
      mockWhere.mockReturnValueOnce([]);

      const { toggleFavoriteAction } = await import('./content');
      const result = await toggleFavoriteAction('nonexistent');
      expect(result.success).toBe(false);
    });
  });

  describe('bulkAddTagsAction', () => {
    it('should return unauthorized when not logged in', async () => {
      mockAuth.mockResolvedValue(null);
      const { bulkAddTagsAction } = await import('./content');
      const result = await bulkAddTagsAction(['1'], ['tag']);
      expect(result.success).toBe(false);
    });

    it('should return error for empty content IDs', async () => {
      const { bulkAddTagsAction } = await import('./content');
      const result = await bulkAddTagsAction([], ['tag']);
      expect(result.success).toBe(false);
    });

    it('should return error for empty tags', async () => {
      const { bulkAddTagsAction } = await import('./content');
      const result = await bulkAddTagsAction(['1'], []);
      expect(result.success).toBe(false);
    });
  });

  describe('bulkShareContentAction', () => {
    it('should return unauthorized when not logged in', async () => {
      mockAuth.mockResolvedValue(null);
      const { bulkShareContentAction } = await import('./content');
      const result = await bulkShareContentAction(['1']);
      expect(result.success).toBe(false);
    });

    it('should return error for empty array', async () => {
      const { bulkShareContentAction } = await import('./content');
      const result = await bulkShareContentAction([]);
      expect(result.success).toBe(false);
    });
  });

  describe('bulkUnshareContentAction', () => {
    it('should return unauthorized when not logged in', async () => {
      mockAuth.mockResolvedValue(null);
      const { bulkUnshareContentAction } = await import('./content');
      const result = await bulkUnshareContentAction(['1']);
      expect(result.success).toBe(false);
    });

    it('should return error for empty array', async () => {
      const { bulkUnshareContentAction } = await import('./content');
      const result = await bulkUnshareContentAction([]);
      expect(result.success).toBe(false);
    });
  });

  describe('updateContentAction', () => {
    it('should return unauthorized when not logged in', async () => {
      mockAuth.mockResolvedValue(null);
      const { updateContentAction } = await import('./content');
      const result = await updateContentAction({ contentId: '1', title: 'New' });
      expect(result.success).toBe(false);
    });

    it('should return error for invalid content ID', async () => {
      const { updateContentAction } = await import('./content');
      const result = await updateContentAction({ contentId: '', title: 'New' });
      expect(result.success).toBe(false);
    });

    it('should return validation error for invalid data', async () => {
      const { updateContentSchema } = await import('@/lib/validations');
      vi.mocked(updateContentSchema.safeParse).mockReturnValueOnce({
        success: false,
        error: { flatten: () => ({ fieldErrors: { title: ['Too short'] }, formErrors: [] }) },
      } as any);

      const { updateContentAction } = await import('./content');
      const result = await updateContentAction({ contentId: 'id-1', title: '' });
      expect(result.success).toBe(false);
      expect(result.message).toContain('Validation');
    });

    it('should return error when content not found', async () => {
      mockWhere.mockReturnValue({ limit: vi.fn().mockResolvedValue([]) });
      const { updateContentAction } = await import('./content');
      const result = await updateContentAction({ contentId: 'id-1', title: 'New' });
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should update content successfully', async () => {
      // 1st mockWhere: fetch existing content
      mockWhere.mockReturnValueOnce({
        limit: vi.fn().mockResolvedValue([{ id: 'id-1', body: 'old', title: 'Old', url: null, type: 'note', metadata: null }]),
      });
      // 2nd mockWhere: fetch last version number
      mockWhere.mockReturnValueOnce({
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      });
      // 3rd mockWhere: prune old versions
      mockWhere.mockReturnValueOnce({
        orderBy: vi.fn().mockReturnValue({
          offset: vi.fn().mockResolvedValue([]),
        }),
      });
      mockUpdate.mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) });

      const { updateContentAction } = await import('./content');
      const result = await updateContentAction({ contentId: 'id-1', title: 'New Title' });
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('id-1');
    });

    it('should regenerate AI content when body changes', async () => {
      const { updateContentSchema } = await import('@/lib/validations');
      vi.mocked(updateContentSchema.safeParse).mockReturnValueOnce({
        success: true,
        data: { body: 'New body text' },
      } as any);

      // 1st mockWhere: fetch existing content
      mockWhere.mockReturnValueOnce({
        limit: vi.fn().mockResolvedValue([{ id: 'id-1', body: 'Old body', title: 'Title', url: null, type: 'note', metadata: null }]),
      });
      // 2nd mockWhere: fetch last version number
      mockWhere.mockReturnValueOnce({
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      });
      // 3rd mockWhere: prune old versions
      mockWhere.mockReturnValueOnce({
        orderBy: vi.fn().mockReturnValue({
          offset: vi.fn().mockResolvedValue([]),
        }),
      });
      mockUpdate.mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) });

      const { updateContentAction } = await import('./content');
      const result = await updateContentAction({ contentId: 'id-1', body: 'New body text' });
      expect(result.success).toBe(true);
    });

    it('should handle DB error in update', async () => {
      mockWhere.mockImplementation(() => { throw new Error('DB fail'); });
      const { updateContentAction } = await import('./content');
      const result = await updateContentAction({ contentId: 'id-1', title: 'New' });
      expect(result.success).toBe(false);
    });
  });

  describe('createContentAction edge cases', () => {
    it('should parse tags from comma-separated string', async () => {
      mockReturning.mockResolvedValue([{ id: 'new-id' }]);

      const { createContentAction } = await import('./content');
      const formData = new FormData();
      formData.set('type', 'note');
      formData.set('title', 'With Tags');
      formData.set('tags', 'tag1, tag2, tag3');

      const result = await createContentAction(formData);
      expect(result.success).toBe(true);
    });

    it('should handle DB error during insert', async () => {
      mockReturning.mockRejectedValueOnce(new Error('Insert failed'));

      const { createContentAction } = await import('./content');
      const formData = new FormData();
      formData.set('type', 'note');
      formData.set('title', 'Fail Insert');

      const result = await createContentAction(formData);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to save');
    });
  });

  describe('content not found branch for share/unshare', () => {
    it('shareContentAction returns error for non-existent content', async () => {
      mockWhere.mockReturnValue({ limit: vi.fn().mockResolvedValue([]) });
      const { shareContentAction } = await import('./content');
      const result = await shareContentAction('nonexistent');
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('unshareContentAction returns error for non-existent content', async () => {
      mockWhere.mockReturnValue({ limit: vi.fn().mockResolvedValue([]) });
      const { unshareContentAction } = await import('./content');
      const result = await unshareContentAction('nonexistent');
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('getSharedContentAction returns error for non-shared content', async () => {
      mockWhere.mockReturnValue({ limit: vi.fn().mockResolvedValue([]) });
      const { getSharedContentAction } = await import('./content');
      const result = await getSharedContentAction('invalid-share');
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
  });

  describe('bulk operations edge cases', () => {
    it('bulkDeleteContentAction returns failed when no items deleted', async () => {
      mockDelete.mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      });

      const { bulkDeleteContentAction } = await import('./content');
      const result = await bulkDeleteContentAction(['nonexistent']);
      expect(result.success).toBe(false);
      expect(result.successCount).toBe(0);
    });

    it('bulkAddTagsAction with existing items adds tags', async () => {
      mockWhere.mockReturnValueOnce([
        { id: 'c1', tags: ['old-tag'] },
      ]);
      mockUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      const { bulkAddTagsAction } = await import('./content');
      const result = await bulkAddTagsAction(['c1'], ['new-tag']);
      expect(result.success).toBe(true);
      expect(result.successCount).toBe(1);
    });

    it('bulkShareContentAction with unshared items shares them', async () => {
      mockWhere.mockReturnValueOnce([
        { id: 'c1', isShared: false },
      ]);
      mockUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      const { bulkShareContentAction } = await import('./content');
      const result = await bulkShareContentAction(['c1']);
      expect(result.success).toBe(true);
    });

    it('bulkShareContentAction with already shared items counts them', async () => {
      mockWhere.mockReturnValueOnce([
        { id: 'c1', isShared: true },
      ]);

      const { bulkShareContentAction } = await import('./content');
      const result = await bulkShareContentAction(['c1']);
      expect(result.success).toBe(true);
      expect(result.successCount).toBe(1);
    });

    it('bulkUnshareContentAction updates and returns results', async () => {
      mockUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'c1' }]),
          }),
        }),
      });

      const { bulkUnshareContentAction } = await import('./content');
      const result = await bulkUnshareContentAction(['c1']);
      expect(result.success).toBe(true);
      expect(result.successCount).toBe(1);
    });

    it('bulkUnshareContentAction returns failed when none unshared', async () => {
      mockUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const { bulkUnshareContentAction } = await import('./content');
      const result = await bulkUnshareContentAction(['nonexistent']);
      expect(result.success).toBe(false);
    });

    it('bulkShareContentAction with empty results returns failed', async () => {
      mockWhere.mockReturnValueOnce([]);

      const { bulkShareContentAction } = await import('./content');
      const result = await bulkShareContentAction(['nonexistent']);
      expect(result.success).toBe(false);
    });

    it('bulkAddTagsAction with no found items returns failed', async () => {
      mockWhere.mockReturnValueOnce([]);

      const { bulkAddTagsAction } = await import('./content');
      const result = await bulkAddTagsAction(['nonexistent'], ['tag']);
      expect(result.success).toBe(false);
    });
  });
});
