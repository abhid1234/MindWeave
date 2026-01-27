import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useInfiniteContent } from './useInfiniteContent';

// Mock the server action
vi.mock('@/app/actions/content', () => ({
  getContentAction: vi.fn().mockResolvedValue({
    success: true,
    items: [
      {
        id: '1',
        title: 'Test Item 1',
        type: 'note',
        body: 'Test body',
        tags: [],
        autoTags: [],
        createdAt: new Date('2024-01-01'),
        url: null,
        metadata: null,
        isShared: false,
        shareId: null,
        isFavorite: false,
      },
      {
        id: '2',
        title: 'Test Item 2',
        type: 'link',
        body: null,
        tags: ['tag1'],
        autoTags: [],
        createdAt: new Date('2024-01-02'),
        url: 'https://example.com',
        metadata: null,
        isShared: false,
        shareId: null,
        isFavorite: false,
      },
    ],
    allTags: ['tag1', 'tag2'],
    nextCursor: '2024-01-02T00:00:00.000Z',
    hasMore: true,
  }),
}));

// Mock IntersectionObserver
class MockIntersectionObserver {
  callback: IntersectionObserverCallback;
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

describe('useInfiniteContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial loading state', () => {
    const { result } = renderHook(() => useInfiniteContent());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.items).toEqual([]);
  });

  it('should load items on mount', async () => {
    const { result } = renderHook(() => useInfiniteContent());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.hasMore).toBe(true);
  });

  it('should return all tags', async () => {
    const { result } = renderHook(() => useInfiniteContent());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.allTags).toEqual(['tag1', 'tag2']);
  });

  it('should not load when initialItems are provided', async () => {
    const initialItems = [{
      id: '1',
      title: 'Initial Item',
      type: 'note' as const,
      body: 'Test',
      tags: [],
      autoTags: [],
      createdAt: new Date(),
      url: null,
      metadata: null,
      isShared: false,
      shareId: null,
      isFavorite: false,
    }];

    const { result } = renderHook(() =>
      useInfiniteContent({ initialItems })
    );

    // Should use initial items instead of loading
    expect(result.current.items).toEqual(initialItems);
  });

  it('should provide loadMore function', async () => {
    const { result } = renderHook(() => useInfiniteContent());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.loadMore).toBe('function');
  });

  it('should provide refresh function', async () => {
    const { result } = renderHook(() => useInfiniteContent());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.refresh).toBe('function');
  });

  it('should handle loadMore correctly', async () => {
    const { getContentAction } = await import('@/app/actions/content');

    const { result } = renderHook(() => useInfiniteContent());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Mock second page response
    vi.mocked(getContentAction).mockResolvedValueOnce({
      success: true,
      items: [
        {
          id: '3',
          title: 'Test Item 3',
          type: 'file',
          body: null,
          tags: [],
          autoTags: [],
          createdAt: new Date('2024-01-03'),
          url: null,
          metadata: null,
          isShared: false,
          shareId: null,
          isFavorite: false,
        },
      ],
      allTags: ['tag1', 'tag2', 'tag3'],
      nextCursor: null,
      hasMore: false,
    });

    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(3);
    });
  });
});
