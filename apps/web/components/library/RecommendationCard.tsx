'use client';

import { FileText, Link, File } from 'lucide-react';
import type { ContentType } from '@/lib/db/schema';

export type RecommendationCardProps = {
  id: string;
  title: string;
  type: ContentType;
  body: string | null;
  tags: string[];
  similarity: number;
  onClick?: () => void;
};

function getTypeIcon(type: ContentType) {
  switch (type) {
    case 'note':
      return <FileText className="h-4 w-4 text-blue-500" aria-hidden="true" />;
    case 'link':
      return <Link className="h-4 w-4 text-green-500" aria-hidden="true" />;
    case 'file':
      return <File className="h-4 w-4 text-orange-500" aria-hidden="true" />;
    default:
      return <FileText className="h-4 w-4 text-gray-500" aria-hidden="true" />;
  }
}

function formatSimilarity(similarity: number): string {
  return `${Math.round(similarity * 100)}%`;
}

export function RecommendationCard({
  id,
  title,
  type,
  tags,
  similarity,
  onClick,
}: RecommendationCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-lg border bg-card p-3 hover:bg-accent hover:border-primary/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
      aria-label={`View ${title}${similarity > 0 ? `, ${formatSimilarity(similarity)} similar` : ''}`}
      data-testid={`recommendation-card-${id}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0" aria-label={`${type} type`}>
          {getTypeIcon(type)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-medium truncate text-sm">{title}</h4>
            {similarity > 0 && (
              <span
                className="flex-shrink-0 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full"
                aria-label={`${formatSimilarity(similarity)} similar`}
              >
                {formatSimilarity(similarity)}
              </span>
            )}
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-secondary px-1.5 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
