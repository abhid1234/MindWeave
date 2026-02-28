'use client';

import { useState, useMemo } from 'react';
import { Sparkles, Youtube, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface UrlSummarizerProps {
  url: string;
  onSummaryReady: (
    body: string,
    metadata: Record<string, string | undefined>,
  ) => void;
  disabled?: boolean;
}

const YOUTUBE_REGEX = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/;

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function UrlSummarizer({ url, onSummaryReady, disabled = false }: UrlSummarizerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState('');
  const [error, setError] = useState<string | null>(null);

  const urlType = useMemo(() => {
    if (!url || !isValidUrl(url)) return null;
    if (YOUTUBE_REGEX.test(url)) return 'youtube';
    return 'article';
  }, [url]);

  if (!urlType) return null;

  const handleSummarize = async () => {
    setIsLoading(true);
    setError(null);
    setLoadingPhase('Extracting content...');

    try {
      const response = await fetch('/api/summarize-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      setLoadingPhase('Generating summary...');

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to summarize');
        return;
      }

      onSummaryReady(data.data.formattedBody, data.data.metadata);
    } catch {
      setError('Failed to summarize. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingPhase('');
    }
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleSummarize}
        disabled={disabled || isLoading}
        className="gap-1.5"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="text-xs">{loadingPhase}</span>
          </>
        ) : urlType === 'youtube' ? (
          <>
            <Youtube className="h-3.5 w-3.5 text-red-500" />
            <span className="text-xs">Summarize Video</span>
          </>
        ) : (
          <>
            <Sparkles className="h-3.5 w-3.5" />
            <span className="text-xs">Summarize Article</span>
          </>
        )}
      </Button>

      {error && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
