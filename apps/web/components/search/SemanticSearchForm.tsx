'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TextSearch, Sparkles, Search, FileQuestion } from 'lucide-react';
import { semanticSearchAction, type SemanticSearchResult } from '@/app/actions/search';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { SearchSuggestions } from './SearchSuggestions';
import { SearchResultCard } from './SearchResultCard';

type SearchMode = 'keyword' | 'semantic';

interface SemanticSearchFormProps {
  initialQuery?: string;
  initialMode?: SearchMode;
}

export function SemanticSearchForm({
  initialQuery = '',
  initialMode = 'keyword',
}: SemanticSearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(initialQuery);
  const [mode, setMode] = useState<SearchMode>(initialMode);
  const [results, setResults] = useState<SemanticSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputContainerRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('mindweave-recent-searches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored).slice(0, 5));
      } catch {
        // Ignore parsing errors
      }
    }
  }, []);

  // Save search to recent searches
  const saveRecentSearch = (searchQuery: string) => {
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('mindweave-recent-searches', JSON.stringify(updated));
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputContainerRef.current && !inputContainerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) return;

    setError(null);
    setHasSearched(true);
    setIsFocused(false);
    saveRecentSearch(query.trim());

    if (mode === 'keyword') {
      // For keyword search, update URL and let server handle it
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('q', query.trim());
        params.set('mode', 'keyword');
        router.push(`/dashboard/search?${params.toString()}`);
      });
    } else {
      // For semantic search, call the action directly
      startTransition(async () => {
        const response = await semanticSearchAction(query.trim(), 20);

        if (!response.success) {
          setError(response.message || 'Search failed');
          setResults([]);
        } else {
          setResults(response.results);
          // Update URL to reflect the search
          const params = new URLSearchParams();
          params.set('q', query.trim());
          params.set('mode', 'semantic');
          router.replace(`/dashboard/search?${params.toString()}`, { scroll: false });
        }
      });
    }
  };

  const handleModeChange = (newMode: SearchMode) => {
    setMode(newMode);
    setResults([]);
    setHasSearched(false);
    setError(null);
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setQuery(suggestion);
    setIsFocused(false);
    // Auto-submit the search
    saveRecentSearch(suggestion);
    setHasSearched(true);
    setError(null);

    if (mode === 'keyword') {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('q', suggestion);
        params.set('mode', 'keyword');
        router.push(`/dashboard/search?${params.toString()}`);
      });
    } else {
      startTransition(async () => {
        const response = await semanticSearchAction(suggestion, 20);
        if (!response.success) {
          setError(response.message || 'Search failed');
          setResults([]);
        } else {
          setResults(response.results);
          const params = new URLSearchParams();
          params.set('q', suggestion);
          params.set('mode', 'semantic');
          router.replace(`/dashboard/search?${params.toString()}`, { scroll: false });
        }
      });
    }
  };

  return (
    <div>
      {/* Search Mode Toggle — Pill Segmented Control */}
      <div className="mb-4 inline-flex rounded-lg bg-muted p-1">
        <button
          type="button"
          onClick={() => handleModeChange('keyword')}
          className={cn(
            'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200',
            mode === 'keyword'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <TextSearch className="h-4 w-4" />
          Keyword Search
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('semantic')}
          className={cn(
            'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200',
            mode === 'semantic'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Sparkles className="h-4 w-4" />
          Semantic Search (AI)
        </button>
      </div>

      {/* Search Form — Wrapped in Card */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <form onSubmit={handleSubmit}>
            <div className="flex gap-2">
              <div className="relative flex-1" ref={inputContainerRef}>
                <Input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  placeholder={
                    mode === 'keyword'
                      ? 'Search by keywords...'
                      : 'Describe what you\'re looking for...'
                  }
                  className="w-full"
                  autoFocus
                />
                <SearchSuggestions
                  query={query}
                  onSelect={handleSuggestionSelect}
                  isVisible={isFocused && !hasSearched}
                  recentSearches={recentSearches}
                />
              </div>
              <Button
                type="submit"
                disabled={isPending || !query.trim()}
              >
                <Search className="h-4 w-4" />
                {isPending ? 'Searching...' : 'Search'}
              </Button>
            </div>
            {mode === 'semantic' && (
              <p className="mt-2 text-sm text-muted-foreground">
                Semantic search finds content by meaning, not just exact keywords.
                Try describing what you&apos;re looking for in natural language.
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      {/* Loading Skeletons (semantic search) */}
      {mode === 'semantic' && isPending && (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="animate-fade-up"
              style={{ animationDelay: `${i * 75}ms`, animationFillMode: 'backwards' }}
            >
              <Card className="border-l-4 border-l-muted p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-5 w-14 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-32" />
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Results (for semantic search) */}
      {mode === 'semantic' && hasSearched && !isPending && (
        <div>
          <p className="mb-4 text-sm text-muted-foreground">
            Found {results.length} result{results.length !== 1 ? 's' : ''}
            {query && ` for "${query}"`}
          </p>

          {results.length === 0 ? (
            <div className="rounded-xl border bg-card p-12 text-center shadow-soft animate-fade-up">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <FileQuestion className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold">No results found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Try rephrasing your search or use keyword search.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((item, index) => (
                <div
                  key={item.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'backwards' }}
                >
                  <SearchResultCard
                    item={item}
                    query={query}
                    similarity={item.similarity}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
