'use client';

import { useState, useTransition } from 'react';
import { Copy, Check, Globe, Lock, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { shareContentAction, unshareContentAction } from '@/app/actions/content';

type ShareDialogProps = {
  contentId: string;
  contentTitle: string;
  isShared: boolean;
  shareId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShareStatusChange?: (isShared: boolean, shareId: string | null) => void;
};

export function ShareDialog({
  contentId,
  contentTitle,
  isShared,
  shareId,
  open,
  onOpenChange,
  onShareStatusChange,
}: ShareDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [currentShareUrl, setCurrentShareUrl] = useState<string | null>(
    shareId ? `${window.location.origin}/share/${shareId}` : null
  );
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    setError(null);
    startTransition(async () => {
      const result = await shareContentAction(contentId);
      if (result.success && result.shareUrl) {
        setCurrentShareUrl(result.shareUrl);
        onShareStatusChange?.(true, result.shareId || null);
      } else {
        setError(result.message);
      }
    });
  };

  const handleUnshare = () => {
    setError(null);
    startTransition(async () => {
      const result = await unshareContentAction(contentId);
      if (result.success) {
        setCurrentShareUrl(null);
        onShareStatusChange?.(false, null);
      } else {
        setError(result.message);
      }
    });
  };

  const handleCopy = async () => {
    if (!currentShareUrl) return;
    try {
      await navigator.clipboard.writeText(currentShareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  };

  const actuallyShared = isShared || currentShareUrl !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Content</DialogTitle>
          <DialogDescription>
            {actuallyShared
              ? 'Anyone with the link can view this content'
              : 'Create a shareable link for this content'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <h3 className="font-medium truncate mb-1">{contentTitle}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              {actuallyShared ? (
                <>
                  <Globe className="h-4 w-4" />
                  Public - Anyone with link can view
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Private - Only you can view
                </>
              )}
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
              {error}
            </p>
          )}

          {actuallyShared && currentShareUrl ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentShareUrl}
                  readOnly
                  className="flex-1 rounded-lg border bg-muted px-3 py-2 text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopy}
                  disabled={isPending}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="flex gap-2">
                <a
                  href={currentShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Link
                </a>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleUnshare}
                  disabled={isPending}
                >
                  {isPending ? 'Removing...' : 'Stop Sharing'}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              onClick={handleShare}
              disabled={isPending}
              className="w-full"
            >
              {isPending ? 'Creating link...' : 'Create Shareable Link'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
