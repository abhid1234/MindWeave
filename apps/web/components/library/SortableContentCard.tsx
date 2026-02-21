'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ContentType } from '@/lib/db/schema';
import { SelectableContentCard } from './SelectableContentCard';

type ContentItem = {
  id: string;
  type: ContentType;
  title: string;
  body: string | null;
  url: string | null;
  tags: string[];
  autoTags: string[];
  createdAt: Date;
  metadata: {
    fileType?: string;
    fileSize?: number;
    filePath?: string;
    fileName?: string;
    [key: string]: unknown;
  } | null;
  isShared: boolean;
  shareId: string | null;
  isFavorite: boolean;
  summary?: string | null;
};

type SortableContentCardProps = {
  item: ContentItem;
  allTags: string[];
  disabled: boolean;
};

export function SortableContentCard({ item, allTags, disabled }: SortableContentCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled,
    data: {
      type: 'content-card',
      item,
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${disabled ? '' : 'touch-none cursor-grab active:cursor-grabbing'}`}
      {...attributes}
      {...listeners}
    >
      <SelectableContentCard {...item} allTags={allTags} />
    </div>
  );
}
