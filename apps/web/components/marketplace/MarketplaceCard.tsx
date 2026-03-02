'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Eye, Copy, FileText, Tag } from 'lucide-react';
import type { MarketplaceListingWithDetails } from '@/types/marketplace';

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

interface MarketplaceCardProps {
  listing: MarketplaceListingWithDetails;
  index?: number;
}

export function MarketplaceCard({ listing, index = 0 }: MarketplaceCardProps) {
  return (
    <Link
      href={`/marketplace/${listing.id}`}
      className="group relative flex flex-col rounded-xl border bg-card p-4 shadow-soft transition-all duration-300 ease-smooth hover:shadow-soft-md hover:-translate-y-0.5 hover:border-primary/20 overflow-hidden animate-in fade-in-50 slide-in-from-bottom-4 duration-300"
      style={{
        animationDelay: `${Math.min(index * 50, 300)}ms`,
        animationFillMode: 'backwards',
      }}
    >
      {/* Color accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 group-hover:w-1.5"
        style={{ backgroundColor: listing.collection.color || 'hsl(var(--muted-foreground))' }}
        aria-hidden="true"
      />

      <div className="pl-2">
        {/* Category badge */}
        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          {CATEGORY_LABELS[listing.category] || listing.category}
        </span>

        {/* Title */}
        <h3 className="mt-2 font-semibold line-clamp-1 group-hover:text-primary transition-colors">
          {listing.collection.name}
        </h3>

        {/* Description */}
        {(listing.description || listing.collection.description) && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {listing.description || listing.collection.description}
          </p>
        )}

        {/* Tags */}
        {listing.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {listing.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
              >
                <Tag className="h-2.5 w-2.5" />
                {tag}
              </span>
            ))}
            {listing.tags.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{listing.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Creator + Stats */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {listing.creator.image ? (
              <Image
                src={listing.creator.image}
                alt={listing.creator.name || 'Creator'}
                width={20}
                height={20}
                className="rounded-full"
              />
            ) : (
              <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-medium text-primary">
                {(listing.creator.name || listing.creator.username || '?')[0].toUpperCase()}
              </div>
            )}
            <span className="text-xs text-muted-foreground truncate max-w-[100px]">
              {listing.creator.name || listing.creator.username || 'Anonymous'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1" title="Items">
              <FileText className="h-3 w-3" />
              {listing.contentCount}
            </span>
            <span className="flex items-center gap-1" title="Views">
              <Eye className="h-3 w-3" />
              {listing.viewCount}
            </span>
            <span className="flex items-center gap-1" title="Clones">
              <Copy className="h-3 w-3" />
              {listing.cloneCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
