'use client';

import { useState } from 'react';
import { Sparkles, Plus, Loader2, FileText, Link as LinkIcon, File } from 'lucide-react';
import { suggestPathItemsAction, addItemToPathAction } from '@/app/actions/learning-paths';
import type { SuggestedItem } from '@/app/actions/learning-paths';

interface SuggestItemsPanelProps {
  pathId: string;
  onItemAdded: () => void;
}

const typeIcons: Record<string, typeof FileText> = {
  note: FileText,
  link: LinkIcon,
  file: File,
};

export function SuggestItemsPanel({ pathId, onItemAdded }: SuggestItemsPanelProps) {
  const [suggestions, setSuggestions] = useState<SuggestedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const handleSuggest = async () => {
    setLoading(true);
    setMessage('');
    const result = await suggestPathItemsAction(pathId);
    setLoading(false);

    if (result.success && result.data) {
      setSuggestions(result.data);
      if (result.data.length === 0) {
        setMessage(result.message);
      }
    } else {
      setMessage(result.message);
    }
  };

  const handleAdd = async (contentId: string) => {
    setAddingId(contentId);
    const result = await addItemToPathAction({ pathId, contentId, isOptional: false });
    if (result.success) {
      setSuggestions((prev) => prev.filter((s) => s.id !== contentId));
      onItemAdded();
    }
    setAddingId(null);
  };

  return (
    <div className="rounded-lg border border-border/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Suggestions
        </h3>
        <button
          onClick={handleSuggest}
          disabled={loading}
          className="rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Thinking...
            </span>
          ) : (
            'Get Suggestions'
          )}
        </button>
      </div>

      {message && <p className="text-xs text-muted-foreground mb-2">{message}</p>}

      {suggestions.length > 0 && (
        <div className="space-y-1">
          {suggestions.map((item) => {
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
      )}
    </div>
  );
}
