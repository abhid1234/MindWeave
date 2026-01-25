'use client';

import Link from 'next/link';
import { ImportResult } from '@/lib/import/types';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Library,
  Upload,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState } from 'react';

interface ImportSummaryProps {
  result: ImportResult;
  onImportMore: () => void;
}

export function ImportSummary({ result, onImportMore }: ImportSummaryProps) {
  const [showErrors, setShowErrors] = useState(false);
  const { success, message, imported, skipped, failed, errors } = result;

  return (
    <div className="space-y-6">
      {/* Main result */}
      <div
        className={`rounded-lg border p-6 ${
          success ? 'border-green-500/50 bg-green-500/10' : 'border-destructive/50 bg-destructive/10'
        }`}
      >
        <div className="flex items-start gap-4">
          {success ? (
            <CheckCircle2 className="h-8 w-8 shrink-0 text-green-500" />
          ) : (
            <XCircle className="h-8 w-8 shrink-0 text-destructive" />
          )}
          <div>
            <h3 className="text-lg font-semibold">
              {success ? 'Import Complete' : 'Import Failed'}
            </h3>
            <p className="mt-1 text-muted-foreground">{message}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={CheckCircle2}
          label="Imported"
          value={imported}
          className="text-green-500"
        />
        <StatCard
          icon={AlertTriangle}
          label="Skipped"
          value={skipped}
          className="text-yellow-500"
        />
        <StatCard
          icon={XCircle}
          label="Failed"
          value={failed}
          className="text-destructive"
        />
      </div>

      {/* Errors detail */}
      {errors.length > 0 && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10">
          <button
            type="button"
            onClick={() => setShowErrors(!showErrors)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <span className="font-medium text-destructive">
              {errors.length} error{errors.length !== 1 ? 's' : ''} occurred
            </span>
            {showErrors ? (
              <ChevronUp className="h-4 w-4 text-destructive" />
            ) : (
              <ChevronDown className="h-4 w-4 text-destructive" />
            )}
          </button>
          {showErrors && (
            <div className="max-h-48 divide-y divide-destructive/20 overflow-y-auto border-t border-destructive/20">
              {errors.map((error, i) => (
                <div key={i} className="px-4 py-2 text-sm">
                  <span className="font-medium">{error.item}:</span> {error.reason}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        {imported > 0 && (
          <Link
            href="/dashboard/library"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Library className="mr-2 h-4 w-4" />
            View in Library
          </Link>
        )}
        <Button variant="outline" onClick={onImportMore}>
          <Upload className="mr-2 h-4 w-4" />
          Import More
        </Button>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  className?: string;
}

function StatCard({ icon: Icon, label, value, className }: StatCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4 text-center">
      <Icon className={`mx-auto h-6 w-6 ${className}`} />
      <p className="mt-2 text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
