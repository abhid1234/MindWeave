import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBoardSortOrder } from './useBoardSortOrder';

const STORAGE_KEY = 'mindweave-board-sort';

describe('useBoardSortOrder', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should return items in original order when no stored order exists', () => {
    const { result } = renderHook(() => useBoardSortOrder());
    const items = [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
      { id: 'c', name: 'C' },
    ];

    const ordered = result.current.getOrderedItems('note', items);
    expect(ordered.map((i) => i.id)).toEqual(['a', 'b', 'c']);
  });

  it('should return items in stored order', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ note: ['c', 'a', 'b'] }));
    const { result } = renderHook(() => useBoardSortOrder());
    const items = [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
      { id: 'c', name: 'C' },
    ];

    const ordered = result.current.getOrderedItems('note', items);
    expect(ordered.map((i) => i.id)).toEqual(['c', 'a', 'b']);
  });

  it('should append new items at the end of stored order', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ note: ['b', 'a'] }));
    const { result } = renderHook(() => useBoardSortOrder());
    const items = [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
      { id: 'c', name: 'C' },
    ];

    const ordered = result.current.getOrderedItems('note', items);
    expect(ordered.map((i) => i.id)).toEqual(['b', 'a', 'c']);
  });

  it('should prune removed items from stored order', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ note: ['c', 'b', 'a'] }));
    const { result } = renderHook(() => useBoardSortOrder());
    const items = [
      { id: 'a', name: 'A' },
      { id: 'c', name: 'C' },
    ];

    const ordered = result.current.getOrderedItems('note', items);
    expect(ordered.map((i) => i.id)).toEqual(['c', 'a']);
  });

  it('should handle reorder and persist to localStorage', () => {
    const { result } = renderHook(() => useBoardSortOrder());

    act(() => {
      result.current.handleReorder('note', 'a', 'c', ['a', 'b', 'c']);
    });

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.note).toEqual(['b', 'c', 'a']);
  });

  it('should handle reorder with invalid indices gracefully', () => {
    const { result } = renderHook(() => useBoardSortOrder());

    act(() => {
      result.current.handleReorder('note', 'x', 'y', ['a', 'b', 'c']);
    });

    // Nothing should be stored since IDs don't exist
    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).toBeNull();
  });

  it('should reset stored order', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ note: ['c', 'b', 'a'] }));
    const { result } = renderHook(() => useBoardSortOrder());

    act(() => {
      result.current.resetOrder();
    });

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('should handle corrupted localStorage gracefully', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json');
    const { result } = renderHook(() => useBoardSortOrder());
    const items = [{ id: 'a', name: 'A' }];

    const ordered = result.current.getOrderedItems('note', items);
    expect(ordered.map((i) => i.id)).toEqual(['a']);
  });

  it('should handle localStorage with array value gracefully', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['not', 'an', 'object']));
    const { result } = renderHook(() => useBoardSortOrder());
    const items = [{ id: 'a', name: 'A' }];

    const ordered = result.current.getOrderedItems('note', items);
    expect(ordered.map((i) => i.id)).toEqual(['a']);
  });

  it('should return empty array for empty items', () => {
    const { result } = renderHook(() => useBoardSortOrder());
    const ordered = result.current.getOrderedItems('note', []);
    expect(ordered).toEqual([]);
  });

  it('should keep different types separate', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ note: ['b', 'a'], link: ['d', 'c'] }));
    const { result } = renderHook(() => useBoardSortOrder());

    const notes = [{ id: 'a' }, { id: 'b' }];
    const links = [{ id: 'c' }, { id: 'd' }];

    expect(result.current.getOrderedItems('note', notes).map((i) => i.id)).toEqual(['b', 'a']);
    expect(result.current.getOrderedItems('link', links).map((i) => i.id)).toEqual(['d', 'c']);
  });
});
