'use client';

import { useState } from 'react';
import { X, Square } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export interface StructuredNoteData {
  title: string;
  body: string;
  tags: string[];
  actionItems: string[];
}

interface StructuredNoteCardProps {
  note: StructuredNoteData;
  index: number;
  onRemove: () => void;
  onUpdate: (note: StructuredNoteData) => void;
}

const BORDER_COLORS = [
  'border-l-blue-500',
  'border-l-emerald-500',
  'border-l-violet-500',
  'border-l-amber-500',
  'border-l-rose-500',
  'border-l-cyan-500',
  'border-l-orange-500',
  'border-l-pink-500',
];

export function StructuredNoteCard({ note, index, onRemove, onUpdate }: StructuredNoteCardProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(note.title);
  const borderColor = BORDER_COLORS[index % BORDER_COLORS.length];

  const handleTitleSave = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== note.title) {
      onUpdate({ ...note, title: trimmed });
    } else {
      setEditTitle(note.title);
    }
    setIsEditingTitle(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdate({ ...note, tags: note.tags.filter((t) => t !== tagToRemove) });
  };

  const handleToggleActionItem = (_idx: number) => {
    // Toggle is visual only — action items are just strings
  };

  return (
    <Card
      className={`border-l-4 ${borderColor} animate-fade-up`}
      style={{ animationDelay: `${index * 100}ms` }}
      data-testid={`structured-note-${index}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          {isEditingTitle ? (
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSave();
                if (e.key === 'Escape') {
                  setEditTitle(note.title);
                  setIsEditingTitle(false);
                }
              }}
              className="flex-1 rounded border border-border bg-background px-2 py-1 text-base font-semibold focus:border-primary focus:outline-none"
              autoFocus
              aria-label="Edit note title"
            />
          ) : (
            <h3
              className="flex-1 text-base font-semibold cursor-pointer hover:text-primary transition-colors"
              onClick={() => setIsEditingTitle(true)}
              title="Click to edit title"
            >
              {note.title}
            </h3>
          )}

          <button
            onClick={onRemove}
            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            aria-label="Remove note"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Body */}
        {note.body && (
          <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-muted-foreground leading-relaxed">
            {note.body}
          </div>
        )}

        {/* Tags */}
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-0.5 rounded-full hover:bg-destructive/20 hover:text-destructive"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Action Items */}
        {note.actionItems.length > 0 && (
          <div className="space-y-1.5 border-t border-border pt-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Action Items</p>
            {note.actionItems.map((item, idx) => (
              <label
                key={idx}
                className="flex items-start gap-2 text-sm cursor-pointer group"
              >
                <button
                  onClick={() => handleToggleActionItem(idx)}
                  className="mt-0.5 text-muted-foreground group-hover:text-primary"
                  aria-label={`Toggle action item: ${item}`}
                >
                  <Square className="h-4 w-4" />
                </button>
                <span>{item}</span>
              </label>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
