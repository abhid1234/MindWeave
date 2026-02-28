'use client';

import { useState, useTransition } from 'react';
import { Share2, Copy, Check, Linkedin, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { generatePublicGraphAction } from '@/app/actions/public-graph';

export function ShareGraphButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [graphUrl, setGraphUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  function handleShare() {
    if (!title.trim()) {
      addToast({ title: 'Please enter a title', variant: 'error' });
      return;
    }

    startTransition(async () => {
      const result = await generatePublicGraphAction(title.trim(), description.trim());
      if (result.success && result.data) {
        const url = `${window.location.origin}/graph/${result.data.graphId}`;
        setGraphUrl(url);
        addToast({ title: 'Public graph created!', variant: 'success' });
      } else {
        addToast({ title: result.message || 'Failed to create public graph', variant: 'error' });
      }
    });
  }

  async function handleCopy() {
    if (graphUrl) {
      await navigator.clipboard.writeText(graphUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleOpenChange(open: boolean) {
    setIsOpen(open);
    if (!open) {
      setTitle('');
      setDescription('');
      setGraphUrl(null);
    }
  }

  const linkedInShareUrl = graphUrl
    ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(graphUrl)}`
    : '';

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        <Share2 className="h-4 w-4" />
        Share Graph
      </Button>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Knowledge Graph</DialogTitle>
          <DialogDescription>
            {graphUrl
              ? 'Your public graph is ready to share!'
              : 'Create a public snapshot of your graph. Titles and tags will be visible, but note content will not be shared.'}
          </DialogDescription>
        </DialogHeader>

        {graphUrl ? (
          <div className="space-y-4">
            {/* Copy URL */}
            <div className="flex gap-2">
              <Input
                value={graphUrl}
                readOnly
                className="bg-accent/50"
              />
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <a
                href={graphUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all"
              >
                <ExternalLink className="h-4 w-4" />
                Open in new tab
              </a>
              <a
                href={linkedInShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all"
              >
                <Linkedin className="h-4 w-4" />
                Share on LinkedIn
              </a>
            </div>

            <Button variant="secondary" className="w-full" onClick={() => handleOpenChange(false)}>
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="graph-title" className="block text-sm font-medium mb-1">
                Title
              </label>
              <Input
                id="graph-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Knowledge Graph"
                maxLength={200}
              />
            </div>
            <div>
              <label htmlFor="graph-description" className="block text-sm font-medium mb-1">
                Description (optional)
              </label>
              <textarea
                id="graph-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A visual map of my knowledge..."
                rows={3}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleShare}
                disabled={isPending || !title.trim()}
              >
                {isPending ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4" />
                    Create Public Graph
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
