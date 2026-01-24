'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { semanticSearchAction, type SemanticSearchResult } from '@/app/actions/search';
import { Input } from '@/components/ui/input';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) return;

    setError(null);
    setHasSearched(true);

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

  const formatSimilarity = (similarity: number) => {
    return `${Math.round(similarity * 100)}%`;
  };

  return (
    <div>
      {/* Search Mode Toggle */}
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => handleModeChange('keyword')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'keyword'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          Keyword Search
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('semantic')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'semantic'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          Semantic Search (AI)
        </button>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              mode === 'keyword'
                ? 'Search by keywords...'
                : 'Describe what you\'re looking for...'
            }
            className="flex-1"
            autoFocus
          />
          <button
            type="submit"
            disabled={isPending || !query.trim()}
            className="rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Searching...' : 'Search'}
          </button>
        </div>
        {mode === 'semantic' && (
          <p className="mt-2 text-sm text-muted-foreground">
            Semantic search finds content by meaning, not just exact keywords.
            Try describing what you&apos;re looking for in natural language.
          </p>
        )}
      </form>

      {/* Error Message */}
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
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
            <div className="rounded-lg border border-dashed p-12 text-center">
              <p className="text-muted-foreground">
                No results found. Try rephrasing your search or use keyword search.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border bg-card p-4 hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{item.title}</h3>
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                          {item.type}
                        </span>
                        <span className="rounded-full bg-green-100 dark:bg-green-900 px-2 py-0.5 text-xs text-green-700 dark:text-green-300 font-medium">
                          {formatSimilarity(item.similarity)} match
                        </span>
                      </div>
                      {item.body && (
                        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                          {item.body}
                        </p>
                      )}
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 block text-sm text-primary hover:underline"
                        >
                          {item.url}
                        </a>
                      )}
                      {((item.tags?.length ?? 0) > 0 || (item.autoTags?.length ?? 0) > 0) && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(item.tags ?? []).map((tag: string) => (
                            <span
                              key={tag}
                              className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                            >
                              {tag}
                            </span>
                          ))}
                          {(item.autoTags ?? []).map((tag: string) => (
                            <span
                              key={`auto-${tag}`}
                              className="rounded-full bg-secondary px-2 py-1 text-xs font-medium"
                            >
                              {tag} (AI)
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="ml-4 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
