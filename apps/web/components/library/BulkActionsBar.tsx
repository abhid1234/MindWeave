'use client';

import { useState, useTransition } from 'react';
import { X, Trash2, Share2, Tag, Lock, Download, FolderPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useBulkSelection } from './BulkSelectionContext';
import { ExportDialog } from './ExportDialog';
import { CollectionSelector } from './CollectionSelector';
import {
  bulkDeleteContentAction,
  bulkAddTagsAction,
  bulkShareContentAction,
  bulkUnshareContentAction,
} from '@/app/actions/content';

export function BulkActionsBar() {
  const { selectedIds, deselectAll, toggleSelectionMode } = useBulkSelection();
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const { addToast } = useToast();

  const selectedCount = selectedIds.size;

  if (selectedCount === 0) {
    return null;
  }

  const handleBulkDelete = () => {
    startTransition(async () => {
      const result = await bulkDeleteContentAction(Array.from(selectedIds));
      if (result.success) {
        addToast({ variant: 'success', title: 'Deleted', description: result.message });
        deselectAll();
        toggleSelectionMode();
      } else {
        addToast({ variant: 'error', title: 'Delete failed', description: result.message });
      }
      setShowDeleteDialog(false);
    });
  };

  const handleBulkShare = () => {
    startTransition(async () => {
      const result = await bulkShareContentAction(Array.from(selectedIds));
      if (result.success) {
        addToast({ variant: 'success', title: 'Shared', description: result.message });
      } else {
        addToast({ variant: 'error', title: 'Share failed', description: result.message });
      }
    });
  };

  const handleBulkUnshare = () => {
    startTransition(async () => {
      const result = await bulkUnshareContentAction(Array.from(selectedIds));
      if (result.success) {
        addToast({ variant: 'success', title: 'Unshared', description: result.message });
      } else {
        addToast({ variant: 'error', title: 'Unshare failed', description: result.message });
      }
    });
  };

  const handleBulkAddTags = () => {
    const tags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (tags.length === 0) {
      addToast({ variant: 'warning', title: 'No tags', description: 'Please enter at least one tag.' });
      return;
    }

    startTransition(async () => {
      const result = await bulkAddTagsAction(Array.from(selectedIds), tags);
      if (result.success) {
        addToast({ variant: 'success', title: 'Tags added', description: result.message });
        setTagInput('');
        setShowTagDialog(false);
      } else {
        addToast({ variant: 'error', title: 'Failed', description: result.message });
      }
    });
  };

  const handleCancel = () => {
    deselectAll();
    toggleSelectionMode();
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card shadow-lg animate-in slide-in-from-bottom-full duration-300">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={isPending}
              >
                <X className="mr-1 h-4 w-4" />
                Cancel
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTagDialog(true)}
                disabled={isPending}
              >
                <Tag className="mr-2 h-4 w-4" />
                Add Tags
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCollectionDialog(true)}
                disabled={isPending}
              >
                <FolderPlus className="mr-2 h-4 w-4" />
                Add to Collection
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkShare}
                disabled={isPending}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share All
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkUnshare}
                disabled={isPending}
              >
                <Lock className="mr-2 h-4 w-4" />
                Unshare All
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExportDialog(true)}
                disabled={isPending}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedCount} Items?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedCount} item
              {selectedCount !== 1 ? 's' : ''}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isPending}
            >
              {isPending ? 'Deleting...' : 'Delete All'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Tags Dialog */}
      <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tags to {selectedCount} Items</DialogTitle>
            <DialogDescription>
              Enter tags separated by commas. These tags will be added to all
              selected items.
            </DialogDescription>
          </DialogHeader>
          <div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="tag1, tag2, tag3"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTagDialog(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleBulkAddTags} disabled={isPending}>
              {isPending ? 'Adding...' : 'Add Tags'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        contentIds={Array.from(selectedIds)}
        itemCount={selectedCount}
      />

      {/* Collection Selector Dialog */}
      <CollectionSelector
        open={showCollectionDialog}
        onOpenChange={setShowCollectionDialog}
        contentIds={Array.from(selectedIds)}
        onSuccess={() => {
          addToast({ variant: 'success', title: 'Added to collection', description: 'Content added to collection successfully.' });
        }}
      />
    </>
  );
}
