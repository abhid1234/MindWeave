'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Eye, Tag } from 'lucide-react';
import { UpvoteButton } from './UpvoteButton';
import type { TilPostWithDetails } from '@/types/til';

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString();
}

interface TilCardProps {
  post: TilPostWithDetails;
  isAuthenticated: boolean;
  index?: number;
}

export function TilCard({ post, isAuthenticated, index = 0 }: TilCardProps) {
  return (
    <div
      className="group relative flex gap-3 rounded-xl border bg-card p-4 shadow-soft transition-all duration-300 ease-smooth hover:shadow-soft-md hover:border-primary/20 animate-in fade-in-50 slide-in-from-bottom-4 duration-300"
      style={{
        animationDelay: `${Math.min(index * 50, 300)}ms`,
        animationFillMode: 'backwards',
      }}
    >
      {/* Upvote on left */}
      <div className="flex flex-col items-center pt-1">
        <UpvoteButton
          tilId={post.id}
          initialCount={post.upvoteCount}
          initialUpvoted={post.hasUpvoted}
          isAuthenticated={isAuthenticated}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/til/${post.id}`}
          className="block group/title"
        >
          <h3 className="font-semibold line-clamp-1 group-hover/title:text-primary transition-colors">
            {post.title}
          </h3>
        </Link>

        {post.body && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-3">
            {post.body}
          </p>
        )}

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {post.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
              >
                <Tag className="h-2.5 w-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer: creator + stats + time */}
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {post.creator.image ? (
              <Image
                src={post.creator.image}
                alt={post.creator.name || 'Creator'}
                width={18}
                height={18}
                className="rounded-full"
              />
            ) : (
              <div className="h-[18px] w-[18px] rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-medium text-primary">
                {(post.creator.name || post.creator.username || '?')[0].toUpperCase()}
              </div>
            )}
            <span className="truncate max-w-[100px]">
              {post.creator.name || post.creator.username || 'Anonymous'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1" title="Views">
              <Eye className="h-3 w-3" />
              {post.viewCount}
            </span>
            <span>{formatRelativeTime(post.publishedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
