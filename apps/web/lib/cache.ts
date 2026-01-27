import { unstable_cache } from 'next/cache';

/**
 * Create a cached version of an async function using Next.js cache
 *
 * @param fn - The async function to cache
 * @param keyParts - Array of strings that form the cache key
 * @param options - Cache options including revalidate time and tags
 * @returns Cached version of the function
 *
 * @example
 * const getCachedUser = createCachedFn(
 *   async (userId: string) => await fetchUser(userId),
 *   ['user'],
 *   { revalidate: 300, tags: ['user'] }
 * );
 */
export function createCachedFn<T extends (...args: Parameters<T>) => Promise<ReturnType<T>>>(
  fn: T,
  keyParts: string[],
  options: { revalidate?: number | false; tags?: string[] } = {}
): T {
  return unstable_cache(fn, keyParts, {
    revalidate: options.revalidate ?? 60,
    tags: options.tags,
  }) as T;
}

/**
 * Cache duration constants (in seconds)
 */
export const CacheDuration = {
  /** Very short cache - for frequently changing data */
  SHORT: 30,
  /** Standard cache - for moderately changing data */
  MEDIUM: 60,
  /** Long cache - for rarely changing data */
  LONG: 300,
  /** Very long cache - for nearly static data */
  EXTRA_LONG: 600,
  /** No automatic revalidation (manual only) */
  INFINITE: false as const,
} as const;

/**
 * Common cache tag categories
 */
export const CacheTags = {
  ANALYTICS: 'analytics',
  CONTENT: 'content',
  COLLECTIONS: 'collections',
  USER: 'user',
} as const;
