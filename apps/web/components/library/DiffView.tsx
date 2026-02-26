'use client';

import { useState } from 'react';
import { computeLineDiff, computeWordDiff, type DiffPart } from '@/lib/diff';
import { Button } from '@/components/ui/button';

type DiffViewMode = 'inline' | 'side-by-side';

type DiffViewProps = {
  oldText: string;
  newText: string;
  oldLabel?: string;
  newLabel?: string;
  mode?: DiffViewMode;
};

function DiffPartSpan({ part }: { part: DiffPart }) {
  if (part.added) {
    return (
      <span className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" data-testid="diff-added">
        {part.value}
      </span>
    );
  }
  if (part.removed) {
    return (
      <span className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 line-through" data-testid="diff-removed">
        {part.value}
      </span>
    );
  }
  return <span>{part.value}</span>;
}

export function DiffView({
  oldText,
  newText,
  oldLabel = 'Previous',
  newLabel = 'Current',
  mode: initialMode = 'inline',
}: DiffViewProps) {
  const [mode, setMode] = useState<DiffViewMode>(initialMode);

  if (oldText === newText) {
    return <p className="text-xs text-muted-foreground italic">No changes</p>;
  }

  if (mode === 'side-by-side') {
    const lineDiff = computeLineDiff(oldText, newText);
    const oldLines: DiffPart[] = [];
    const newLines: DiffPart[] = [];

    for (const part of lineDiff) {
      if (part.removed) {
        oldLines.push(part);
      } else if (part.added) {
        newLines.push(part);
      } else {
        oldLines.push(part);
        newLines.push(part);
      }
    }

    return (
      <div className="space-y-2">
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={() => setMode('inline')}
            data-testid="mode-toggle"
          >
            Switch to Inline
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">{oldLabel}</p>
            <pre className="text-xs whitespace-pre-wrap rounded-md border bg-muted/50 p-2 max-h-48 overflow-y-auto">
              {oldLines.map((part, i) => (
                <DiffPartSpan key={i} part={part} />
              ))}
            </pre>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">{newLabel}</p>
            <pre className="text-xs whitespace-pre-wrap rounded-md border bg-muted/50 p-2 max-h-48 overflow-y-auto">
              {newLines.map((part, i) => (
                <DiffPartSpan key={i} part={part} />
              ))}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  // Inline mode: word-level diff
  const wordDiff = computeWordDiff(oldText, newText);

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs"
          onClick={() => setMode('side-by-side')}
          data-testid="mode-toggle"
        >
          Switch to Side-by-Side
        </Button>
      </div>
      <pre className="text-xs whitespace-pre-wrap rounded-md border bg-muted/50 p-2 max-h-48 overflow-y-auto">
        {wordDiff.map((part, i) => (
          <DiffPartSpan key={i} part={part} />
        ))}
      </pre>
    </div>
  );
}
