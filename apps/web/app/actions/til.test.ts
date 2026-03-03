import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  publishTilAction,
  unpublishTilAction,
  browseTilAction,
  upvoteTilAction,
  trackTilViewAction,
  getTilDetailAction,
} from './til';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock database — deeply chainable
vi.mock('@/lib/db/client', () => {
  // Create a chainable builder that resolves to configurable results
  const createChain = () => {
    const chain: Record<string, unknown> = {};
    const methods = ['from', 'where', 'innerJoin', 'leftJoin', 'orderBy', 'groupBy', 'limit', 'offset', 'set', 'values', 'returning'];
    for (const method of methods) {
      chain[method] = vi.fn().mockReturnValue(chain);
    }
    // Make the chain also act as a thenable (Promise-like) returning empty array
    chain.then = (resolve: (v: unknown[]) => unknown) => Promise.resolve([]).then(resolve);
    return chain;
  };

  return {
    db: {
      select: vi.fn().mockReturnValue(createChain()),
      insert: vi.fn().mockReturnValue(createChain()),
      update: vi.fn().mockReturnValue(createChain()),
      delete: vi.fn().mockReturnValue(createChain()),
    },
  };
});

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock rate limiter
vi.mock('@/lib/rate-limit', () => ({
  checkServerActionRateLimit: vi.fn(() => ({ success: true })),
  RATE_LIMITS: {
    tilPublish: { maxRequests: 10, windowMs: 3600000 },
    tilUpvote: { maxRequests: 60, windowMs: 3600000 },
  },
}));

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { checkServerActionRateLimit } from '@/lib/rate-limit';

const mockSession = {
  user: { id: 'user-1', email: 'test@example.com' },
  expires: '',
};

// Helper to set up chainable mock that resolves specific values
function mockDbSelect(...results: unknown[][]) {
  let callCount = 0;
  vi.mocked(db.select).mockImplementation(() => {
    const idx = Math.min(callCount++, results.length - 1);
    const resolveValue = results[idx];
    const chain: Record<string, unknown> = {};
    const methods = ['from', 'where', 'innerJoin', 'leftJoin', 'orderBy', 'groupBy', 'limit', 'offset'];
    for (const method of methods) {
      chain[method] = vi.fn().mockReturnValue(chain);
    }
    chain.then = (resolve: (v: unknown) => unknown) => Promise.resolve(resolveValue).then(resolve);
    return chain as never;
  });
}

function mockDbInsertReturning(result: unknown[]) {
  vi.mocked(db.insert).mockImplementation(() => {
    const chain: Record<string, unknown> = {};
    chain.values = vi.fn().mockReturnValue(chain);
    chain.returning = vi.fn().mockReturnValue(chain);
    chain.then = (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve);
    return chain as never;
  });
}

function mockDbDeleteSuccess() {
  vi.mocked(db.delete).mockImplementation(() => {
    const chain: Record<string, unknown> = {};
    chain.where = vi.fn().mockReturnValue(chain);
    chain.then = (resolve: (v: unknown) => unknown) => Promise.resolve(undefined).then(resolve);
    return chain as never;
  });
}

function mockDbUpdateSuccess() {
  vi.mocked(db.update).mockImplementation(() => {
    const chain: Record<string, unknown> = {};
    chain.set = vi.fn().mockReturnValue(chain);
    chain.where = vi.fn().mockReturnValue(chain);
    chain.then = (resolve: (v: unknown) => unknown) => Promise.resolve(undefined).then(resolve);
    return chain as never;
  });
}

