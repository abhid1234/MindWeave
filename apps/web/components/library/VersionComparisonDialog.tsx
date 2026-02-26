'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { DiffView } from './DiffView';
import type { ContentVersionItem } from '@/app/actions/content';

type CurrentContent = {
  title: string;
  body: string | null;
  url: string | null;
};

type VersionComparisonDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versions: ContentVersionItem[];
  currentContent: CurrentContent;
};

type VersionOption = {
  id: string;
  label: string;
  title: string;
  body: string | null;
};

export function VersionComparisonDialog({
  open,
  onOpenChange,
  versions,
  currentContent,
}: VersionComparisonDialogProps) {
  const [leftId, setLeftId] = useState('');
  const [rightId, setRightId] = useState('current');

  const options: VersionOption[] = [
    { id: 'current', label: 'Current version', title: currentContent.title, body: currentContent.body },
    ...versions.map((v) => ({
      id: v.id,
      label: `v${v.versionNumber}`,
      title: v.title,
      body: v.body,
    })),
  ];

  const leftVersion = options.find((o) => o.id === leftId);
  const rightVersion = options.find((o) => o.id === rightId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compare Versions</DialogTitle>
          <DialogDescription>
            Select two versions to compare changes between them.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Left</label>
            <select
              value={leftId}
              onChange={(e) => setLeftId(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              data-testid="left-version-select"
            >
              <option value="">Select version...</option>
              {options.filter((o) => o.id !== rightId).map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
          <span className="text-muted-foreground mt-5">vs</span>
          <div className="flex-1">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Right</label>
            <select
              value={rightId}
              onChange={(e) => setRightId(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              data-testid="right-version-select"
            >
              <option value="">Select version...</option>
              {options.filter((o) => o.id !== leftId).map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {leftVersion && rightVersion ? (
          <div className="space-y-4">
            {leftVersion.title !== rightVersion.title && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">Title</h4>
                <DiffView
                  oldText={leftVersion.title}
                  newText={rightVersion.title}
                  oldLabel={leftVersion.label}
                  newLabel={rightVersion.label}
                />
              </div>
            )}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-1">Body</h4>
              <DiffView
                oldText={leftVersion.body ?? ''}
                newText={rightVersion.body ?? ''}
                oldLabel={leftVersion.label}
                newLabel={rightVersion.label}
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            Select two versions above to see their differences.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
