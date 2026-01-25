'use client';

import { IMPORT_SOURCES, ImportSource, ImportSourceConfig } from '@/lib/import/types';
import { cn } from '@/lib/utils';
import { Bookmark, BookmarkCheck, FileText, StickyNote, LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Bookmark: Bookmark,
  BookmarkCheck: BookmarkCheck,
  FileText: FileText,
  StickyNote: StickyNote,
};

interface ImportSourceSelectorProps {
  selected: ImportSource | null;
  onSelect: (source: ImportSource) => void;
}

export function ImportSourceSelector({ selected, onSelect }: ImportSourceSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {IMPORT_SOURCES.map((source) => (
        <SourceCard
          key={source.id}
          source={source}
          isSelected={selected === source.id}
          onClick={() => onSelect(source.id)}
        />
      ))}
    </div>
  );
}

interface SourceCardProps {
  source: ImportSourceConfig;
  isSelected: boolean;
  onClick: () => void;
}

function SourceCard({ source, isSelected, onClick }: SourceCardProps) {
  const Icon = ICON_MAP[source.icon] || FileText;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-start gap-4 rounded-lg border p-4 text-left transition-all hover:border-primary/50 hover:bg-accent/50',
        isSelected && 'border-primary bg-accent ring-2 ring-primary ring-offset-2'
      )}
    >
      <div
        className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted',
          isSelected && 'bg-primary/10 text-primary'
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-medium">{source.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{source.description}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Accepts: {source.acceptedExtensions.join(', ')}
        </p>
      </div>
    </button>
  );
}
