'use client';

import { useState, useEffect } from 'react';
import { Lightbulb } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { publishTilAction } from '@/app/actions/til';

interface PublishTilDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentId: string;
  contentTitle: string;
  contentBody?: string | null;
  contentTags?: string[];
  onSuccess?: () => void;
}

export function PublishTilDialog({
  open,
  onOpenChange,
  contentId,
  contentTitle,
  contentBody,
  contentTags,
  onSuccess,
}: PublishTilDialogProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle(contentTitle.slice(0, 200));
      setBody((contentBody || '').slice(0, 5000));
      setTagsInput((contentTags || []).slice(0, 10).join(', '));
      setError(null);
    }
  }, [open, contentTitle, contentBody, contentTags]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 10);

      const result = await publishTilAction({
        contentId,
        title: title.trim(),
        body: body.trim() || undefined,
        tags,
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
            <Lightbulb className="h-5 w-5" />
            Share as TIL
          </DialogTitle>
          <DialogDescription>
            Share this learning with the community on the TIL feed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="til-title" className="block text-sm font-medium mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="til-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="TIL: Something interesting..."
              maxLength={200}
              required
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <p className="mt-1 text-xs text-muted-foreground text-right">
              {title.length}/200
            </p>
          </div>

          <div>
            <label htmlFor="til-body" className="block text-sm font-medium mb-1">
              Body
            </label>
            <textarea
              id="til-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="A brief explanation of what you learned..."
              rows={4}
              maxLength={5000}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
            <p className="mt-1 text-xs text-muted-foreground text-right">
              {body.length}/5000
            </p>
          </div>

          <div>
            <label htmlFor="til-tags" className="block text-sm font-medium mb-1">
              Tags
            </label>
            <input
              id="til-tags"
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="react, hooks, typescript (comma separated)"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Max 10 tags, comma separated
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
            <Button type="submit" disabled={isSubmitting || !title.trim()}>
              {isSubmitting ? 'Publishing...' : 'Publish TIL'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
