'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { BulkSelectionProvider } from './BulkSelectionContext';
import { BulkActionsBar } from './BulkActionsBar';
import { SelectableContentCard } from './SelectableContentCard';
import { SelectionToggle } from './SelectionToggle';
import { ExportDialog } from './ExportDialog';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { ContentType } from '@/lib/db/schema';

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
};

type LibraryContentProps = {
  items: ContentItem[];
  allTags: string[];
  hasFilters: boolean;
};

export function LibraryContent({ items, allTags, hasFilters }: LibraryContentProps) {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const allIds = items.map((item) => item.id);

  return (
    <BulkSelectionProvider>
      {/* Selection Toggle and Count */}
      {items.length > 0 && (
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Showing {items.length} item{items.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportDialog(true)}
            >
              <Download className="mr-2 h-4 w-4" />
              Export All
            </Button>
            <SelectionToggle allIds={allIds} />
          </div>
        </div>
      )}

      {/* Content Grid */}
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            {hasFilters
              ? 'No content matches your filters.'
              : 'No content yet. Start capturing your ideas!'}
          </p>
          <Link
            href="/dashboard/capture"
            className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Create Content
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pb-20">
          {items.map((item) => (
            <SelectableContentCard key={item.id} {...item} allTags={allTags} />
          ))}
        </div>
      )}

      {/* Bulk Actions Bar */}
      <BulkActionsBar />

      {/* Export All Dialog */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        itemCount={items.length}
      />
    </BulkSelectionProvider>
  );
}
