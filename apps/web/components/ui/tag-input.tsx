'use client';

import * as React from 'react';
import { Badge } from './badge';
import { Input } from './input';
import { cn } from '@/lib/utils';

export interface TagInputProps {
  tags: string[];
  suggestions?: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  className?: string;
}

export function TagInput({
  tags,
  suggestions = [],
  onChange,
  placeholder = 'Add tags...',
  maxTags,
  className,
}: TagInputProps) {
  const [inputValue, setInputValue] = React.useState('');
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Filter suggestions based on input and exclude already selected tags
  const filteredSuggestions = React.useMemo(() => {
    if (!inputValue.trim()) return [];
    const lowerInput = inputValue.toLowerCase();
    return suggestions
      .filter((suggestion) =>
        suggestion.toLowerCase().includes(lowerInput) &&
        !tags.includes(suggestion)
      )
      .slice(0, 5);
  }, [inputValue, suggestions, tags]);

  // Handle adding a tag
  const addTag = React.useCallback((tag: string) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag) return;
    if (tags.includes(trimmedTag)) return;
    if (maxTags && tags.length >= maxTags) return;

    onChange([...tags, trimmedTag]);
    setInputValue('');
    setShowSuggestions(false);
  }, [tags, maxTags, onChange]);

  // Handle removing a tag
  const removeTag = React.useCallback((tagToRemove: string) => {
    onChange(tags.filter((tag) => tag !== tagToRemove));
  }, [tags, onChange]);

  // Handle keyboard events
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredSuggestions.length > 0 && showSuggestions) {
        addTag(filteredSuggestions[0]);
      } else {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }, [inputValue, tags, filteredSuggestions, showSuggestions, addTag, removeTag]);

  // Close suggestions when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="flex flex-wrap gap-2 p-2 rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="default"
            removable
            onRemove={() => removeTag(tag)}
          >
            {tag}
          </Badge>
        ))}
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] border-0 p-0 h-6 focus-visible:ring-0 focus-visible:ring-offset-0"
          disabled={maxTags ? tags.length >= maxTags : false}
        />
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-input bg-popover shadow-md">
          <ul className="py-1">
            {filteredSuggestions.map((suggestion) => (
              <li key={suggestion}>
                <button
                  type="button"
                  onClick={() => addTag(suggestion)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
