'use client';

import { useState } from 'react';
import { Zap, Copy, Check, ArrowRight } from 'lucide-react';
import type { ConnectionResult } from '@/types/connections';

interface ConnectionCardProps {
  connection: ConnectionResult;
}

export function ConnectionCard({ connection }: ConnectionCardProps) {
  const [copied, setCopied] = useState(false);

  function handleShareAsPost() {
    const postText = `I just discovered an unexpected connection in my knowledge base:

"${connection.contentA.title}" meets "${connection.contentB.title}"

${connection.insight}

Sometimes the most valuable insights come from connecting dots across different domains.

#KnowledgeManagement #Learning #Mindweave`;

    navigator.clipboard.writeText(postText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md">
      {/* Connection header */}
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Zap className="h-4 w-4 text-amber-500" />
        <span>{connection.similarity}% similarity</span>
      </div>

      {/* Content pair */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex-1 rounded-lg bg-accent/50 p-3">
          <p className="text-xs font-medium uppercase text-muted-foreground">{connection.contentA.type}</p>
          <p className="mt-1 font-medium text-sm line-clamp-2">{connection.contentA.title}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {connection.contentA.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />

        <div className="flex-1 rounded-lg bg-accent/50 p-3">
          <p className="text-xs font-medium uppercase text-muted-foreground">{connection.contentB.type}</p>
          <p className="mt-1 font-medium text-sm line-clamp-2">{connection.contentB.title}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {connection.contentB.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* AI Insight */}
      <div className="mb-4 rounded-lg bg-amber-50 p-4 dark:bg-amber-950/20">
        <p className="text-sm leading-relaxed">{connection.insight}</p>
      </div>

      {/* Share button */}
      <button
        onClick={handleShareAsPost}
        className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-green-500" />
            Copied to clipboard!
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            Share as Post
          </>
        )}
      </button>
    </div>
  );
}
