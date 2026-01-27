'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { getContentAction, type ContentItem, type GetContentParams } from '@/app/actions/content';

export type UseInfiniteContentOptions = Omit<GetContentParams, 'cursor' | 'limit'> & {
  pageSize?: number;
  initialItems?: ContentItem[];
  initialCursor?: string | null;
  initialHasMore?: boolean;
};

export type UseInfiniteContentResult = {
  items: ContentItem[];
  allTags: string[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  loadMoreRef: React.RefObject<HTMLDivElement | null>;
};

export function useInfiniteContent(options: UseInfiniteContentOptions = {}): UseInfiniteContentResult {
  const {
    pageSize = 20,
    initialItems = [],
    initialCursor = null,
    initialHasMore = true,
    ...queryOptions
  } = options;

  const [items, setItems] = useState<ContentItem[]>(initialItems);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(initialItems.length === 0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isLoadingRef = useRef(false);

  // Serialize options for dependency tracking
  const optionsKey = JSON.stringify(queryOptions);

  // Initial load
  useEffect(() => {
    if (initialItems.length > 0) {
      return; // Skip initial load if we have items
    }

    let cancelled = false;

    const loadInitial = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getContentAction({
          ...queryOptions,
          limit: pageSize,
        });

        if (cancelled) return;

        if (result.success) {
          setItems(result.items);
          setAllTags(result.allTags);
          setCursor(result.nextCursor ?? null);
          setHasMore(result.hasMore ?? false);
        } else {
          setError('Failed to load content');
        }
      } catch (err) {
        if (!cancelled) {
          setError('An error occurred while loading content');
          console.error('useInfiniteContent error:', err);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadInitial();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsKey, pageSize]);

  // Load more function
  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMore || !cursor) return;

    isLoadingRef.current = true;
    setIsLoadingMore(true);
    setError(null);

    try {
      const result = await getContentAction({
        ...queryOptions,
        cursor,
        limit: pageSize,
      });

      if (result.success) {
        setItems(prev => [...prev, ...result.items]);
        setCursor(result.nextCursor ?? null);
        setHasMore(result.hasMore ?? false);
        // Update allTags if we get new ones
        if (result.allTags.length > 0) {
          setAllTags(result.allTags);
        }
      } else {
        setError('Failed to load more content');
      }
    } catch (err) {
      setError('An error occurred while loading more content');
      console.error('useInfiniteContent loadMore error:', err);
    } finally {
      setIsLoadingMore(false);
      isLoadingRef.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, hasMore, optionsKey, pageSize]);

  // Refresh function - reloads from the beginning
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setCursor(null);

    try {
      const result = await getContentAction({
        ...queryOptions,
        limit: pageSize,
      });

      if (result.success) {
        setItems(result.items);
        setAllTags(result.allTags);
        setCursor(result.nextCursor ?? null);
        setHasMore(result.hasMore ?? false);
      } else {
        setError('Failed to refresh content');
      }
    } catch (err) {
      setError('An error occurred while refreshing content');
      console.error('useInfiniteContent refresh error:', err);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsKey, pageSize]);

  // Intersection Observer for automatic loading
  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoadingRef.current) {
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: '100px', // Start loading before the element is visible
        threshold: 0.1,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadMore]);

  return {
    items,
    allTags,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
    loadMoreRef,
  };
}
