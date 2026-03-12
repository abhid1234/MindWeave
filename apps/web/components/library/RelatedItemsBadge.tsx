'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2, FileText, Link2, File } from 'lucide-react';
import { getRecommendationsAction } from '@/app/actions/search';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface RelatedItemsBadgeProps {
  contentId: string;
}

const typeIcons: Record<string, typeof FileText> = {
  note: FileText,
  link: Link2,
  file: File,
};

export function RelatedItemsBadge({ contentId }: RelatedItemsBadgeProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<Array<{
    id: string;
    title: string;
    type: string;
    similarity: number;
  }> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        disabled
        aria-label="View related items"
      >
        <Sparkles className="h-4 w-4 text-muted-foreground/50" />
      </Button>
    );
  }

  return (
    <DropdownMenu onOpenChange={(open) => open && fetchRelated()}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 transition-transform hover:scale-110"
          aria-label="View related items"
        >
          <Sparkles className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-64 p-3 shadow-soft-lg"
        sideOffset={8}
      >
        <p className="text-xs font-medium text-muted-foreground mb-2 px-2">
          {items && items.length > 0 && items.some(i => i.similarity > 0) 
            ? 'Related Items' 
            : 'Recent Items'}
        </p>

        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && error && (
          <p className="text-xs text-muted-foreground py-2 px-2 cursor-default">{error}</p>
        )}

        {!isLoading && !error && items && items.length === 0 && (
          <p className="text-xs text-muted-foreground py-2 px-2 cursor-default">No related items found</p>
        )}

        {!isLoading && items && items.length > 0 && (
          <div className="space-y-1">
            {items.map((item) => {
              const TypeIcon = typeIcons[item.type] || FileText;
              return (
                <DropdownMenuItem
                  key={item.id}
                  className="flex items-center gap-2 text-xs p-1.5 cursor-pointer"
                  onClick={() => router.push(`/dashboard/library?highlight=${item.id}`)}
                >
                  <TypeIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{item.title}</span>
                  {item.similarity > 0 && (
                    <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {Math.round(item.similarity * 100)}%
                    </span>
                  )}
                </DropdownMenuItem>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
