'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getCollectionsAction, bulkMoveToCollectionAction } from '@/app/actions/collections';
import { useToast } from '@/components/ui/toast';

type Collection = {
  id: string;
  name: string;
};

type MoveCollectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentIds: string[];
  onSuccess?: () => void;
};

export function MoveCollectionDialog({
  open,
  onOpenChange,
  contentIds,
  onSuccess,
}: MoveCollectionDialogProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    if (!open) return;
    setIsLoading(true);
    getCollectionsAction().then((result) => {
      if (result.success) {
        setCollections(result.collections.map((c) => ({ id: c.id, name: c.name })));
      }
      setIsLoading(false);
    });
  }, [open]);

  const handleMove = async () => {
    if (!fromId || !toId) {
      addToast({ variant: 'warning', title: 'Select both collections' });
      return;
    }
    if (fromId === toId) {
      addToast({ variant: 'warning', title: 'Source and destination must be different' });
      return;
    }

    setIsMoving(true);
    try {
      const result = await bulkMoveToCollectionAction(contentIds, fromId, toId);
      if (result.success) {
        addToast({ variant: 'success', title: 'Moved', description: result.message });
        onOpenChange(false);
        setFromId('');
        setToId('');
        onSuccess?.();
      } else {
        addToast({ variant: 'error', title: 'Move failed', description: result.message });
      }
    } catch {
      addToast({ variant: 'error', title: 'Move failed', description: 'An unexpected error occurred.' });
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move to Collection</DialogTitle>
          <DialogDescription>
            Move {contentIds.length} item{contentIds.length !== 1 ? 's' : ''} from one collection to another.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : collections.length < 2 ? (
          <p className="text-sm text-muted-foreground py-4">
            You need at least 2 collections to move content between them.
          </p>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-muted-foreground mb-1">From</label>
              <select
                value={fromId}
                onChange={(e) => setFromId(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                data-testid="from-collection-select"
              >
                <option value="">Select...</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground mt-5" />
            <div className="flex-1">
              <label className="block text-xs font-medium text-muted-foreground mb-1">To</label>
              <select
                value={toId}
                onChange={(e) => setToId(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                data-testid="to-collection-select"
              >
                <option value="">Select...</option>
                {collections.filter((c) => c.id !== fromId).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col-reverse sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isMoving}>
            Cancel
          </Button>
          <Button onClick={handleMove} disabled={isMoving || !fromId || !toId || fromId === toId}>
            {isMoving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Moving...
              </>
            ) : (
              'Move'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
