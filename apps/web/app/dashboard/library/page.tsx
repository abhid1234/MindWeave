import { getContentAction } from '@/app/actions/content';
import { FilterBar } from '@/components/library/FilterBar';
import { SearchBar } from '@/components/library/SearchBar';
import { LibraryContent } from '@/components/library/LibraryContent';
import { CollectionFilter } from '@/components/library/CollectionFilter';
import { FavoritesToggle } from '@/components/library/FavoritesToggle';
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
    collectionId?: string;
    favorites?: string;
  }>;
}) {
  const params = await searchParams;
  const favoritesOnly = params.favorites === 'true';

  // Fetch content with filters and sorting
  const { items, allTags } = await getContentAction({
    type: params.type,
    tag: params.tag,
    query: params.query,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    collectionId: params.collectionId,
    favoritesOnly,
  });

  const hasFilters = !!(params.type || params.tag || params.query || params.collectionId || favoritesOnly);

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Library</h1>
        <p className="mt-2 text-muted-foreground">
          Browse and organize all your saved content
        </p>
      </div>

      {/* Search and Collection Filter */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <SearchBar />
        </div>
        <FavoritesToggle />
        <CollectionFilter />
      </div>

      {/* Filters and Sorting */}
      <FilterBar allTags={allTags} />

      {/* Content Grid with Bulk Selection */}
      <LibraryContent items={items} allTags={allTags} hasFilters={hasFilters} />
    </div>
  );
}
