'use client';

import { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  FileText,
  Link as LinkIcon,
  File,
  Loader2,
} from 'lucide-react';
import {
  toggleItemProgressAction,
  removeItemFromPathAction,
  reorderPathItemsAction,
} from '@/app/actions/learning-paths';
import type { LearningPathDetailItem } from '@/app/actions/learning-paths';

interface PathItemListProps {
  pathId: string;
  items: LearningPathDetailItem[];
  onUpdate: () => void;
}

const typeIcons: Record<string, typeof FileText> = {
  note: FileText,
  link: LinkIcon,
  file: File,
};

export function PathItemList({ pathId, items, onUpdate }: PathItemListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleToggle = async (contentId: string) => {
    setLoadingId(contentId);
    await toggleItemProgressAction({ pathId, contentId });
    setLoadingId(null);
    onUpdate();
  };

  const handleRemove = async (itemId: string) => {
    setLoadingId(itemId);
    await removeItemFromPathAction(itemId, pathId);
    setLoadingId(null);
    onUpdate();
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newOrder = [...items];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    await reorderPathItemsAction({
      pathId,
      itemIds: newOrder.map((i) => i.id),
    });
    onUpdate();
  };

  const handleMoveDown = async (index: number) => {
    if (index >= items.length - 1) return;
    const newOrder = [...items];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    await reorderPathItemsAction({
      pathId,
      itemIds: newOrder.map((i) => i.id),
    });
    onUpdate();
  };

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
        <p className="text-sm">No items yet. Add content to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        const TypeIcon = typeIcons[item.contentType] ?? FileText;
        const isLoading = loadingId === item.contentId || loadingId === item.id;

        return (
          <div
            key={item.id}
            className={`flex items-center gap-3 rounded-lg border border-border/50 p-3 transition-colors ${
              item.isCompleted ? 'bg-muted/30' : 'bg-card'
            }`}
          >
            <span className="text-xs text-muted-foreground font-mono w-6 text-center">
              {index + 1}
            </span>

            <button
              onClick={() => handleToggle(item.contentId)}
              disabled={isLoading}
              className="flex-shrink-0"
              aria-label={item.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <div
                  className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                    item.isCompleted
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'border-muted-foreground hover:border-primary'
                  }`}
                >
                  {item.isCompleted && (
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              )}
            </button>

            <TypeIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />

            <div className="flex-1 min-w-0">
              <span
                className={`text-sm ${item.isCompleted ? 'line-through text-muted-foreground' : ''}`}
              >
                {item.contentTitle}
              </span>
              {item.isOptional && (
                <span className="ml-2 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  optional
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handleMoveUp(index)}
                disabled={index === 0}
                className="rounded p-1 hover:bg-muted disabled:opacity-30"
                aria-label="Move up"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleMoveDown(index)}
                disabled={index >= items.length - 1}
                className="rounded p-1 hover:bg-muted disabled:opacity-30"
                aria-label="Move down"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleRemove(item.id)}
                disabled={isLoading}
                className="rounded p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                aria-label="Remove item"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
