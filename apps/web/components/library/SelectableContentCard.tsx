'use client';

import { Check } from 'lucide-react';
import { ContentCard, type ContentCardProps } from './ContentCard';
import { useBulkSelection } from './BulkSelectionContext';

type SelectableContentCardProps = ContentCardProps;

export function SelectableContentCard(props: SelectableContentCardProps) {
  const { isSelectionMode, toggleSelection, isSelected } = useBulkSelection();
  const selected = isSelected(props.id);

  const handleClick = (e: React.MouseEvent) => {
    if (isSelectionMode) {
      e.preventDefault();
      e.stopPropagation();
      toggleSelection(props.id);
    }
  };

  if (!isSelectionMode) {
    return <ContentCard {...props} />;
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleSelection(props.id);
        }
      }}
      className={`relative cursor-pointer rounded-lg transition-all ${
        selected
          ? 'ring-2 ring-primary ring-offset-2'
          : 'hover:ring-2 hover:ring-muted hover:ring-offset-2'
      }`}
    >
      {/* Selection indicator */}
      <div
        className={`absolute -left-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full transition-all ${
          selected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
        }`}
      >
        {selected ? (
          <Check className="h-4 w-4" />
        ) : (
          <span className="h-3 w-3 rounded-full border-2 border-current" />
        )}
      </div>

      {/* Disable pointer events on the card content */}
      <div className="pointer-events-none">
        <ContentCard {...props} />
      </div>
    </div>
  );
}
