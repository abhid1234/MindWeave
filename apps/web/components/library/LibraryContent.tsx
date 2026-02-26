'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Download, Loader2, Search, Library } from 'lucide-react';
import { BulkSelectionProvider } from './BulkSelectionContext';
import { BulkActionsBar } from './BulkActionsBar';
import { SelectableContentCard } from './SelectableContentCard';
import { SelectionToggle } from './SelectionToggle';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { ContentType } from '@/lib/db/schema';
import { getContentAction } from '@/app/actions/content';
import type { ViewMode } from './ViewToggle';

// Dynamic imports to reduce initial bundle size
const ExportDialog = dynamic(() => import('./ExportDialog').then((mod) => mod.ExportDialog), {
  loading: () => null,
});
const ContentListView = dynamic(() => import('./ContentListView').then((mod) => mod.ContentListView), {
  loading: () => null,
});
const ContentBoardView = dynamic(() => import('./ContentBoardView').then((mod) => mod.ContentBoardView), {
  loading: () => null,
});

type ContentItem = {
  id: string;
  type: ContentType;
  title: string;
  body: string | null;
  url: string | null;
  tags: string[];
  autoTags: string[];
  createdAt: Date;
  metadata: {
    fileType?: string;
    fileSize?: number;
    filePath?: string;
    fileName?: string;
    [key: string]: unknown;
  } | null;
  isShared: boolean;
  shareId: string | null;
  isFavorite: boolean;
  summary?: string | null;
};

type LibraryContentProps = {
  items: ContentItem[];
  allTags: string[];
  hasFilters: boolean;
  view?: ViewMode;
  // Pagination props
  initialCursor?: string | null;
  initialHasMore?: boolean;
  // Filter params for infinite scroll
  filterParams?: {
    type?: ContentType;
    tag?: string;
    query?: string;
    sortBy?: 'createdAt' | 'title';
    sortOrder?: 'asc' | 'desc';
    collectionId?: string;
    favoritesOnly?: boolean;
  };
};

export function LibraryContent({
  items: initialItems,
  allTags: initialAllTags,
  hasFilters,
  view = 'grid',
  initialCursor = null,
  initialHasMore = false,
  filterParams = {},
}: LibraryContentProps) {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [items, setItems] = useState<ContentItem[]>(initialItems);
  const [allTags, setAllTags] = useState<string[]>(initialAllTags);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isLoadingRef = useRef(false);

  // Reset state when initial items change (e.g., filter changes)
  useEffect(() => {
    setItems(initialItems);
    setAllTags(initialAllTags);
    setCursor(initialCursor);
    setHasMore(initialHasMore);
  }, [initialItems, initialAllTags, initialCursor, initialHasMore]);

  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMore || !cursor) return;

    isLoadingRef.current = true;
    setIsLoadingMore(true);

    try {
      const result = await getContentAction({
        ...filterParams,
        cursor,
        limit: 20,
      });

      if (result.success) {
        setItems(prev => [...prev, ...result.items as ContentItem[]]);
        setCursor(result.nextCursor ?? null);
        setHasMore(result.hasMore ?? false);
        if (result.allTags.length > 0) {
          setAllTags(result.allTags);
        }
      }
    } catch (err) {
      console.error('Error loading more content:', err);
    } finally {
      setIsLoadingMore(false);
      isLoadingRef.current = false;
    }
  }, [cursor, hasMore, filterParams]);

  // Intersection Observer for automatic loading
  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoadingRef.current) {
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: '200px',
        threshold: 0.1,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadMore]);

  const allIds = items.map((item) => item.id);
  const hasActiveFilters = !!(filterParams.type || filterParams.tag || filterParams.query || filterParams.collectionId);

  return (
    <BulkSelectionProvider>
      {/* Selection Toggle and Count */}
      {items.length > 0 && (
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Showing {items.length} item{items.length !== 1 ? 's' : ''}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportDialog(true)}
            >
              <Download className="mr-2 h-4 w-4" />
              {hasActiveFilters ? 'Export' : 'Export All'}
            </Button>
            <SelectionToggle allIds={allIds} />
          </div>
        </div>
      )}

      {/* Content Grid */}
      {items.length === 0 ? (
        <div className="rounded-xl border bg-card p-16 text-center shadow-soft animate-fade-up">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            {hasFilters ? (
              <Search className="h-7 w-7 text-primary" />
            ) : (
              <Library className="h-7 w-7 text-primary" />
            )}
          </div>
          <h3 className="text-lg font-semibold mb-1">
            {hasFilters ? 'No results found' : 'Your library is empty'}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {hasFilters
              ? 'Try adjusting your filters or search terms to find what you are looking for.'
              : 'Start capturing your ideas, links, and files to build your knowledge base.'}
          </p>
          <Link
            href="/dashboard/capture"
            className="mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 text-base font-medium text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md"
          >
            {hasFilters ? 'Clear Filters' : 'Create Your First Item'}
          </Link>
        </div>
      ) : (
        <>
          {view === 'list' ? (
            <div className="pb-4">
              <ContentListView items={items} allTags={allTags} />
            </div>
          ) : view === 'board' ? (
            <div className="pb-4">
              <ContentBoardView items={items} allTags={allTags} />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pb-4">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${Math.min(index * 50, 300)}ms`, animationFillMode: 'backwards' }}
                >
                  <SelectableContentCard {...item} allTags={allTags} />
                </div>
              ))}
            </div>
          )}

          {/* Infinite scroll trigger */}
          <div
            ref={loadMoreRef}
            className="flex items-center justify-center py-8 pb-20"
          >
            {isLoadingMore && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading more...</span>
              </div>
            )}
            {!hasMore && items.length > 0 && (
              <p className="text-sm text-muted-foreground">
                You&apos;ve reached the end
              </p>
            )}
          </div>
        </>
      )}

      {/* Bulk Actions Bar */}
      <BulkActionsBar />

      {/* Export All Dialog */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        itemCount={items.length}
        collectionId={filterParams.collectionId}
        filters={{
          type: filterParams.type,
          tag: filterParams.tag,
          query: filterParams.query,
        }}
      />
    </BulkSelectionProvider>
  );
}
