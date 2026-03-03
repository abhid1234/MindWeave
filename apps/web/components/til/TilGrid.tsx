'use client';

import { useState, useCallback, useEffect } from 'react';
import { Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TilCard } from './TilCard';
import { TilFilters } from './TilFilters';
import { browseTilAction } from '@/app/actions/til';
import type { TilPostWithDetails } from '@/types/til';

interface TilGridProps {
  initialPosts?: TilPostWithDetails[];
  initialTotal?: number;
  initialPopularTags?: string[];
  isAuthenticated: boolean;
}

export function TilGrid({
  initialPosts,
  initialTotal,
  initialPopularTags,
  isAuthenticated,
}: TilGridProps) {
  const [posts, setPosts] = useState<TilPostWithDetails[]>(initialPosts || []);
  const [isLoading, setIsLoading] = useState(!initialPosts);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(
    initialTotal ? Math.ceil(initialTotal / 20) : 0
  );
  const [popularTags, setPopularTags] = useState<string[]>(initialPopularTags || []);
  const [filters, setFilters] = useState<{
    query?: string;
    tag?: string;
    sort?: 'trending' | 'newest' | 'most-upvoted';
  }>({});

  const fetchPosts = useCallback(
    async (currentPage: number, currentFilters: typeof filters) => {
      setIsLoading(true);
      const result = await browseTilAction({
        query: currentFilters.query,
        tag: currentFilters.tag,
        sort: currentFilters.sort || 'trending',
        page: currentPage,
        perPage: 20,
      });

      if (result.success) {
        setPosts(result.posts);
        setTotalPages(result.pagination.totalPages);
        if (result.popularTags.length > 0) {
          setPopularTags(result.popularTags);
        }
      }
      setIsLoading(false);
    },
    []
  );

  useEffect(() => {
    if (!initialPosts) {
      fetchPosts(1, {});
    }
  }, [fetchPosts, initialPosts]);

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPage(1);
    fetchPosts(1, newFilters);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchPosts(newPage, filters);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      <TilFilters
        onFilterChange={handleFilterChange}
        popularTags={popularTags}
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border bg-muted" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-dashed p-16 text-center animate-in fade-in-50 duration-300">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Lightbulb className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No TILs found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {filters.query || filters.tag
              ? 'Try adjusting your search or filters.'
              : 'Be the first to share a Today I Learned!'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {posts.map((post, index) => (
              <TilCard
                key={post.id}
                post={post}
                isAuthenticated={isAuthenticated}
                index={index}
              />
            ))}
          </div>

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
