'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { ContentType } from '@/lib/db/schema';

export type FilterBarProps = {
  allTags: string[];
};

export function FilterBar({ allTags }: FilterBarProps) {
  const searchParams = useSearchParams();
  const typeFilter = searchParams.get('type') as ContentType | null;
  const tagFilter = searchParams.get('tag');
  const queryFilter = searchParams.get('query');
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  const contentTypes: { value: ContentType | null; label: string }[] = [
    { value: null, label: 'All' },
    { value: 'note', label: 'Notes' },
    { value: 'link', label: 'Links' },
    { value: 'file', label: 'Files' },
  ];

  const sortOptions = [
    { value: 'createdAt-desc', label: 'Newest First', sortBy: 'createdAt', sortOrder: 'desc' },
    { value: 'createdAt-asc', label: 'Oldest First', sortBy: 'createdAt', sortOrder: 'asc' },
    { value: 'title-asc', label: 'Title A-Z', sortBy: 'title', sortOrder: 'asc' },
    { value: 'title-desc', label: 'Title Z-A', sortBy: 'title', sortOrder: 'desc' },
  ];

  const currentSort = `${sortBy}-${sortOrder}`;

  const buildUrl = (params: { type?: string | null; tag?: string | null; sortBy?: string; sortOrder?: string }) => {
    const newParams = new URLSearchParams();

    const finalType = params.type !== undefined ? params.type : typeFilter;
    const finalTag = params.tag !== undefined ? params.tag : tagFilter;
    const finalSortBy = params.sortBy !== undefined ? params.sortBy : sortBy;
    const finalSortOrder = params.sortOrder !== undefined ? params.sortOrder : sortOrder;

    if (finalType) newParams.set('type', finalType);
    if (finalTag) newParams.set('tag', finalTag);
    if (queryFilter) newParams.set('query', queryFilter); // Preserve search query
    if (finalSortBy) newParams.set('sortBy', finalSortBy);
    if (finalSortOrder) newParams.set('sortOrder', finalSortOrder);

    return `/dashboard/library${newParams.toString() ? `?${newParams.toString()}` : ''}`;
  };

  return (
    <div className="mb-6 space-y-4">
      {/* Type Filter */}
      <div>
        <label className="block text-sm font-medium mb-2">Type</label>
        <div className="flex flex-wrap gap-2">
          {contentTypes.map((type) => (
            <Link
              key={type.value || 'all'}
              href={buildUrl({ type: type.value })}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-all duration-200 ${
                typeFilter === type.value
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'hover:bg-accent hover:border-primary/30 hover:shadow-sm'
              }`}
            >
              {type.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Sort Options */}
      <div>
        <label className="block text-sm font-medium mb-2">Sort By</label>
        <div className="flex flex-wrap gap-2">
          {sortOptions.map((option) => (
            <Link
              key={option.value}
              href={buildUrl({ sortBy: option.sortBy, sortOrder: option.sortOrder })}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-all duration-200 ${
                currentSort === option.value
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'hover:bg-accent hover:border-primary/30 hover:shadow-sm'
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Tag Filter */}
      {allTags.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-2">Filter by Tag</label>
          <div className="flex flex-wrap gap-2">
            {tagFilter && (
              <Link
                href={buildUrl({ tag: null })}
                className="rounded-full border px-3 py-1 text-xs bg-muted hover:bg-muted/80"
              >
                Clear tag filter ✕
              </Link>
            )}
            {allTags.slice(0, 10).map((tag) => (
              <Link
                key={tag}
                href={buildUrl({ tag })}
                className={`rounded-full border px-3 py-1 text-xs transition-all duration-200 ${
                  tagFilter === tag
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'hover:bg-accent hover:border-primary/30 hover:shadow-sm'
                }`}
              >
                {tag}
              </Link>
            ))}
            {allTags.length > 10 && (
              <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
                +{allTags.length - 10} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
