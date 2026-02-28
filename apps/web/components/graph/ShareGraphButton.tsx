'use client';

import { useState, useTransition } from 'react';
import { Share2, Copy, Check, X } from 'lucide-react';
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

  function handleClose() {
    setIsOpen(false);
    setTitle('');
    setDescription('');
    setGraphUrl(null);
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
      >
        <Share2 className="h-4 w-4" />
        Share Graph
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Share Knowledge Graph</h2>
              <button onClick={handleClose} className="rounded-lg p-1 hover:bg-accent">
                <X className="h-4 w-4" />
              </button>
            </div>

            {graphUrl ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Your public graph is ready to share!</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={graphUrl}
                    readOnly
                    className="flex-1 rounded-lg border border-border bg-accent/50 px-3 py-2 text-sm"
                  />
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <button
                  onClick={handleClose}
                  className="w-full rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="My Knowledge Graph"
                    maxLength={200}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description (optional)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="A visual map of my knowledge..."
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  This creates a snapshot of your graph. Content titles and tags will be visible, but note content will not be shared.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleClose}
                    className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleShare}
                    disabled={isPending || !title.trim()}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
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
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
