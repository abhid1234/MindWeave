'use client';

import { useState, useEffect, useTransition } from 'react';
import { Search, FileText, Link, File, X } from 'lucide-react';
import { getContentForSelectionAction } from '@/app/actions/post-generator';

interface ContentItem {
  id: string;
  title: string;
  type: string;
  tags: string[];
  createdAt: Date;
}

interface ContentSelectorProps {
  selectedItems: ContentItem[];
  onSelectionChange: (items: ContentItem[]) => void;
}

const typeIcons: Record<string, typeof FileText> = {
  note: FileText,
  link: Link,
  file: File,
};

export function ContentSelector({ selectedItems, onSelectionChange }: ContentSelectorProps) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [search, setSearch] = useState('');
  const [isPending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadContent();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function loadContent(query?: string) {
    startTransition(async () => {
      const result = await getContentForSelectionAction(query);
      if (result.success) {
        setItems(result.items);
      }
      setLoaded(true);
    });
  }

  function handleSearch(value: string) {
    setSearch(value);
    loadContent(value || undefined);
  }

  function toggleItem(item: ContentItem) {
    const isSelected = selectedItems.some((s) => s.id === item.id);
    if (isSelected) {
      onSelectionChange(selectedItems.filter((s) => s.id !== item.id));
    } else if (selectedItems.length < 5) {
      onSelectionChange([...selectedItems, item]);
    }
  }

  function removeItem(id: string) {
    onSelectionChange(selectedItems.filter((s) => s.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Select Content</h3>
        <span className="text-xs text-muted-foreground">
          {selectedItems.length}/5 selected
        </span>
      </div>

      {/* Selected chips */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedItems.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
            >
              {item.title.length > 30 ? item.title.slice(0, 30) + '...' : item.title}
              <button
                onClick={() => removeItem(item.id)}
                className="ml-1 rounded-full p-0.5 hover:bg-primary/20"
                aria-label={`Remove ${item.title}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search your content..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Content list */}
      <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-border">
        {isPending && !loaded ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : items.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {search ? 'No content matches your search.' : 'No content yet. Capture some content first.'}
          </div>
        ) : (
          items.map((item) => {
            const isSelected = selectedItems.some((s) => s.id === item.id);
            const Icon = typeIcons[item.type] || FileText;
            const isDisabled = !isSelected && selectedItems.length >= 5;

            return (
              <button
                key={item.id}
                onClick={() => toggleItem(item)}
                disabled={isDisabled}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                  isSelected
                    ? 'bg-primary/10 text-primary'
                    : isDisabled
                      ? 'cursor-not-allowed opacity-50'
                      : 'hover:bg-accent'
                }`}
              >
                <div
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border'
                  }`}
                >
                  {isSelected && (
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{item.title}</span>
                <span className="ml-auto shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  {item.type}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
