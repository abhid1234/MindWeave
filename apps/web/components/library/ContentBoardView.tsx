'use client';

import type { ContentType } from '@/lib/db/schema';
import { SelectableContentCard } from './SelectableContentCard';

type ContentItem = {
  id: string;
  type: ContentType;
  title: string;
  body: string | null;
  url: string | null;
  tags: string[];
  autoTags: string[];
  createdAt: Date;
  metadata: {
    fileType?: string;
    fileSize?: number;
    filePath?: string;
    fileName?: string;
    [key: string]: unknown;
  } | null;
  isShared: boolean;
  shareId: string | null;
  isFavorite: boolean;
  summary?: string | null;
};

type ContentBoardViewProps = {
  items: ContentItem[];
  allTags: string[];
};

const columns: { type: ContentType; label: string; colorClass: string }[] = [
  { type: 'note', label: 'Notes', colorClass: 'bg-note/10 text-note dark:bg-note/20' },
  { type: 'link', label: 'Links', colorClass: 'bg-link/10 text-link dark:bg-link/20' },
  { type: 'file', label: 'Files', colorClass: 'bg-file/10 text-file dark:bg-file/20' },
];

export function ContentBoardView({ items, allTags }: ContentBoardViewProps) {
  const grouped = {
    note: items.filter((item) => item.type === 'note'),
    link: items.filter((item) => item.type === 'link'),
    file: items.filter((item) => item.type === 'file'),
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map(({ type, label, colorClass }) => (
        <div key={type} className="flex-shrink-0 w-80 lg:flex-1 min-w-[280px]">
          {/* Column header */}
          <div className="mb-3 flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>
              {label}
            </span>
            <span className="text-xs text-muted-foreground">
              {grouped[type].length}
            </span>
          </div>

          {/* Column body */}
          <div className="space-y-3">
            {grouped[type].length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">No {label.toLowerCase()}</p>
              </div>
            ) : (
              grouped[type].map((item, index) => (
                <div
                  key={item.id}
                  className="animate-in fade-in-50 slide-in-from-bottom-4 duration-300"
                  style={{ animationDelay: `${Math.min(index * 50, 300)}ms`, animationFillMode: 'backwards' }}
                >
                  <SelectableContentCard {...item} allTags={allTags} />
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
