'use client';

import { FileText, Link as LinkIcon, File } from 'lucide-react';
import type { ContentType } from '@/lib/db/schema';
import { formatRelativeTime, truncate } from '@/lib/utils';

export type DiscoverCardProps = {
  id: string;
  title: string;
  body: string | null;
  type: ContentType;
  tags: string[];
  autoTags: string[];
  similarity: number;
  score: number;
  lastViewedAt: Date | null;
  createdAt: Date;
  onClick?: () => void;
};

function getTypeIcon(type: ContentType) {
  switch (type) {
    case 'note':
      return <FileText className="h-4 w-4 text-blue-500" aria-hidden="true" />;
    case 'link':
      return <LinkIcon className="h-4 w-4 text-green-500" aria-hidden="true" />;
    case 'file':
      return <File className="h-4 w-4 text-orange-500" aria-hidden="true" />;
    default:
      return <FileText className="h-4 w-4 text-gray-500" aria-hidden="true" />;
  }
}

export function DiscoverCard({
  id,
  title,
  body,
  type,
  tags,
  autoTags,
  similarity,
  score,
  lastViewedAt,
  createdAt,
  onClick,
}: DiscoverCardProps) {
  const allTags = [...tags, ...autoTags];
  const isNew = lastViewedAt === null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-lg border bg-card p-4 hover:bg-accent hover:border-primary/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
      aria-label={`View ${title}`}
      data-testid={`discover-card-${id}`}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {getTypeIcon(type)}
            <h3 className="font-medium text-sm truncate">{title}</h3>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isNew && (
              <span
                className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400 px-1.5 py-0.5 rounded-full"
                data-testid="new-badge"
              >
                New to you
              </span>
            )}
            {similarity > 0 && (
              <span className="text-xs font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                {Math.round(similarity * 100)}%
              </span>
            )}
          </div>
        </div>

        {body && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {truncate(body, 120)}
          </p>
        )}

        <div className="flex items-center justify-between gap-2">
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1 min-w-0">
              {allTags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-secondary px-1.5 py-0.5 rounded truncate max-w-[80px]"
                >
                  {tag}
                </span>
              ))}
              {allTags.length > 2 && (
                <span className="text-xs text-muted-foreground">
                  +{allTags.length - 2}
                </span>
              )}
            </div>
          )}
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {formatRelativeTime(createdAt)}
          </span>
        </div>
      </div>
    </button>
  );
}
