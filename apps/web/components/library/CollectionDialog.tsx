'use client';

import { useState, useEffect } from 'react';
import { Folder, Palette } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { createCollectionAction, updateCollectionAction } from '@/app/actions/collections';

type CollectionData = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
};

type CollectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection?: CollectionData | null;
  onSuccess?: () => void;
};

const PRESET_COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#EAB308', // yellow
  '#22C55E', // green
  '#06B6D4', // cyan
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#EC4899', // pink
];

export function CollectionDialog({
  open,
  onOpenChange,
  collection,
  onSuccess,
}: CollectionDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!collection;

  useEffect(() => {
    if (collection) {
      setName(collection.name);
      setDescription(collection.description || '');
      setColor(collection.color);
    } else {
      setName('');
      setDescription('');
      setColor(null);
    }
    setError(null);
  }, [collection, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = isEditing
        ? await updateCollectionAction(collection.id, { name, description, color })
        : await createCollectionAction({ name, description, color: color || undefined });

      if (result.success) {
        onOpenChange(false);
        onSuccess?.();
      } else {
        setError(result.message);
      }
    } catch {
      setError('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            {isEditing ? 'Edit Collection' : 'Create Collection'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update your collection details.'
              : 'Create a new collection to organize your content.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Collection"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
              maxLength={100}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of this collection..."
              rows={2}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              <span className="flex items-center gap-1">
                <Palette className="h-4 w-4" />
                Color
              </span>
            </label>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setColor(null)}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                  color === null
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-input hover:border-primary/50'
                }`}
                title="No color"
              >
                <span className="text-xs text-muted-foreground">—</span>
              </button>
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  onClick={() => setColor(presetColor)}
                  className={`w-8 h-8 rounded-full border-2 ${
                    color === presetColor
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-transparent hover:border-primary/50'
                  }`}
                  style={{ backgroundColor: presetColor }}
                  title={presetColor}
                />
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 rounded-lg p-3">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting
                ? isEditing
                  ? 'Saving...'
                  : 'Creating...'
                : isEditing
                  ? 'Save Changes'
                  : 'Create Collection'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
