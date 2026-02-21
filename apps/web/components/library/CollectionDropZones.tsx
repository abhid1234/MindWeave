'use client';

import { useEffect, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { getCollectionsAction } from '@/app/actions/collections';

type Collection = {
  id: string;
  name: string;
  color: string | null;
};

type CollectionDropZonesProps = {
  isDragging: boolean;
  overCollectionId: string | null;
};

function CollectionZone({
  collection,
  isOver,
}: {
  collection: Collection;
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({
    id: `collection-${collection.id}`,
    data: {
      type: 'collection',
      collectionId: collection.id,
      collectionName: collection.name,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all ${
        isOver
          ? 'border-primary bg-primary/10 scale-105'
          : 'border-dashed border-muted-foreground/30'
      }`}
    >
      <span
        className="h-3 w-3 rounded-full shrink-0"
        style={{ backgroundColor: collection.color || '#6b7280' }}
        aria-hidden="true"
      />
      <span className="whitespace-nowrap">{collection.name}</span>
    </div>
  );
}

export function CollectionDropZones({ isDragging, overCollectionId }: CollectionDropZonesProps) {
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    let cancelled = false;
    getCollectionsAction().then((result) => {
      if (!cancelled && result.success) {
        setCollections(
          result.collections.map((c) => ({
            id: c.id,
            name: c.name,
            color: c.color,
          })),
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isDragging) return null;

  if (collections.length === 0) {
    return (
      <div className="mb-4 animate-in slide-in-from-top-2 duration-200">
        <p className="text-sm text-muted-foreground text-center py-2">
          Create a collection to organize by drag
        </p>
      </div>
    );
  }

  return (
    <div className="mb-4 animate-in slide-in-from-top-2 duration-200">
      <p className="text-xs text-muted-foreground mb-2">Drop on a collection:</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {collections.map((collection) => (
          <CollectionZone
            key={collection.id}
            collection={collection}
            isOver={overCollectionId === collection.id}
          />
        ))}
      </div>
    </div>
  );
}
