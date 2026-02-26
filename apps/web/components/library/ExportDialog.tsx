'use client';

import { useState } from 'react';
import { Download, FileJson, FileText, Table } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type ExportFormat = 'json' | 'markdown' | 'csv';

type ExportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentIds?: string[];
  itemCount?: number;
  collectionId?: string;
  collectionName?: string;
  filters?: {
    type?: string;
    tag?: string;
    query?: string;
  };
};

const formatOptions: { value: ExportFormat; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'json',
    label: 'JSON',
    description: 'Machine-readable format, ideal for backups and imports',
    icon: <FileJson className="h-5 w-5" />,
  },
  {
    value: 'markdown',
    label: 'Markdown',
    description: 'Human-readable format, great for documentation',
    icon: <FileText className="h-5 w-5" />,
  },
  {
    value: 'csv',
    label: 'CSV',
    description: 'Spreadsheet format, compatible with Excel and Google Sheets',
    icon: <Table className="h-5 w-5" />,
  },
];

export function ExportDialog({
  open,
  onOpenChange,
  contentIds,
  itemCount,
  collectionId,
  collectionName,
  filters,
}: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentIds,
          format: selectedFormat,
          collectionId,
          ...(filters?.type && { type: filters.type }),
          ...(filters?.tag && { tag: filters.tag }),
          ...(filters?.query && { query: filters.query }),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Export failed');
      }

      // Get filename from Content-Disposition header or use default
      const disposition = response.headers.get('Content-Disposition');
      const filenameMatch = disposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `mindweave-export.${selectedFormat}`;

      // Download the file
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export content');
    } finally {
      setIsExporting(false);
    }
  };

  const exportLabel = contentIds
    ? `${itemCount ?? contentIds.length} selected item${(itemCount ?? contentIds.length) !== 1 ? 's' : ''}`
    : collectionName
      ? `collection "${collectionName}"`
      : (filters?.type || filters?.tag || filters?.query)
        ? 'filtered results'
        : 'all content';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Content</DialogTitle>
          <DialogDescription>
            Export {exportLabel} to a file. Choose your preferred format below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {formatOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelectedFormat(option.value)}
              className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                selectedFormat === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-input hover:border-primary/50'
              }`}
            >
              <div
                className={`flex-shrink-0 ${
                  selectedFormat === option.value ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {option.icon}
              </div>
              <div>
                <p className="font-medium">{option.label}</p>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>
            </button>
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
            {error}
          </p>
        )}

        <DialogFooter className="flex-col-reverse sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              'Exporting...'
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
