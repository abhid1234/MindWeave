'use client';

import { useState, useCallback, useEffect } from 'react';
import { Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarketplaceCard } from './MarketplaceCard';
import { MarketplaceFilters } from './MarketplaceFilters';
import { browseMarketplaceAction } from '@/app/actions/marketplace';
import type { MarketplaceListingWithDetails, MarketplaceSortOption } from '@/types/marketplace';
import type { MarketplaceCategory } from '@/lib/db/schema';

interface MarketplaceGridProps {
  initialListings?: MarketplaceListingWithDetails[];
  initialTotal?: number;
}

export function MarketplaceGrid({ initialListings, initialTotal }: MarketplaceGridProps) {
  const [listings, setListings] = useState<MarketplaceListingWithDetails[]>(initialListings || []);
  const [isLoading, setIsLoading] = useState(!initialListings);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(
    initialTotal ? Math.ceil(initialTotal / 12) : 0
  );
  const [filters, setFilters] = useState<{
    query?: string;
    category?: MarketplaceCategory;
    sort?: MarketplaceSortOption;
  }>({});

  const fetchListings = useCallback(
    async (currentPage: number, currentFilters: typeof filters) => {
      setIsLoading(true);
      const result = await browseMarketplaceAction({
        query: currentFilters.query,
        category: currentFilters.category,
        sort: currentFilters.sort || 'trending',
        page: currentPage,
        perPage: 12,
      });

      if (result.success) {
        setListings(result.listings);
        setTotalPages(result.pagination.totalPages);
      }
      setIsLoading(false);
    },
    []
  );

  // Initial fetch only if no initial data provided
  useEffect(() => {
    if (!initialListings) {
      fetchListings(1, {});
    }
  }, [fetchListings, initialListings]);

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPage(1);
    fetchListings(1, newFilters);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchListings(newPage, filters);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      <MarketplaceFilters onFilterChange={handleFilterChange} />

      {isLoading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl border bg-muted" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="rounded-xl border border-dashed p-16 text-center animate-in fade-in-50 duration-300">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Store className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No collections found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {filters.query || filters.category
              ? 'Try adjusting your search or filters.'
              : 'Be the first to publish a collection to the marketplace!'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing, index) => (
              <MarketplaceCard key={listing.id} listing={listing} index={index} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
