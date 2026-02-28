'use client';

import { useState } from 'react';
import { Copy, Check, Linkedin } from 'lucide-react';

interface WrappedShareButtonProps {
  shareId: string;
}

export function WrappedShareButton({ shareId }: WrappedShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/wrapped/${shareId}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleLinkedIn() {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-green-500" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            Copy Link
          </>
        )}
      </button>
      <button
        onClick={handleLinkedIn}
        className="inline-flex items-center gap-2 rounded-lg bg-[#0077B5] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#006094]"
      >
        <Linkedin className="h-4 w-4" />
        Share on LinkedIn
      </button>
    </div>
  );
}
