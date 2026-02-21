'use client';

import { useState } from 'react';
import { Download, Calendar, Filter, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type ContentTypeFilter = 'all' | 'note' | 'link' | 'file';
export type DateRange = 'week' | 'month' | 'quarter' | 'year' | 'all';

interface AnalyticsHeaderProps {
  onDateRangeChange?: (range: DateRange) => void;
  onContentTypeChange?: (type: ContentTypeFilter) => void;
  onExport?: () => void;
  isExporting?: boolean;
}

export function AnalyticsHeader({
  onDateRangeChange,
  onContentTypeChange,
  onExport,
  isExporting = false,
}: AnalyticsHeaderProps) {
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [contentType, setContentType] = useState<ContentTypeFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    onDateRangeChange?.(range);
  };

  const handleContentTypeChange = (type: ContentTypeFilter) => {
    setContentType(type);
    onContentTypeChange?.(type);
  };

  const dateRanges: { value: DateRange; label: string }[] = [
    { value: 'week', label: '7 days' },
    { value: 'month', label: '30 days' },
    { value: 'quarter', label: '90 days' },
    { value: 'year', label: '1 year' },
    { value: 'all', label: 'All time' },
  ];

  const contentTypes: { value: ContentTypeFilter; label: string }[] = [
    { value: 'all', label: 'All types' },
    { value: 'note', label: 'Notes' },
    { value: 'link', label: 'Links' },
    { value: 'file', label: 'Files' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="mt-1 text-muted-foreground">
              Insights and statistics about your knowledge base
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {(dateRange !== 'month' || contentType !== 'all') && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {(dateRange !== 'month' ? 1 : 0) + (contentType !== 'all' ? 1 : 0)}
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            disabled={isExporting}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-4 rounded-lg border bg-muted/50 p-4">
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Calendar className="mr-1 inline h-4 w-4" />
              Date Range
            </label>
            <div className="flex flex-wrap gap-1">
              {dateRanges.map((range) => (
                <Button
                  key={range.value}
                  variant={dateRange === range.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleDateRangeChange(range.value)}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Content Type</label>
            <div className="flex flex-wrap gap-1">
              {contentTypes.map((type) => (
                <Button
                  key={type.value}
                  variant={contentType === type.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleContentTypeChange(type.value)}
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
