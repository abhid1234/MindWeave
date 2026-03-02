'use client';

import { useState, useEffect } from 'react';
import { Store } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { publishToMarketplaceAction } from '@/app/actions/marketplace';
import type { MarketplaceCategory } from '@/lib/db/schema';

const CATEGORIES: { value: MarketplaceCategory; label: string; description: string }[] = [
  { value: 'programming', label: 'Programming', description: 'Code, tutorials, dev resources' },
  { value: 'design', label: 'Design', description: 'UI/UX, graphics, inspiration' },
  { value: 'business', label: 'Business', description: 'Strategy, marketing, finance' },
  { value: 'science', label: 'Science', description: 'Research, papers, discoveries' },
  { value: 'learning', label: 'Learning', description: 'Courses, study materials, guides' },
  { value: 'productivity', label: 'Productivity', description: 'Tools, workflows, systems' },
  { value: 'career', label: 'Career', description: 'Jobs, skills, growth' },
  { value: 'health', label: 'Health', description: 'Fitness, wellness, nutrition' },
  { value: 'other', label: 'Other', description: 'Everything else' },
];

interface PublishToMarketplaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionId: string;
  collectionName: string;
  onSuccess?: () => void;
}

export function PublishToMarketplaceDialog({
  open,
  onOpenChange,
  collectionId,
  collectionName,
  onSuccess,
}: PublishToMarketplaceDialogProps) {
  const [category, setCategory] = useState<MarketplaceCategory>('other');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setCategory('other');
      setDescription('');
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await publishToMarketplaceAction({
        collectionId,
        category,
        description: description.trim() || undefined,
      });

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
            <Store className="h-5 w-5" />
            Publish to Marketplace
          </DialogTitle>
          <DialogDescription>
            Share &quot;{collectionName}&quot; with the community. Others can discover and clone it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`rounded-lg border p-2 text-left text-xs transition-all ${
                    category === cat.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-input hover:border-primary/50'
                  }`}
                  title={cat.description}
                >
                  <div className="font-medium">{cat.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="marketplace-description" className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              id="marketplace-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell others what makes this collection useful..."
              rows={3}
              maxLength={1000}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
            <p className="mt-1 text-xs text-muted-foreground text-right">
              {description.length}/1000
            </p>
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Publishing...' : 'Publish'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
