'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { updateContentAction } from '@/app/actions/content';
import type { ContentType } from '@/lib/db/schema';

export type ContentEditDialogProps = {
  content: {
    id: string;
    type: ContentType;
    title: string;
    body: string | null;
    url: string | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
};

export function ContentEditDialog({
  content,
  open,
  onOpenChange,
  onUpdated,
}: ContentEditDialogProps) {
  const [title, setTitle] = useState(content.title);
  const [body, setBody] = useState(content.body || '');
  const [url, setUrl] = useState(content.url || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Reset form state when dialog opens or content changes
  useEffect(() => {
    if (open) {
      setTitle(content.title);
      setBody(content.body || '');
      setUrl(content.url || '');
      setErrors({});
      setGeneralError(null);
    }
  }, [open, content.title, content.body, content.url]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setGeneralError(null);

    try {
      const result = await updateContentAction({
        contentId: content.id,
        title,
        body: body || undefined,
        url: content.type === 'link' ? url || undefined : undefined,
      });

      if (result.success) {
        onOpenChange(false);
        onUpdated?.();
      } else {
        if (result.errors) {
          setErrors(result.errors as Record<string, string[]>);
        } else {
          setGeneralError(result.message);
        }
      }
    } catch {
      setGeneralError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      // Reset form state when opening
      if (newOpen) {
        setTitle(content.title);
        setBody(content.body || '');
        setUrl(content.url || '');
        setErrors({});
        setGeneralError(null);
      }
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Content</DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <span>Editing</span>
              <Badge variant="secondary" className="capitalize">
                {content.type}
              </Badge>
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {generalError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {generalError}
              </div>
            )}

            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title <span className="text-destructive">*</span>
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title"
                disabled={isSubmitting}
                aria-invalid={!!errors.title}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title[0]}</p>
              )}
            </div>

            <div className="grid gap-2">
              <label htmlFor="body" className="text-sm font-medium">
                Content
              </label>
              <textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Enter content (optional)"
                rows={5}
                disabled={isSubmitting}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                aria-invalid={!!errors.body}
              />
              {errors.body && (
                <p className="text-sm text-destructive">{errors.body[0]}</p>
              )}
            </div>

            {content.type === 'link' && (
              <div className="grid gap-2">
                <label htmlFor="url" className="text-sm font-medium">
                  URL
                </label>
                <Input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.url}
                />
                {errors.url && (
                  <p className="text-sm text-destructive">{errors.url[0]}</p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
