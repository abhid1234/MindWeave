import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock auth
const { mockSession } = vi.hoisted(() => ({
  mockSession: { user: { id: 'user-1', email: 'test@test.com' } },
}));
vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue(mockSession),
}));

// Mock rate limiter
vi.mock('@/lib/rate-limit', () => ({
  checkServerActionRateLimit: vi.fn().mockReturnValue({ success: true }),
  RATE_LIMITS: {
    serverAction: { maxRequests: 60, windowMs: 60000 },
    serverActionAI: { maxRequests: 20, windowMs: 60000 },
  },
}));

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock badge engine
vi.mock('@/lib/badges/engine', () => ({
  checkBadgesForUser: vi.fn().mockResolvedValue([]),
}));

// Mock AI recommendations
vi.mock('@/lib/ai/embeddings', () => ({
  getRecommendations: vi.fn().mockResolvedValue([
    { id: 'rec-1', title: 'Recommendation 1', type: 'note', similarity: 0.8 },
    { id: 'rec-2', title: 'Recommendation 2', type: 'link', similarity: 0.7 },
  ]),
}));

// Mock database
vi.mock('@/lib/db/client', () => {
  const createChain = () => {
    const chain: Record<string, unknown> = {};
    const methods = [
      'from', 'where', 'innerJoin', 'leftJoin', 'orderBy', 'groupBy',
      'limit', 'offset', 'set', 'values', 'returning', 'onConflictDoNothing',
    ];
    for (const method of methods) {
      chain[method] = vi.fn().mockReturnValue(chain);
    }
    chain.then = (resolve: (v: unknown[]) => unknown) => Promise.resolve([]).then(resolve);
    return chain;
  };

  return {
    db: {
      select: vi.fn().mockReturnValue(createChain()),
      insert: vi.fn().mockReturnValue(createChain()),
      update: vi.fn().mockReturnValue(createChain()),
      delete: vi.fn().mockReturnValue(createChain()),
      execute: vi.fn().mockResolvedValue([]),
    },
  };
});

import { db } from '@/lib/db/client';
import { auth } from '@/lib/auth';
import { checkServerActionRateLimit } from '@/lib/rate-limit';
import { checkBadgesForUser } from '@/lib/badges/engine';
import { getRecommendations } from '@/lib/ai/embeddings';
import {
  createLearningPathAction,
  updateLearningPathAction,
  deleteLearningPathAction,
  getLearningPathsAction,
  getLearningPathDetailAction,
  addItemToPathAction,
  removeItemFromPathAction,
  reorderPathItemsAction,
  toggleItemProgressAction,
  suggestPathItemsAction,
  getPathContentPickerAction,
} from './learning-paths';

function mockDbSelectSequential(...results: unknown[][]) {
  let callCount = 0;
  vi.mocked(db.select).mockImplementation(() => {
    const idx = Math.min(callCount++, results.length - 1);
    const resolveValue = results[idx];
    const chain: Record<string, unknown> = {};
    const methods = [
      'from', 'where', 'innerJoin', 'leftJoin', 'orderBy', 'groupBy',
      'limit', 'offset', 'onConflictDoNothing',
    ];
    for (const method of methods) {
      chain[method] = vi.fn().mockReturnValue(chain);
    }
    chain.then = (resolve: (v: unknown[]) => unknown) =>
      Promise.resolve(resolveValue).then(resolve);
    return chain as never;
  });
}

function mockDbInsertReturning(returnValue: unknown[]) {
  const chain: Record<string, unknown> = {};
  const methods = ['values', 'returning', 'onConflictDoNothing'];
  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  chain.then = (resolve: (v: unknown[]) => unknown) =>
    Promise.resolve(returnValue).then(resolve);
  vi.mocked(db.insert).mockReturnValue(chain as never);
}

function mockDbDeleteReturning(returnValue: unknown[]) {
  const chain: Record<string, unknown> = {};
  const methods = ['where', 'returning'];
  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  chain.then = (resolve: (v: unknown[]) => unknown) =>
    Promise.resolve(returnValue).then(resolve);
  vi.mocked(db.delete).mockReturnValue(chain as never);
}

