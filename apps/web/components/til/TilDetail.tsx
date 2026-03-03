'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, Calendar, ExternalLink } from 'lucide-react';
import { UpvoteButton } from './UpvoteButton';
import { MarkdownRenderer } from '@/components/editor/MarkdownRenderer';
import { trackTilViewAction } from '@/app/actions/til';
import type { TilPostWithDetails } from '@/types/til';

interface TilDetailProps {
  post: TilPostWithDetails;
  isAuthenticated: boolean;
}

export function TilDetail({ post, isAuthenticated }: TilDetailProps) {
  useEffect(() => {
    trackTilViewAction(post.id);
  }, [post.id]);

  const formattedDate = new Date(post.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <article className="rounded-xl border bg-card shadow-soft animate-in fade-in-50 slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold mb-3">{post.title}</h1>

          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Creator */}
            <div className="flex items-center gap-2">
              {post.creator.image ? (
                <Image
                  src={post.creator.image}
                  alt={post.creator.name || 'Creator'}
                  width={28}
                  height={28}
                  className="rounded-full"
                />
              ) : (
                <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                  {(post.creator.name || post.creator.username || '?')[0].toUpperCase()}
                </div>
              )}
              <span className="text-sm font-medium">
                {post.creator.name || post.creator.username || 'Anonymous'}
              </span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {post.viewCount} views
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formattedDate}
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {post.body ? (
            <MarkdownRenderer content={post.body} />
          ) : (
            <p className="text-muted-foreground italic">No additional content.</p>
          )}
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="px-6 pb-4">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/til?tag=${encodeURIComponent(tag)}`}
                  className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 border-t flex items-center justify-between">
          <UpvoteButton
            tilId={post.id}
            initialCount={post.upvoteCount}
            initialUpvoted={post.hasUpvoted}
            isAuthenticated={isAuthenticated}
            size="lg"
          />

          {post.shareId && (
            <Link
              href={`/share/${post.shareId}`}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              View full content
            </Link>
          )}
        </div>
      </article>
    </div>
  );
}
