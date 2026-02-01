import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCachedFn, CacheDuration, CacheTags } from './cache';

// Mock next/cache
vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((fn: (...args: unknown[]) => unknown, _keyParts: string[], _options: object) => fn),
  revalidateTag: vi.fn(),
}));

import { unstable_cache } from 'next/cache';

describe('Cache utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCachedFn', () => {
    it('should call unstable_cache with default revalidate of 60', () => {
      const fn = async () => 'result';
      createCachedFn(fn as any, ['test-key']);

      expect(unstable_cache).toHaveBeenCalledWith(fn, ['test-key'], {
        revalidate: 60,
        tags: undefined,
      });
    });

    it('should pass custom options to unstable_cache', () => {
      const fn = async () => 'result';
      createCachedFn(fn as any, ['key'], { revalidate: 300, tags: ['analytics'] });

      expect(unstable_cache).toHaveBeenCalledWith(fn, ['key'], {
        revalidate: 300,
        tags: ['analytics'],
      });
    });

    it('should return a callable function', async () => {
      const fn = async (x: number) => x * 2;
      const cached = createCachedFn(fn as any, ['math']);
      const result = await cached(5);
      expect(result).toBe(10);
    });
  });

  describe('CacheDuration', () => {
    it('should have SHORT duration of 30 seconds', () => {
      expect(CacheDuration.SHORT).toBe(30);
    });

    it('should have MEDIUM duration of 60 seconds', () => {
      expect(CacheDuration.MEDIUM).toBe(60);
    });

    it('should have LONG duration of 300 seconds', () => {
      expect(CacheDuration.LONG).toBe(300);
    });

    it('should have EXTRA_LONG duration of 600 seconds', () => {
      expect(CacheDuration.EXTRA_LONG).toBe(600);
    });

    it('should have INFINITE as false for no automatic revalidation', () => {
      expect(CacheDuration.INFINITE).toBe(false);
    });
  });

  describe('CacheTags', () => {
    it('should have ANALYTICS tag', () => {
      expect(CacheTags.ANALYTICS).toBe('analytics');
    });

    it('should have CONTENT tag', () => {
      expect(CacheTags.CONTENT).toBe('content');
    });

    it('should have COLLECTIONS tag', () => {
      expect(CacheTags.COLLECTIONS).toBe('collections');
    });

    it('should have USER tag', () => {
      expect(CacheTags.USER).toBe('user');
    });
  });
});