describe('Learning Paths Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(checkServerActionRateLimit).mockReturnValue({ success: true });
  });

  // === AUTH TESTS ===
  describe('Authentication', () => {
    it('should return unauthorized when not logged in', async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as never);
      const result = await createLearningPathAction({ title: 'Test' });
      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
    });

    it('should return unauthorized for getLearningPaths', async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as never);
      const result = await getLearningPathsAction();
      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
    });
  });

  // === RATE LIMITING ===
  describe('Rate Limiting', () => {
    it('should return rate limit message when limit exceeded', async () => {
      vi.mocked(checkServerActionRateLimit).mockReturnValueOnce({
        success: false,
        message: 'Rate limit exceeded',
      });
      const result = await createLearningPathAction({ title: 'Test' });
      expect(result.success).toBe(false);
      expect(result.message).toBe('Rate limit exceeded');
    });
  });

  // === CREATE ===
  describe('createLearningPathAction', () => {
    it('should create a learning path successfully', async () => {
      mockDbInsertReturning([{ id: 'new-path-id' }]);

      const result = await createLearningPathAction({
        title: 'Learn TypeScript',
        description: 'A guide to TS',
        difficulty: 'beginner',
        estimatedMinutes: 60,
      });

      expect(result.success).toBe(true);
      expect(result.pathId).toBe('new-path-id');
      expect(db.insert).toHaveBeenCalled();
      expect(checkBadgesForUser).toHaveBeenCalledWith('user-1', 'path_created');
    });

    it('should fail with empty title', async () => {
      const result = await createLearningPathAction({ title: '' });
      expect(result.success).toBe(false);
      expect(result.message).toContain('Title is required');
    });

    it('should accept minimal params', async () => {
      mockDbInsertReturning([{ id: 'new-id' }]);

      const result = await createLearningPathAction({ title: 'Minimal Path' });
      expect(result.success).toBe(true);
    });
  });

  // === UPDATE ===
  describe('updateLearningPathAction', () => {
    it('should update a learning path', async () => {
      mockDbSelectSequential([{ id: 'path-1' }]);
      const updateChain: Record<string, unknown> = {};
      updateChain.set = vi.fn().mockReturnValue(updateChain);
      updateChain.where = vi.fn().mockReturnValue(updateChain);
      updateChain.then = (resolve: (v: unknown[]) => unknown) =>
        Promise.resolve([]).then(resolve);
      vi.mocked(db.update).mockReturnValue(updateChain as never);

      const result = await updateLearningPathAction('path-1', {
        title: 'Updated Title',
      });
      expect(result.success).toBe(true);
    });

    it('should return not found for non-existent path', async () => {
      mockDbSelectSequential([]);

      const result = await updateLearningPathAction('bad-id', {
        title: 'Updated',
      });
      expect(result.success).toBe(false);
      expect(result.message).toBe('Learning path not found');
    });
  });

  // === DELETE ===
  describe('deleteLearningPathAction', () => {
    it('should delete a learning path', async () => {
      mockDbDeleteReturning([{ id: 'path-1' }]);

      const result = await deleteLearningPathAction('path-1');
      expect(result.success).toBe(true);
    });

    it('should return not found when path does not exist', async () => {
      mockDbDeleteReturning([]);

      const result = await deleteLearningPathAction('bad-id');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Learning path not found');
    });
  });

  // === GET LIST ===
  describe('getLearningPathsAction', () => {
    it('should return empty list when no paths', async () => {
      mockDbSelectSequential([]);

      const result = await getLearningPathsAction();
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should return paths with counts', async () => {
      const pathData = {
        id: 'p1',
        title: 'Test',
        description: null,
        estimatedMinutes: null,
        difficulty: null,
        isPublic: false,
        createdAt: new Date(),
      };
      // First select: paths, then itemCount, then completedCount
      mockDbSelectSequential([pathData], [{ value: 5 }], [{ value: 2 }]);

      const result = await getLearningPathsAction();
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].itemCount).toBe(5);
      expect(result.data![0].completedCount).toBe(2);
    });
  });

  // === GET DETAIL ===
  describe('getLearningPathDetailAction', () => {
    it('should return not found for non-existent path', async () => {
      mockDbSelectSequential([]);

      const result = await getLearningPathDetailAction('bad-id');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Learning path not found');
    });

    it('should return path with items', async () => {
      const pathData = {
        id: 'p1',
        userId: 'user-1',
        title: 'Test Path',
        description: 'desc',
        estimatedMinutes: 60,
        difficulty: 'beginner',
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const itemData = [
        {
          id: 'i1',
          contentId: 'c1',
          position: 0,
          isOptional: false,
          contentTitle: 'Item 1',
          contentType: 'note',
          contentBody: null,
        },
      ];
      // First select: path, second select: items (joined), third: completed
      mockDbSelectSequential([pathData], itemData, []);

      const result = await getLearningPathDetailAction('p1');
      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('Test Path');
      expect(result.data?.items).toHaveLength(1);
      expect(result.data?.items[0].isCompleted).toBe(false);
    });
  });

  // === ADD ITEM ===
  describe('addItemToPathAction', () => {
    const validPathId = '00000000-0000-0000-0000-000000000001';
    const validContentId = '00000000-0000-0000-0000-000000000002';

    it('should return not found when path does not exist', async () => {
      mockDbSelectSequential([]);

      const result = await addItemToPathAction({
        pathId: validPathId,
        contentId: validContentId,
        isOptional: false,
      });
      expect(result.success).toBe(false);
      expect(result.message).toBe('Learning path not found');
    });

    it('should return not found when content does not exist', async () => {
      mockDbSelectSequential([{ id: validPathId }], []);

      const result = await addItemToPathAction({
        pathId: validPathId,
        contentId: validContentId,
        isOptional: false,
      });
      expect(result.success).toBe(false);
      expect(result.message).toBe('Content not found');
    });

    it('should add item with next position', async () => {
      mockDbSelectSequential([{ id: validPathId }], [{ id: validContentId }], [{ value: 2 }]);
      mockDbInsertReturning([{ id: 'new-item' }]);

      const result = await addItemToPathAction({
        pathId: validPathId,
        contentId: validContentId,
        isOptional: false,
      });
      expect(result.success).toBe(true);
      expect(db.insert).toHaveBeenCalled();
    });

    it('should reject invalid UUID', async () => {
      const result = await addItemToPathAction({
        pathId: 'not-a-uuid',
        contentId: 'not-a-uuid',
        isOptional: false,
      });
      expect(result.success).toBe(false);
    });
  });

  // === REMOVE ITEM ===
  describe('removeItemFromPathAction', () => {
    it('should return not found when path does not exist', async () => {
      mockDbSelectSequential([]);

      const result = await removeItemFromPathAction('item-1', 'bad-id');
      expect(result.success).toBe(false);
    });

    it('should remove item and recompact', async () => {
      mockDbSelectSequential(
        [{ id: 'p1' }], // path ownership check
        [{ id: 'item-2' }] // remaining items
      );
      mockDbDeleteReturning([{ id: 'item-1' }]);

      const result = await removeItemFromPathAction('item-1', 'p1');
      expect(result.success).toBe(true);
    });
  });

  // === REORDER ===
  describe('reorderPathItemsAction', () => {
    it('should reorder items', async () => {
      const pathId = '00000000-0000-0000-0000-000000000001';
      const itemId1 = '00000000-0000-0000-0000-000000000010';
      const itemId2 = '00000000-0000-0000-0000-000000000011';
      mockDbSelectSequential([{ id: pathId }]);
      const updateChain: Record<string, unknown> = {};
      updateChain.set = vi.fn().mockReturnValue(updateChain);
      updateChain.where = vi.fn().mockReturnValue(updateChain);
      updateChain.then = (resolve: (v: unknown[]) => unknown) =>
        Promise.resolve([]).then(resolve);
      vi.mocked(db.update).mockReturnValue(updateChain as never);

      const result = await reorderPathItemsAction({
        pathId,
        itemIds: [itemId2, itemId1],
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty itemIds array', async () => {
      const result = await reorderPathItemsAction({
        pathId: '00000000-0000-0000-0000-000000000001',
        itemIds: [],
      });
      expect(result.success).toBe(false);
    });
  });

  // === TOGGLE PROGRESS ===
  describe('toggleItemProgressAction', () => {
    it('should complete an item', async () => {
      // Path exists, no existing progress, then 2 badge-check selects returning {value: 0}
      mockDbSelectSequential([{ id: 'p1' }], [], [{ value: 0 }], [{ value: 0 }]);
      mockDbInsertReturning([]);

      const result = await toggleItemProgressAction({
        pathId: '00000000-0000-0000-0000-000000000001',
        contentId: '00000000-0000-0000-0000-000000000002',
      });
      expect(result.success).toBe(true);
    });

    it('should return not found for non-existent path', async () => {
      mockDbSelectSequential([]);

      const result = await toggleItemProgressAction({
        pathId: '00000000-0000-0000-0000-000000000001',
        contentId: '00000000-0000-0000-0000-000000000002',
      });
      expect(result.success).toBe(false);
      expect(result.message).toBe('Learning path not found');
    });
  });

  // === SUGGEST ITEMS ===
  describe('suggestPathItemsAction', () => {
    it('should return suggestions based on existing items', async () => {
      mockDbSelectSequential(
        [{ id: 'p1' }], // path ownership
        [{ contentId: 'c1' }, { contentId: 'c2' }] // existing items
      );

      const result = await suggestPathItemsAction('p1');
      expect(result.success).toBe(true);
      expect(getRecommendations).toHaveBeenCalled();
      expect(result.data).toBeDefined();
    });

    it('should return empty suggestions when path has no items', async () => {
      mockDbSelectSequential([{ id: 'p1' }], []);

      const result = await suggestPathItemsAction('p1');
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should return not found for non-existent path', async () => {
      mockDbSelectSequential([]);

      const result = await suggestPathItemsAction('bad-id');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Learning path not found');
    });
  });

  // === CONTENT PICKER ===
  describe('getPathContentPickerAction', () => {
    it('should search user content', async () => {
      mockDbSelectSequential(
        [{ contentId: 'existing-1' }], // existing items
        [{ id: 'c3', title: 'React Guide', type: 'note' }] // search results
      );

      const result = await getPathContentPickerAction('p1', 'React');
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should return empty for no match', async () => {
      mockDbSelectSequential([], []);

      const result = await getPathContentPickerAction('p1', 'xyz');
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });
});
