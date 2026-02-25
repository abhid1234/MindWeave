'use client';

import { useState } from 'react';
import { Copy, Check, RefreshCw, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface PostPreviewProps {
  postContent: string;
  sourceContentTitles: string[];
  onRegenerate: () => void;
  onBack: () => void;
  isRegenerating: boolean;
}

const LINKEDIN_CHAR_LIMIT = 3000;

export function PostPreview({
  postContent,
  sourceContentTitles,
  onRegenerate,
  onBack,
  isRegenerating,
}: PostPreviewProps) {
  const [editedContent, setEditedContent] = useState(postContent);
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(editedContent);
      setCopied(true);
      addToast({ title: 'Copied to clipboard!', variant: 'success' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast({ title: 'Failed to copy to clipboard', variant: 'error' });
    }
  }

  const charCount = editedContent.length;
  const isOverLimit = charCount > LINKEDIN_CHAR_LIMIT;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Preview & Edit</h3>
        <span
          className={`text-xs ${isOverLimit ? 'text-destructive font-medium' : 'text-muted-foreground'}`}
        >
          {charCount}/{LINKEDIN_CHAR_LIMIT}
        </span>
      </div>

      {/* LinkedIn-style card */}
      <div className="rounded-lg border border-border bg-card p-4">
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className="min-h-[200px] w-full resize-y bg-transparent text-sm leading-relaxed focus:outline-none"
          placeholder="Your generated post will appear here..."
        />
      </div>

      {/* Source attribution */}
      {sourceContentTitles.length > 0 && (
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="mb-1 text-xs font-medium text-muted-foreground">Based on:</p>
          <ul className="space-y-0.5">
            {sourceContentTitles.map((title, i) => (
              <li key={i} className="text-xs text-muted-foreground">
                {title}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
          Regenerate
        </button>
        <button
          onClick={handleCopy}
          className="ml-auto inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </button>
      </div>
    </div>
  );
}
