'use client';

import { CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBulkSelection } from './BulkSelectionContext';

type SelectionToggleProps = {
  allIds: string[];
};

export function SelectionToggle({ allIds }: SelectionToggleProps) {
  const { isSelectionMode, toggleSelectionMode, selectedIds, selectAll, deselectAll } =
    useBulkSelection();

  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));

  const handleSelectAllToggle = () => {
    if (allSelected) {
      deselectAll();
    } else {
      selectAll(allIds);
    }
  };

  if (!isSelectionMode) {
    return (
      <Button variant="outline" size="sm" onClick={toggleSelectionMode}>
        <CheckSquare className="mr-2 h-4 w-4" />
        Select
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleSelectAllToggle}>
        {allSelected ? (
          <>
            <CheckSquare className="mr-2 h-4 w-4" />
            Deselect All
          </>
        ) : (
          <>
            <Square className="mr-2 h-4 w-4" />
            Select All
          </>
        )}
      </Button>
      <span className="text-sm text-muted-foreground">
        Selection mode active
      </span>
    </div>
  );
}
