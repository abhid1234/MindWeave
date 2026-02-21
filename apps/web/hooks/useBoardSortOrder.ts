'use client';

import { useCallback, useRef, useState } from 'react';
import { arrayMove } from '@dnd-kit/sortable';

const STORAGE_KEY = 'mindweave-board-sort';

type SortOrderMap = Record<string, string[]>;

function getStoredOrder(): SortOrderMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    return parsed as SortOrderMap;
  } catch {
    return {};
  }
}

function setStoredOrder(order: SortOrderMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function useBoardSortOrder() {
  const [order, setOrder] = useState<SortOrderMap>(getStoredOrder);
  const orderRef = useRef(order);
  orderRef.current = order;

  /**
   * Reconcile stored order with the current set of items:
   * - Remove IDs no longer present
   * - Append new IDs at the end
   * Returns items sorted by persisted order.
   */
  const getOrderedItems = useCallback(
    <T extends { id: string }>(type: string, items: T[]): T[] => {
      const itemMap = new Map(items.map((item) => [item.id, item]));
      const stored = orderRef.current[type] ?? [];

      // Keep only IDs that still exist
      const validStored = stored.filter((id) => itemMap.has(id));
      const validSet = new Set(validStored);

      // Append any new items not yet in stored order
      const newIds = items.filter((item) => !validSet.has(item.id)).map((item) => item.id);
      const finalOrder = [...validStored, ...newIds];

      return finalOrder.map((id) => itemMap.get(id)!);
    },
    [],
  );

  const handleReorder = useCallback((type: string, activeId: string, overId: string, currentIds: string[]) => {
    const oldIndex = currentIds.indexOf(activeId);
    const newIndex = currentIds.indexOf(overId);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(currentIds, oldIndex, newIndex);
    const updated = { ...orderRef.current, [type]: newOrder };
    setStoredOrder(updated);
    setOrder(updated);
  }, []);

  const resetOrder = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setOrder({});
  }, []);

  return { getOrderedItems, handleReorder, resetOrder };
}
