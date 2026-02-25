'use client';

import { useState, useEffect, useTransition } from 'react';
import { FileText, LinkIcon, Loader2, X } from 'lucide-react';
import { createContentAction } from '@/app/actions/content';
import { useToast } from '@/components/ui/toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ContentType = 'note' | 'link';

export function QuickCaptureDialog() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ContentType>('note');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState('');
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  // Ctrl+N / Cmd+N to open
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'n' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const reset = () => {
    setType('note');
    setTitle('');
    setBody('');
    setUrl('');
    setTags('');
  };

  const handleClose = () => {
    setOpen(false);
    reset();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    const formData = new FormData();
    formData.set('type', type);
    formData.set('title', title.trim());
    if (body.trim()) formData.set('body', body.trim());
    if (type === 'link' && url.trim()) formData.set('url', url.trim());
    if (tags.trim()) {
      formData.set('tags', tags.split(',').map((t) => t.trim()).filter(Boolean).join(','));
    }

    startTransition(async () => {
      const result = await createContentAction(formData);

      if (result.success) {
        addToast({
          variant: 'success',
          title: 'Content saved',
          description: result.message,
        });
        handleClose();
      } else {
        addToast({
          variant: 'error',
          title: 'Failed to save',
          description: result.message,
        });
      }
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      {/* Dialog */}
      <div className="fixed left-1/2 top-[15%] z-[101] w-full max-w-lg -translate-x-1/2 rounded-xl border bg-popover shadow-soft-lg overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Quick Capture</h2>
          <button
            onClick={handleClose}
            className="rounded-md p-1 hover:bg-accent transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Type Toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('note')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                type === 'note'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              )}
            >
              <FileText className="h-3.5 w-3.5" />
              Note
            </button>
            <button
              type="button"
              onClick={() => setType('link')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                type === 'link'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              )}
            >
              <LinkIcon className="h-3.5 w-3.5" />
              Link
            </button>
          </div>

          {/* Title */}
          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
            disabled={isPending}
          />

          {/* URL (conditional) */}
          {type === 'link' && (
            <Input
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              type="text"
              inputMode="url"
              disabled={isPending}
            />
          )}

          {/* Body */}
          <textarea
            placeholder="Add notes..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            disabled={isPending}
            className={cn(
              'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm',
              'placeholder:text-muted-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          />

          {/* Tags */}
          <Input
            placeholder="Tags (comma-separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            disabled={isPending}
          />

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending || !title.trim()}>
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
