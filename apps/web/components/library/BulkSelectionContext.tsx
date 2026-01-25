'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type BulkSelectionContextType = {
  selectedIds: Set<string>;
  isSelectionMode: boolean;
  toggleSelectionMode: () => void;
  toggleSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  deselectAll: () => void;
  isSelected: (id: string) => boolean;
};

const BulkSelectionContext = createContext<BulkSelectionContextType | null>(null);

export function BulkSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode((prev) => {
      if (prev) {
        // Exiting selection mode, clear selections
        setSelectedIds(new Set());
      }
      return !prev;
    });
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  return (
    <BulkSelectionContext.Provider
      value={{
        selectedIds,
        isSelectionMode,
        toggleSelectionMode,
        toggleSelection,
        selectAll,
        deselectAll,
        isSelected,
      }}
    >
      {children}
    </BulkSelectionContext.Provider>
  );
}

export function useBulkSelection() {
  const context = useContext(BulkSelectionContext);
  if (!context) {
    throw new Error('useBulkSelection must be used within a BulkSelectionProvider');
  }
  return context;
}
