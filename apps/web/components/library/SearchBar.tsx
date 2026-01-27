'use client';

import { Search, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { SearchSuggestions } from '../search/SearchSuggestions';

// Local storage key for recent searches
const RECENT_SEARCHES_KEY = 'mindweave_recent_searches';
const MAX_RECENT_SEARCHES = 5;

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(search: string): void {
  if (typeof window === 'undefined' || !search.trim()) return;
  try {
    const recent = getRecentSearches();
    const filtered = recent.filter((s) => s !== search);
    const updated = [search, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Debounce search updates
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (query.trim()) {
        params.set('query', query.trim());
        saveRecentSearch(query.trim());
      } else {
        params.delete('query');
      }

      router.push(`/dashboard/library${params.toString() ? `?${params.toString()}` : ''}`);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query, router, searchParams]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClear = () => {
    setQuery('');
  };

  const handleSelectSuggestion = useCallback((suggestion: string) => {
    setQuery(suggestion);
    setIsFocused(false);
    saveRecentSearch(suggestion);
    setRecentSearches(getRecentSearches());
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
      <Input
        type="text"
        placeholder="Search notes, links, and files..."
        value={query}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        className="pl-9 pr-9"
        role="combobox"
        aria-expanded={isFocused}
        aria-haspopup="listbox"
        aria-autocomplete="list"
      />
      {query && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0 z-10"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      <SearchSuggestions
        query={query}
        onSelect={handleSelectSuggestion}
        isVisible={isFocused}
        recentSearches={recentSearches}
      />
    </div>
  );
}