describe('TIL Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('publishTilAction', () => {
    it('should return unauthorized when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const result = await publishTilAction({
        contentId: 'c-1',
        title: 'TIL: React Hooks',
        tags: [],
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
    });

    it('should return error when rate limited', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as never);
      vi.mocked(checkServerActionRateLimit).mockReturnValue({
        success: false,
        message: 'Rate limit exceeded',
      });

      const result = await publishTilAction({
        contentId: 'c-1',
        title: 'TIL: React Hooks',
        tags: [],
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Rate limit exceeded');
    });

    it('should return error for invalid input', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as never);
      vi.mocked(checkServerActionRateLimit).mockReturnValue({ success: true });

      const result = await publishTilAction({
        contentId: 'not-a-uuid',
        title: '',
        tags: [],
      });

      expect(result.success).toBe(false);
    });

    it('should return error when content not found', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as never);
      vi.mocked(checkServerActionRateLimit).mockReturnValue({ success: true });
      mockDbSelect([]); // content query returns empty

      const result = await publishTilAction({
        contentId: '00000000-0000-0000-0000-000000000001',
        title: 'TIL: React Hooks',
        tags: [],
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Content not found');
    });

    it('should return error for duplicate TIL', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as never);
      vi.mocked(checkServerActionRateLimit).mockReturnValue({ success: true });
      mockDbSelect(
        [{ id: 'c-1', userId: 'user-1', isShared: true, shareId: 'abc' }], // content found
        [{ id: 'til-1' }] // existing TIL found
      );

      const result = await publishTilAction({
        contentId: '00000000-0000-0000-0000-000000000001',
        title: 'TIL: React Hooks',
        tags: [],
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('This content is already published as a TIL');
    });

    it('should successfully publish a TIL', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as never);
      vi.mocked(checkServerActionRateLimit).mockReturnValue({ success: true });
      mockDbSelect(
        [{ id: 'c-1', userId: 'user-1', isShared: true, shareId: 'abc' }], // content found
        [] // no existing TIL
      );
      mockDbInsertReturning([{ id: 'til-new' }]);

      const result = await publishTilAction({
        contentId: '00000000-0000-0000-0000-000000000001',
        title: 'TIL: React Hooks',
        tags: ['react'],
      });

      expect(result.success).toBe(true);
      expect(result.tilId).toBe('til-new');
    });

    it('should auto-share content when not already shared', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as never);
      vi.mocked(checkServerActionRateLimit).mockReturnValue({ success: true });
      mockDbSelect(
        [{ id: 'c-1', userId: 'user-1', isShared: false, shareId: null }], // not shared
        [] // no existing TIL
      );
      mockDbUpdateSuccess();
      mockDbInsertReturning([{ id: 'til-new' }]);

      const result = await publishTilAction({
        contentId: '00000000-0000-0000-0000-000000000001',
        title: 'TIL: React Hooks',
        tags: [],
      });

      expect(result.success).toBe(true);
      expect(db.update).toHaveBeenCalled();
    });
  });

  describe('unpublishTilAction', () => {
    it('should return unauthorized when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const result = await unpublishTilAction('til-1');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
    });

    it('should return error when TIL not found', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as never);
      mockDbSelect([]);

      const result = await unpublishTilAction('til-nonexistent');
      expect(result.success).toBe(false);
      expect(result.message).toBe('TIL not found');
    });

    it('should return unauthorized for non-owner', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as never);
      mockDbSelect([{ id: 'til-1', userId: 'other-user' }]);

      const result = await unpublishTilAction('til-1');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
    });

    it('should successfully unpublish a TIL', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as never);
      mockDbSelect([{ id: 'til-1', userId: 'user-1' }]);
      mockDbDeleteSuccess();

      const result = await unpublishTilAction('til-1');
      expect(result.success).toBe(true);
      expect(db.delete).toHaveBeenCalled();
    });
  });

  describe('browseTilAction', () => {
    it('should return posts with default params', async () => {
      vi.mocked(auth).mockResolvedValue(null as never);
      mockDbSelect(
        [{ count: 0 }], // total count
        [], // posts
        [] // popular tags
      );

      const result = await browseTilAction();
      expect(result.success).toBe(true);
      expect(result.posts).toHaveLength(0);
      expect(result.popularTags).toBeDefined();
    });

    it('should handle tag filter', async () => {
      vi.mocked(auth).mockResolvedValue(null as never);
      mockDbSelect([{ count: 0 }], [], []);

      const result = await browseTilAction({ tag: 'react' });
      expect(result.success).toBe(true);
    });

    it('should handle search query', async () => {
      vi.mocked(auth).mockResolvedValue(null as never);
      mockDbSelect([{ count: 0 }], [], []);

      const result = await browseTilAction({ query: 'react' });
      expect(result.success).toBe(true);
    });

    it('should return empty for no results', async () => {
      vi.mocked(auth).mockResolvedValue(null as never);
      mockDbSelect([{ count: 0 }], [], []);

      const result = await browseTilAction();
      expect(result.success).toBe(true);
      expect(result.posts).toHaveLength(0);
    });

    it('should return pagination info', async () => {
      vi.mocked(auth).mockResolvedValue(null as never);
      mockDbSelect([{ count: 50 }], [], [{ tags: ['react'] }]);

      const result = await browseTilAction({ perPage: 20 });
      expect(result.success).toBe(true);
      expect(result.pagination.total).toBe(50);
      expect(result.pagination.totalPages).toBe(3);
    });
  });

  describe('upvoteTilAction', () => {
    it('should return unauthorized when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const result = await upvoteTilAction('til-1');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Sign in to upvote');
    });

    it('should toggle upvote on (new upvote)', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as never);
      vi.mocked(checkServerActionRateLimit).mockReturnValue({ success: true });
      mockDbSelect([]); // no existing upvote
      mockDbInsertReturning([]);
      mockDbUpdateSuccess();

      const result = await upvoteTilAction('til-1');
      expect(result.success).toBe(true);
      expect(result.message).toBe('Upvoted!');
    });

    it('should toggle upvote off (remove upvote)', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as never);
      vi.mocked(checkServerActionRateLimit).mockReturnValue({ success: true });
      mockDbSelect([{ tilId: 'til-1', userId: 'user-1', createdAt: new Date() }]); // existing upvote
      mockDbDeleteSuccess();
      mockDbUpdateSuccess();

      const result = await upvoteTilAction('til-1');
      expect(result.success).toBe(true);
      expect(result.message).toBe('Upvote removed');
    });

    it('should respect rate limits', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as never);
      vi.mocked(checkServerActionRateLimit).mockReturnValue({
        success: false,
        message: 'Rate limit exceeded',
      });

      const result = await upvoteTilAction('til-1');
      expect(result.success).toBe(false);
    });
  });

  describe('trackTilViewAction', () => {
    it('should not throw on success', async () => {
      mockDbUpdateSuccess();
      await expect(trackTilViewAction('til-1')).resolves.not.toThrow();
    });

    it('should not throw on failure', async () => {
      vi.mocked(db.update).mockImplementation(() => {
        throw new Error('DB error');
      });

      await expect(trackTilViewAction('til-1')).resolves.not.toThrow();
    });
  });

  describe('getTilDetailAction', () => {
    it('should return error for empty tilId', async () => {
      const result = await getTilDetailAction('');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid TIL ID');
    });

    it('should return error when TIL not found', async () => {
      vi.mocked(auth).mockResolvedValue(null as never);
      mockDbSelect([]);

      const result = await getTilDetailAction('til-nonexistent');
      expect(result.success).toBe(false);
      expect(result.message).toBe('TIL not found');
    });

    it('should return TIL detail with hasUpvoted=false for unauthenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as never);
      mockDbSelect([{
        id: 'til-1',
        contentId: 'c-1',
        title: 'TIL: Hooks',
        body: 'Content here',
        tags: ['react'],
        upvoteCount: 5,
        viewCount: 10,
        publishedAt: new Date(),
        creatorId: 'u-1',
        creatorName: 'John',
        creatorUsername: 'john',
        creatorImage: null,
        shareId: 'abc',
      }]);

      const result = await getTilDetailAction('til-1');
      expect(result.success).toBe(true);
      expect(result.post?.hasUpvoted).toBe(false);
    });

    it('should check upvote status for authenticated users', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as never);
      mockDbSelect(
        [{
          id: 'til-1',
          contentId: 'c-1',
          title: 'TIL: Hooks',
          body: 'Content here',
          tags: ['react'],
          upvoteCount: 5,
          viewCount: 10,
          publishedAt: new Date(),
          creatorId: 'u-1',
          creatorName: 'John',
          creatorUsername: 'john',
          creatorImage: null,
          shareId: 'abc',
        }],
        [{ tilId: 'til-1', userId: 'user-1' }] // upvote exists
      );

      const result = await getTilDetailAction('til-1');
      expect(result.success).toBe(true);
      expect(result.post?.hasUpvoted).toBe(true);
    });
  });
});
