'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Loader2, FileText, Link2, File } from 'lucide-react';
import { getRecommendationsAction } from '@/app/actions/search';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RelatedItemsBadgeProps {
  contentId: string;
}

const typeIcons: Record<string, typeof FileText> = {
  note: FileText,
  link: Link2,
  file: File,
};

export function RelatedItemsBadge({ contentId }: RelatedItemsBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<Array<{
    id: string;
    title: string;
    type: string;
    similarity: number;
  }> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const fetchRelated = useCallback(async () => {
    if (items !== null) return; // Already fetched
    setIsLoading(true);
    setError(null);
    try {
      const result = await getRecommendationsAction(contentId, 3);
      if (result.success && result.recommendations) {
        setItems(result.recommendations);
      } else {
        setItems([]);
        setError(result.message || 'Failed to load');
      }
    } catch {
      setItems([]);
      setError('Failed to load related items');
    } finally {
      setIsLoading(false);
    }
  }, [contentId, items]);

  const handleClick = () => {
    if (!isOpen) {
      fetchRelated();
    }
    setIsOpen((prev) => !prev);
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={popoverRef}>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 transition-transform hover:scale-110"
        onClick={handleClick}
        aria-label="View related items"
        aria-expanded={isOpen}
      >
        <Sparkles className={cn(
          'h-4 w-4 transition-colors',
          isOpen ? 'text-primary' : 'text-muted-foreground hover:text-primary'
        )} />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-lg border bg-popover p-3 shadow-soft-lg animate-scale-in">
          <p className="text-xs font-medium text-muted-foreground mb-2">Related Items</p>

          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && error && (
            <p className="text-xs text-muted-foreground py-2">{error}</p>
          )}

          {!isLoading && !error && items && items.length === 0 && (
            <p className="text-xs text-muted-foreground py-2">No related items found</p>
          )}

          {!isLoading && items && items.length > 0 && (
            <div className="space-y-2">
              {items.map((item) => {
                const TypeIcon = typeIcons[item.type] || FileText;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 rounded-md p-1.5 text-xs hover:bg-accent transition-colors"
                  >
                    <TypeIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate">{item.title}</span>
                    <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {Math.round(item.similarity * 100)}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
