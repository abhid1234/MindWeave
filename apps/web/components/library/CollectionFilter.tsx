'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Folder, Plus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCollectionsAction } from '@/app/actions/collections';
import { CollectionDialog } from './CollectionDialog';

type Collection = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  contentCount: number;
};

export function CollectionFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCollectionId = searchParams.get('collectionId');

  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    setIsLoading(true);
    const result = await getCollectionsAction();
    if (result.success) {
      setCollections(result.collections);
    }
    setIsLoading(false);
  };

  const handleCollectionSelect = (collectionId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (collectionId) {
      params.set('collectionId', collectionId);
    } else {
      params.delete('collectionId');
    }
    router.push(`/dashboard/library?${params.toString()}`);
    setShowDropdown(false);
  };

  const currentCollection = collections.find((c) => c.id === currentCollectionId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Folder className="h-4 w-4" />
        Loading collections...
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2"
        >
          {currentCollection ? (
            <>
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: currentCollection.color || '#6B7280' }}
              />
              {currentCollection.name}
            </>
          ) : (
            <>
              <Folder className="h-4 w-4" />
              All Collections
            </>
          )}
          <ChevronDown className="h-4 w-4 ml-1" />
        </Button>

        {showDropdown && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowDropdown(false)}
            />
            <div className="absolute top-full mt-1 left-0 z-50 min-w-[200px] rounded-lg border bg-popover shadow-lg">
              <div className="p-1">
                <button
                  onClick={() => handleCollectionSelect(null)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md text-left transition-colors ${
                    !currentCollectionId
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-accent'
                  }`}
                >
                  <Folder className="h-4 w-4" />
                  All Collections
                </button>

                {collections.length > 0 && (
                  <div className="my-1 h-px bg-border" />
                )}

                {collections.map((collection) => (
                  <button
                    key={collection.id}
                    onClick={() => handleCollectionSelect(collection.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md text-left transition-colors ${
                      currentCollectionId === collection.id
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-accent'
                    }`}
                  >
                    <div
                      className="w-3 h-3 rounded flex-shrink-0"
                      style={{ backgroundColor: collection.color || '#6B7280' }}
                    />
                    <span className="truncate flex-1">{collection.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {collection.contentCount}
                    </span>
                  </button>
                ))}

                <div className="my-1 h-px bg-border" />

                <button
                  onClick={() => {
                    setShowDropdown(false);
                    setShowCreateDialog(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md text-left hover:bg-accent"
                >
                  <Plus className="h-4 w-4" />
                  New Collection
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <CollectionDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={loadCollections}
      />
    </>
  );
}
