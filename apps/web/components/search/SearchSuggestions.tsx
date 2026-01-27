'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Clock, TrendingUp, Sparkles, Hash } from 'lucide-react';
import { getSearchSuggestionsAction } from '@/app/actions/search-suggestions';

type SuggestionType = 'recent' | 'popular' | 'related' | 'ai';

interface SearchSuggestion {
  text: string;
  type: SuggestionType;
}

interface SearchSuggestionsProps {
  query: string;
  onSelect: (suggestion: string) => void;
  isVisible: boolean;
  recentSearches?: string[];
}

const TYPE_ICONS: Record<SuggestionType, React.ReactNode> = {
  recent: <Clock className="h-3.5 w-3.5 text-muted-foreground" />,
  popular: <TrendingUp className="h-3.5 w-3.5 text-blue-500" />,
  related: <Hash className="h-3.5 w-3.5 text-green-500" />,
  ai: <Sparkles className="h-3.5 w-3.5 text-purple-500" />,
};

const TYPE_LABELS: Record<SuggestionType, string> = {
  recent: 'Recent',
  popular: 'Popular',
  related: 'Related',
  ai: 'Suggested',
};

export function SearchSuggestions({
  query,
  onSelect,
  isVisible,
  recentSearches = [],
}: SearchSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch suggestions with debouncing
  const fetchSuggestions = useCallback(
    async (searchQuery: string) => {
      if (!isVisible) return;

      setIsLoading(true);
      try {
        const result = await getSearchSuggestionsAction(searchQuery, recentSearches);
        if (result.success) {
          setSuggestions(result.suggestions);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [isVisible, recentSearches]
  );

  // Debounced fetch on query change
  useEffect(() => {
    if (!isVisible) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, 200);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, isVisible, fetchSuggestions]);

  // Reset selection when suggestions change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isVisible || suggestions.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            e.preventDefault();
            onSelect(suggestions[selectedIndex].text);
          }
          break;
        case 'Escape':
          setSelectedIndex(-1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, suggestions, selectedIndex, onSelect]);

  if (!isVisible) return null;

  return (
    <div
      className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-popover shadow-lg animate-in fade-in-0 slide-in-from-top-2 duration-200"
      role="listbox"
      aria-label="Search suggestions"
    >
      {isLoading && suggestions.length === 0 ? (
        <div className="flex items-center justify-center py-4 px-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : suggestions.length === 0 ? (
        <div className="flex items-center gap-2 py-4 px-3 text-sm text-muted-foreground">
          <Search className="h-4 w-4" />
          <span>No suggestions</span>
        </div>
      ) : (
        <ul className="py-1">
          {suggestions.map((suggestion, index) => (
            <li key={`${suggestion.type}-${suggestion.text}`}>
              <button
                className={`flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-accent ${
                  selectedIndex === index ? 'bg-accent' : ''
                }`}
                onClick={() => onSelect(suggestion.text)}
                onMouseEnter={() => setSelectedIndex(index)}
                role="option"
                aria-selected={selectedIndex === index}
              >
                {TYPE_ICONS[suggestion.type]}
                <span className="flex-1 text-left truncate">{suggestion.text}</span>
                <span className="text-xs text-muted-foreground">
                  {TYPE_LABELS[suggestion.type]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
