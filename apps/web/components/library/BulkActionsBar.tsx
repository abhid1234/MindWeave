'use client';

import { useState, useTransition } from 'react';
import { X, Trash2, Share2, Tag, Lock, Download, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const selectedCount = selectedIds.size;

  if (selectedCount === 0) {
    return null;
  }

  const handleBulkDelete = () => {
    startTransition(async () => {
      const result = await bulkDeleteContentAction(Array.from(selectedIds));
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        deselectAll();
        toggleSelectionMode();
      } else {
        setMessage({ type: 'error', text: result.message });
      }
      setShowDeleteDialog(false);
    });
  };

  const handleBulkShare = () => {
    startTransition(async () => {
      const result = await bulkShareContentAction(Array.from(selectedIds));
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    });
  };

  const handleBulkUnshare = () => {
    startTransition(async () => {
      const result = await bulkUnshareContentAction(Array.from(selectedIds));
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    });
  };

  const handleBulkAddTags = () => {
    const tags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (tags.length === 0) {
      setMessage({ type: 'error', text: 'Please enter at least one tag.' });
      return;
    }

    startTransition(async () => {
      const result = await bulkAddTagsAction(Array.from(selectedIds), tags);
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setTagInput('');
        setShowTagDialog(false);
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    });
  };

  const handleCancel = () => {
    deselectAll();
    toggleSelectionMode();
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card shadow-lg">
        <div className="mx-auto max-w-6xl px-4 py-3">
          {message && (
            <div
              className={`mb-3 rounded-lg p-3 text-sm ${
                message.type === 'success'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}
            >
              {message.text}
              <button
                onClick={() => setMessage(null)}
                className="ml-2 font-medium hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

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
                <Trash2 className="mr-2 h-4 w-4" />
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
          setMessage({ type: 'success', text: 'Added to collection' });
        }}
      />
    </>
  );
}
