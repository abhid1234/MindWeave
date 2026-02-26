import type { Metadata } from 'next';
import { Library } from 'lucide-react';
import { getContentAction } from '@/app/actions/content';

export const metadata: Metadata = {
  title: 'Library | Mindweave',
  description: 'Browse and organize all your saved notes, links, and files',
};
import { FilterBar } from '@/components/library/FilterBar';
import { SearchBar } from '@/components/library/SearchBar';
import { LibraryContent } from '@/components/library/LibraryContent';
import { CollectionFilter } from '@/components/library/CollectionFilter';
import { FavoritesToggle } from '@/components/library/FavoritesToggle';
import { ContentClusters } from '@/components/library/ContentClusters';
import { LibraryTabToggle } from '@/components/library/LibraryTabToggle';
import { CollectionGrid } from '@/components/library/CollectionGrid';
import type { ContentType } from '@/lib/db/schema';
import type { ViewMode } from '@/components/library/ViewToggle';

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
    tab?: 'items' | 'collections';
    view?: ViewMode;
  }>;
}) {
  const params = await searchParams;
  const favoritesOnly = params.favorites === 'true';
  const tab = params.tab || 'items';
  const view = params.view || 'grid';
  const isCollectionsTab = tab === 'collections';

  // Build filter params for infinite scroll
  const filterParams = {
    type: params.type,
    tag: params.tag,
    query: params.query,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    collectionId: params.collectionId,
    favoritesOnly,
  };

  // Only fetch content when on items tab
  const { items, allTags, nextCursor, hasMore } = isCollectionsTab
    ? { items: [], allTags: [], nextCursor: null, hasMore: false }
    : await getContentAction({
        ...filterParams,
        limit: 20,
      });

  const hasFilters = !!(params.type || params.tag || params.query || params.collectionId || favoritesOnly);

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Library className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Library</h1>
            <p className="text-muted-foreground">
              Browse and organize all your saved content
            </p>
          </div>
        </div>
      </div>

      {/* Tab Toggle */}
      <div className="mb-6 animate-fade-up" style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}>
        <LibraryTabToggle />
      </div>

      <div className="flex flex-col lg:flex-row gap-6 animate-fade-up" style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}>
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {isCollectionsTab ? (
            <CollectionGrid />
          ) : (
            <>
              {/* Search and Collection Filter */}
              <div className="mb-6 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-0 w-full sm:min-w-[200px] sm:w-auto">
                  <SearchBar />
                </div>
                <FavoritesToggle />
                <CollectionFilter />
              </div>

              {/* Filters and Sorting */}
              <FilterBar allTags={allTags} />

              {/* Content with Bulk Selection and Infinite Scroll */}
              <LibraryContent
                items={items}
                allTags={allTags}
                hasFilters={hasFilters}
                view={view}
                initialCursor={nextCursor}
                initialHasMore={hasMore}
                filterParams={filterParams}
              />
            </>
          )}
        </div>

        {/* Sidebar with Clusters (only on items tab) */}
        {!isCollectionsTab && (
          <aside className="lg:w-72 shrink-0">
            <div className="sticky top-4">
              <ContentClusters />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
