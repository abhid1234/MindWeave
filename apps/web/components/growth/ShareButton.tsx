'use client';

import { useState } from 'react';
import { Share2, Copy, Check, ExternalLink, Linkedin } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { trackEvent } from '@/lib/analytics/tracker';

interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'icon';
}

export function ShareButton({
  url,
  title,
  description: _description,
  variant = 'outline',
  size = 'sm',
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  function openShareWindow(shareUrl: string) {
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
  }

  function handleTwitter() {
    trackEvent('share_click', { platform: 'twitter', url, title });
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
    openShareWindow(shareUrl);
  }

  function handleLinkedIn() {
    trackEvent('share_click', { platform: 'linkedin', url, title });
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    openShareWindow(shareUrl);
  }

  function handleReddit() {
    trackEvent('share_click', { platform: 'reddit', url, title });
    const shareUrl = `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
    openShareWindow(shareUrl);
  }

  async function handleCopyLink() {
    trackEvent('share_click', { platform: 'copy_link', url, title });
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: do nothing silently
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} aria-label="Share">
          <Share2 className="h-4 w-4" />
          {size !== 'icon' && <span className="ml-1">Share</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleTwitter}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Share on X (Twitter)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLinkedIn}>
          <Linkedin className="mr-2 h-4 w-4" />
          Share on LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleReddit}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Share on Reddit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? (
            <Check className="mr-2 h-4 w-4 text-green-500" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          {copied ? 'Copied!' : 'Copy Link'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
