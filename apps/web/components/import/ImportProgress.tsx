'use client';

import { Loader2 } from 'lucide-react';

interface ImportProgressProps {
  itemCount: number;
  isImporting: boolean;
}

export function ImportProgress({ itemCount, isImporting }: ImportProgressProps) {
  if (!isImporting) return null;

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border bg-muted/50 p-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-sm font-medium">Importing {itemCount} items...</p>
      <p className="mt-2 text-xs text-muted-foreground">
        This may take a moment. AI tagging and embeddings will be generated in the background.
      </p>
    </div>
  );
}
