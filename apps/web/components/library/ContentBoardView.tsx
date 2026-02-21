'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  pointerWithin,
  closestCenter,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  type CollisionDetection,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import type { ContentType } from '@/lib/db/schema';
import { ContentCard } from './ContentCard';
import { SortableContentCard } from './SortableContentCard';
import { CollectionDropZones } from './CollectionDropZones';
import { useBulkSelection } from './BulkSelectionContext';
import { useBoardSortOrder } from '@/hooks/useBoardSortOrder';
import { useToast } from '@/components/ui/toast';
import { addToCollectionAction } from '@/app/actions/collections';

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

type ContentBoardViewProps = {
  items: ContentItem[];
  allTags: string[];
};

const columns: { type: ContentType; label: string; colorClass: string }[] = [
  { type: 'note', label: 'Notes', colorClass: 'bg-note/10 text-note dark:bg-note/20' },
  { type: 'link', label: 'Links', colorClass: 'bg-link/10 text-link dark:bg-link/20' },
  { type: 'file', label: 'Files', colorClass: 'bg-file/10 text-file dark:bg-file/20' },
];

// Check collection zones first (pointerWithin), fall back to closestCenter for sortable items
const collisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  const collectionHit = pointerCollisions.find((c) => String(c.id).startsWith('collection-'));
  if (collectionHit) return [collectionHit];
  return closestCenter(args);
};

export function ContentBoardView({ items, allTags }: ContentBoardViewProps) {
  const { isSelectionMode } = useBulkSelection();
  const { getOrderedItems, handleReorder } = useBoardSortOrder();
  const { addToast } = useToast();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<ContentItem | null>(null);
  const [overCollectionId, setOverCollectionId] = useState<string | null>(null);

  const grouped = useMemo(() => ({
    note: getOrderedItems('note', items.filter((item) => item.type === 'note')),
    link: getOrderedItems('link', items.filter((item) => item.type === 'link')),
    file: getOrderedItems('file', items.filter((item) => item.type === 'file')),
  }), [items, getOrderedItems]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    const item = active.data.current?.item as ContentItem | undefined;
    setActiveItem(item ?? null);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    if (over && String(over.id).startsWith('collection-')) {
      const collectionId = over.data.current?.collectionId as string | undefined;
      setOverCollectionId(collectionId ?? null);
    } else {
      setOverCollectionId(null);
    }
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveId(null);
      setActiveItem(null);
      setOverCollectionId(null);

      if (!over) return;

      // Dropped on a collection zone
      if (String(over.id).startsWith('collection-')) {
        const collectionId = over.data.current?.collectionId as string;
        const collectionName = over.data.current?.collectionName as string;
        const contentId = active.id as string;

        const result = await addToCollectionAction(contentId, collectionId);
        if (result.success) {
          addToast({ variant: 'success', title: `Added to ${collectionName}` });
        } else {
          addToast({ variant: 'warning', title: result.message });
        }
        return;
      }

      // Dropped on another card in the same column — reorder
      if (active.id !== over.id) {
        const activeType = active.data.current?.item?.type as ContentType | undefined;
        const overType = over.data.current?.item?.type as ContentType | undefined;

        if (activeType && activeType === overType) {
          const columnItems = grouped[activeType];
          const currentIds = columnItems.map((i) => i.id);
          handleReorder(activeType, active.id as string, over.id as string, currentIds);
        }
      }
    },
    [grouped, handleReorder, addToast],
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setActiveItem(null);
    setOverCollectionId(null);
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <CollectionDropZones isDragging={!!activeId} overCollectionId={overCollectionId} />

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(({ type, label, colorClass }) => {
          const columnItems = grouped[type];
          const itemIds = columnItems.map((item) => item.id);

          return (
            <div key={type} className="flex-shrink-0 w-80 lg:flex-1 min-w-[280px]">
              {/* Column header */}
              <div className="mb-3 flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>
                  {label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {columnItems.length}
                </span>
              </div>

              {/* Column body */}
              <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {columnItems.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center">
                      <p className="text-sm text-muted-foreground">No {label.toLowerCase()}</p>
                    </div>
                  ) : (
                    columnItems.map((item, index) => (
                      <div
                        key={item.id}
                        className="animate-in fade-in-50 slide-in-from-bottom-4 duration-300"
                        style={{ animationDelay: `${Math.min(index * 50, 300)}ms`, animationFillMode: 'backwards' }}
                      >
                        <SortableContentCard
                          item={item}
                          allTags={allTags}
                          disabled={isSelectionMode}
                        />
                      </div>
                    ))
                  )}
                </div>
              </SortableContext>
            </div>
          );
        })}
      </div>

      <DragOverlay>
        {activeItem && (
          <div className="rotate-2 shadow-xl opacity-90">
            <ContentCard {...activeItem} allTags={allTags} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
