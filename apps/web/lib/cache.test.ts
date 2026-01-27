import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CacheDuration, CacheTags } from './cache';

// Mock next/cache
vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((fn, _keyParts, _options) => fn),
  revalidateTag: vi.fn(),
}));

describe('Cache utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
