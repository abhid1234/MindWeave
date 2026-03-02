'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Eye, Copy, FileText, Calendar, Tag, ArrowLeft, FileType, Link2, StickyNote } from 'lucide-react';
import { CloneButton } from './CloneButton';
import type { MarketplaceListingDetail as ListingDetail } from '@/types/marketplace';

const CATEGORY_LABELS: Record<string, string> = {
  programming: 'Programming',
  design: 'Design',
  business: 'Business',
  science: 'Science',
  learning: 'Learning',
  productivity: 'Productivity',
  career: 'Career',
  health: 'Health',
  other: 'Other',
};

const TYPE_ICONS: Record<string, typeof FileText> = {
  note: StickyNote,
  link: Link2,
  file: FileType,
};

interface MarketplaceListingDetailProps {
  listing: ListingDetail;
}

export function MarketplaceListingDetail({ listing }: MarketplaceListingDetailProps) {
  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Marketplace
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex-1">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            {CATEGORY_LABELS[listing.category] || listing.category}
          </span>

          <h1 className="mt-3 text-2xl font-bold md:text-3xl">
            {listing.collection.name}
          </h1>

          {(listing.description || listing.collection.description) && (
            <p className="mt-2 text-muted-foreground max-w-2xl">
              {listing.description || listing.collection.description}
            </p>
          )}

          {/* Stats */}
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              {listing.contentCount} items
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {listing.viewCount} views
            </span>
            <span className="flex items-center gap-1">
              <Copy className="h-4 w-4" />
              {listing.cloneCount} clones
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(listing.publishedAt).toLocaleDateString()}
            </span>
          </div>

          {/* Tags */}
          {listing.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {listing.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Clone CTA + Creator */}
        <div className="flex flex-col gap-4 md:items-end">
          <CloneButton listingId={listing.id} size="lg" />

          {/* Creator card */}
          <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
            {listing.creator.image ? (
              <Image
                src={listing.creator.image}
                alt={listing.creator.name || 'Creator'}
                width={40}
                height={40}
                className="rounded-full"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
                {(listing.creator.name || listing.creator.username || '?')[0].toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-medium">
                {listing.creator.name || listing.creator.username || 'Anonymous'}
              </p>
              {listing.creator.username && (
                <Link
                  href={`/profile/${listing.creator.username}`}
                  className="text-xs text-primary hover:underline"
                >
                  @{listing.creator.username}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Preview */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          Contents ({listing.contentCount})
        </h2>
        {listing.contentPreview.length > 0 ? (
          <div className="rounded-xl border divide-y">
            {listing.contentPreview.map((item) => {
              const Icon = TYPE_ICONS[item.type] || FileText;
              return (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate">{item.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground capitalize">
                    {item.type}
                  </span>
                </div>
              );
            })}
            {listing.contentCount > listing.contentPreview.length && (
              <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                +{listing.contentCount - listing.contentPreview.length} more items
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No content preview available.</p>
        )}
      </div>
    </div>
  );
}
