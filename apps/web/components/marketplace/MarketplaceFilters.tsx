'use client';

import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MarketplaceCategory } from '@/lib/db/schema';
import type { MarketplaceSortOption } from '@/types/marketplace';

const CATEGORIES: { value: MarketplaceCategory | ''; label: string }[] = [
  { value: '', label: 'All Categories' },
  { value: 'programming', label: 'Programming' },
  { value: 'design', label: 'Design' },
  { value: 'business', label: 'Business' },
  { value: 'science', label: 'Science' },
  { value: 'learning', label: 'Learning' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'career', label: 'Career' },
  { value: 'health', label: 'Health' },
  { value: 'other', label: 'Other' },
];

const SORT_OPTIONS: { value: MarketplaceSortOption; label: string }[] = [
  { value: 'trending', label: 'Trending' },
  { value: 'newest', label: 'Newest' },
  { value: 'most-cloned', label: 'Most Cloned' },
];

interface MarketplaceFiltersProps {
  onFilterChange: (filters: {
    query?: string;
    category?: MarketplaceCategory;
    sort?: MarketplaceSortOption;
  }) => void;
  initialQuery?: string;
  initialCategory?: MarketplaceCategory;
  initialSort?: MarketplaceSortOption;
}

export function MarketplaceFilters({
  onFilterChange,
  initialQuery = '',
  initialCategory,
  initialSort = 'trending',
}: MarketplaceFiltersProps) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<MarketplaceCategory | ''>(initialCategory || '');
  const [sort, setSort] = useState<MarketplaceSortOption>(initialSort);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      onFilterChange({
        query: query || undefined,
        category: category || undefined,
        sort,
      });
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, category, sort]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search collections..."
          className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Category */}
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as MarketplaceCategory | '')}
        className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        aria-label="Category filter"
      >
        {CATEGORIES.map((cat) => (
          <option key={cat.value} value={cat.value}>
            {cat.label}
          </option>
        ))}
      </select>

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
  );
}
