import { getContentAction } from '@/app/actions/content';
import { ContentCard } from '@/components/library/ContentCard';
import { FilterBar } from '@/components/library/FilterBar';
import { SearchBar } from '@/components/library/SearchBar';
import Link from 'next/link';
import type { ContentType } from '@/lib/db/schema';

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: ContentType;
    tag?: string;
    query?: string;
    sortBy?: 'createdAt' | 'title';
    sortOrder?: 'asc' | 'desc';
  }>;
}) {
  const params = await searchParams;

  // Fetch content with filters and sorting
  const { items, allTags } = await getContentAction({
    type: params.type,
    tag: params.tag,
    query: params.query,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });

  const hasFilters = params.type || params.tag || params.query;

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Library</h1>
        <p className="mt-2 text-muted-foreground">
          Browse and organize all your saved content
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <SearchBar />
      </div>

      {/* Filters and Sorting */}
      <FilterBar allTags={allTags} />

      {/* Content Grid */}
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            {hasFilters
              ? 'No content matches your filters.'
              : 'No content yet. Start capturing your ideas!'}
          </p>
          <Link
            href="/dashboard/capture"
            className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Create Content
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {items.length} item{items.length !== 1 ? 's' : ''}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <ContentCard key={item.id} {...item} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
