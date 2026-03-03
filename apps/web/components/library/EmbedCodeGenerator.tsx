'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

type EmbedCodeGeneratorProps = {
  shareId: string;
  contentTitle: string;
};

type TabKey = 'iframe' | 'markdown' | 'html';

export function EmbedCodeGenerator({ shareId, contentTitle }: EmbedCodeGeneratorProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('iframe');
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const codes: Record<TabKey, string> = {
    iframe: `<iframe src="${baseUrl}/embed/${shareId}" width="100%" height="400" style="border:none;border-radius:12px;" title="${contentTitle}"></iframe>`,
    markdown: `[![${contentTitle}](${baseUrl}/api/og/embed?id=${shareId})](${baseUrl}/share/${shareId})`,
    html: `<a href="${baseUrl}/share/${shareId}"><img src="${baseUrl}/api/og/embed?id=${shareId}" alt="${contentTitle}" width="600" /></a>`,
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codes[activeTab]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silently fail
    }
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'iframe', label: 'iFrame' },
    { key: 'markdown', label: 'Markdown' },
    { key: 'html', label: 'HTML' },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Embed Code</p>

      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setActiveTab(tab.key);
              setCopied(false);
            }}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <pre className="rounded-lg border bg-muted p-3 text-xs overflow-x-auto whitespace-pre-wrap break-all max-h-24">
          {codes[activeTab]}
        </pre>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="absolute top-2 right-2 h-7 w-7 p-0"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}
