'use client';

import { useState, useCallback } from 'react';
import { X, Search, Plus, FileText, Link as LinkIcon, File, Loader2 } from 'lucide-react';
import { getPathContentPickerAction, addItemToPathAction } from '@/app/actions/learning-paths';
import type { SuggestedItem } from '@/app/actions/learning-paths';

interface ContentPickerDialogProps {
  open: boolean;
  onClose: () => void;
  pathId: string;
  onItemAdded: () => void;
}

const typeIcons: Record<string, typeof FileText> = {
  note: FileText,
  link: LinkIcon,
  file: File,
};

export function ContentPickerDialog({
  open,
  onClose,
  pathId,
  onItemAdded,
}: ContentPickerDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SuggestedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      setQuery(searchQuery);
      if (searchQuery.trim().length < 1) {
        setResults([]);
        return;
      }
      setLoading(true);
      const result = await getPathContentPickerAction(pathId, searchQuery.trim());
      if (result.success && result.data) {
        setResults(result.data);
      }
      setLoading(false);
    },
    [pathId]
  );

  const handleAdd = async (contentId: string) => {
    setAddingId(contentId);
    const result = await addItemToPathAction({ pathId, contentId, isOptional: false });
    if (result.success) {
      setResults((prev) => prev.filter((r) => r.id !== contentId));
      onItemAdded();
    }
    setAddingId(null);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-lg border border-border bg-background p-6 shadow-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add Content</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted" aria-label="Close dialog">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm"
            placeholder="Search your content..."
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-1">
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && results.length === 0 && query.trim() && (
            <p className="text-center text-sm text-muted-foreground py-8">No results found</p>
          )}

          {!loading &&
            results.map((item) => {
              const TypeIcon = typeIcons[item.type] ?? FileText;
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-md p-2 hover:bg-muted"
                >
                  <TypeIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="flex-1 text-sm truncate">{item.title}</span>
                  <button
                    onClick={() => handleAdd(item.id)}
                    disabled={addingId === item.id}
                    className="rounded-md p-1 hover:bg-primary/10 text-primary"
                    aria-label={`Add ${item.title}`}
                  >
                    {addingId === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </button>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
