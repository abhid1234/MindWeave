'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { ContentType } from '@/lib/db/schema';
import { formatDateUTC } from '@/lib/utils';
import { highlightText } from '@/lib/highlight';

const ContentDetailDialog = dynamic(
  () => import('../library/ContentDetailDialog').then((mod) => mod.ContentDetailDialog),
  { loading: () => null }
);

type SearchResultCardProps = {
  item: {
    id: string;
    title: string;
    body: string | null;
    type: ContentType;
    url: string | null;
    tags: string[];
    autoTags: string[];
    createdAt: Date;
    metadata?: {
      fileType?: string;
      fileSize?: number;
      filePath?: string;
      fileName?: string;
      [key: string]: unknown;
    } | null;
    isShared?: boolean;
    shareId?: string | null;
    isFavorite?: boolean;
  };
  query: string;
  similarity?: number;
};

export function SearchResultCard({ item, query, similarity }: SearchResultCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const formatSimilarity = (value: number) => `${Math.round(value * 100)}%`;

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsDetailOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsDetailOpen(true);
          }
        }}
        className="rounded-lg border bg-card p-4 hover:bg-accent transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold line-clamp-1">{highlightText(item.title, query)}</h3>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                {item.type}
              </span>
              {similarity !== undefined && (
                <span className="rounded-full bg-green-100 dark:bg-green-900 px-2 py-0.5 text-xs text-green-700 dark:text-green-300 font-medium">
                  {formatSimilarity(similarity)} match
                </span>
              )}
            </div>
            {item.url && (
              <p className="mt-2 text-sm text-primary truncate">
                {item.url}
              </p>
            )}
            {((item.tags?.length ?? 0) > 0 || (item.autoTags?.length ?? 0) > 0) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {(item.tags ?? []).map((tag: string) => (
                  <span
                    key={tag}
                    className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                  >
                    {tag}
                  </span>
                ))}
                {(item.autoTags ?? []).map((tag: string) => (
                  <span
                    key={`auto-${tag}`}
                    className="rounded-full bg-secondary px-2 py-1 text-xs font-medium"
                  >
                    {tag} (AI)
                  </span>
                ))}
              </div>
            )}
          </div>
          <span className="ml-4 text-xs text-muted-foreground whitespace-nowrap">
            {formatDateUTC(item.createdAt)}
          </span>
        </div>
      </div>

      <ContentDetailDialog
        content={{
          id: item.id,
          type: item.type,
          title: item.title,
          body: item.body,
          url: item.url,
          tags: item.tags ?? [],
          autoTags: item.autoTags ?? [],
          createdAt: item.createdAt,
          metadata: item.metadata,
          isShared: item.isShared,
          shareId: item.shareId,
          isFavorite: item.isFavorite,
        }}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </>
  );
}
