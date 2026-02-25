'use client';

import { Loader2, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImportProgressProps {
  itemCount: number;
  isImporting: boolean;
  /** Number of successfully imported items */
  imported?: number;
  /** Number of skipped items */
  skipped?: number;
  /** Number of failed items */
  failed?: number;
  /** Total items to process */
  total?: number;
}

export function ImportProgress({
  itemCount,
  isImporting,
  imported,
  skipped,
  failed,
  total,
}: ImportProgressProps) {
  if (!isImporting) return null;

  const hasDetailedProgress = imported !== undefined && total !== undefined && total > 0;
  const processed = hasDetailedProgress ? (imported || 0) + (skipped || 0) + (failed || 0) : 0;
  const progressPercent = hasDetailedProgress ? Math.round((processed / total) * 100) : 0;

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border bg-muted/50 p-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-sm font-medium">Importing {itemCount} items...</p>

      {hasDetailedProgress && (
        <>
          {/* Progress bar */}
          <div className="mt-4 w-full max-w-xs">
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <p className="mt-1 text-center text-xs text-muted-foreground">
              {processed} / {total} ({progressPercent}%)
            </p>
          </div>

          {/* Stat counters */}
          <div className="mt-3 flex items-center gap-4 text-xs">
            {(imported ?? 0) > 0 && (
              <span className={cn('flex items-center gap-1 text-green-600 dark:text-green-400')}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                {imported} imported
              </span>
            )}
            {(skipped ?? 0) > 0 && (
              <span className={cn('flex items-center gap-1 text-yellow-600 dark:text-yellow-400')}>
                <AlertTriangle className="h-3.5 w-3.5" />
                {skipped} skipped
              </span>
            )}
            {(failed ?? 0) > 0 && (
              <span className={cn('flex items-center gap-1 text-red-600 dark:text-red-400')}>
                <XCircle className="h-3.5 w-3.5" />
                {failed} failed
              </span>
            )}
          </div>
        </>
      )}

      {!hasDetailedProgress && (
        <p className="mt-2 text-xs text-muted-foreground">
          This may take a moment. AI tagging and embeddings will be generated in the background.
        </p>
      )}
    </div>
  );
}
