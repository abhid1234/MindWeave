'use client';

import { useState, useEffect, useCallback } from 'react';
import { Folder, Plus, Check, FolderPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  getCollectionsAction,
  getContentCollectionsAction,
  addToCollectionAction,
  removeFromCollectionAction,
  bulkAddToCollectionAction,
} from '@/app/actions/collections';
import { CollectionDialog } from './CollectionDialog';

type Collection = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  contentCount: number;
};

type CollectionSelectorProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentId?: string;
  contentIds?: string[];
  onSuccess?: () => void;
};

export function CollectionSelector({
  open,
  onOpenChange,
  contentId,
  contentIds,
  onSuccess,
}: CollectionSelectorProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [originalIds, setOriginalIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const isBulkMode = !!contentIds && contentIds.length > 0;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const collectionsResult = await getCollectionsAction();
      if (collectionsResult.success) {
        setCollections(collectionsResult.collections);
      }

      // For single content, load current collections
      if (contentId && !isBulkMode) {
        const contentResult = await getContentCollectionsAction(contentId);
        if (contentResult.success) {
          setSelectedIds(new Set(contentResult.collectionIds));
          setOriginalIds(new Set(contentResult.collectionIds));
        }
      } else {
        setSelectedIds(new Set());
        setOriginalIds(new Set());
      }
    } catch {
      setError('Failed to load collections');
    } finally {
      setIsLoading(false);
    }
  }, [contentId, isBulkMode]);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, loadData]);

  const toggleCollection = (collectionId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(collectionId)) {
        next.delete(collectionId);
      } else {
        next.add(collectionId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      if (isBulkMode && contentIds) {
        // Bulk mode: add all selected content to selected collections
        for (const collectionId of selectedIds) {
          await bulkAddToCollectionAction(contentIds, collectionId);
        }
      } else if (contentId) {
        // Single mode: sync collections (add new, remove old)
        const toAdd = [...selectedIds].filter((id) => !originalIds.has(id));
        const toRemove = [...originalIds].filter((id) => !selectedIds.has(id));

        for (const collectionId of toAdd) {
          await addToCollectionAction(contentId, collectionId);
        }
        for (const collectionId of toRemove) {
          await removeFromCollectionAction(contentId, collectionId);
        }
      }

      onOpenChange(false);
      onSuccess?.();
    } catch {
      setError('Failed to update collections');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSuccess = () => {
    loadData();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              {isBulkMode
                ? `Add ${contentIds?.length} items to Collections`
                : 'Manage Collections'}
            </DialogTitle>
            <DialogDescription>
              {isBulkMode
                ? 'Select collections to add the selected items to.'
                : 'Select which collections this content belongs to.'}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[300px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : collections.length === 0 ? (
              <div className="text-center py-8">
                <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-4">No collections yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Create Collection
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {collections.map((collection) => (
                  <button
                    key={collection.id}
                    type="button"
                    onClick={() => toggleCollection(collection.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                      selectedIds.has(collection.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-input hover:border-primary/50'
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded flex-shrink-0"
                      style={{
                        backgroundColor: collection.color || '#6B7280',
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{collection.name}</p>
                      {collection.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {collection.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {collection.contentCount} item
                        {collection.contentCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {selectedIds.has(collection.id) && (
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 rounded-lg p-3">
              {error}
            </p>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {collections.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateDialog(true)}
                className="sm:mr-auto"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Collection
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isLoading}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CollectionDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
}
