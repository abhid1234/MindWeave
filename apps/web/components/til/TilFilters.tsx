'use client';

import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

type TilSortOption = 'trending' | 'newest' | 'most-upvoted';

const SORT_OPTIONS: { value: TilSortOption; label: string }[] = [
  { value: 'trending', label: 'Trending' },
  { value: 'newest', label: 'Newest' },
  { value: 'most-upvoted', label: 'Top' },
];

interface TilFiltersProps {
  onFilterChange: (filters: {
    query?: string;
    tag?: string;
    sort?: TilSortOption;
  }) => void;
  popularTags?: string[];
  initialSort?: TilSortOption;
}

export function TilFilters({
  onFilterChange,
  popularTags = [],
  initialSort = 'trending',
}: TilFiltersProps) {
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [sort, setSort] = useState<TilSortOption>(initialSort);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      onFilterChange({
        query: query || undefined,
        tag: selectedTag || undefined,
        sort,
      });
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, selectedTag, sort]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search TILs..."
            className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Tag dropdown */}
        {popularTags.length > 0 && (
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            aria-label="Tag filter"
          >
            <option value="">All Tags</option>
            {popularTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        )}

        {/* Sort */}
        <div className="flex gap-1 rounded-lg border border-input bg-background p-0.5">
          {SORT_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={sort === option.value ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setSort(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
