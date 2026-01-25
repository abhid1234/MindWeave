'use client';

import { useState, useMemo } from 'react';
import { ImportItem, ParseResult, ParseError } from '@/lib/import/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Link,
  FileText,
  Tag,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Circle,
} from 'lucide-react';

interface ImportPreviewProps {
  parseResult: ParseResult;
  selectedItems: Set<number>;
  onSelectionChange: (selected: Set<number>) => void;
  maxPreviewItems?: number;
}

export function ImportPreview({
  parseResult,
  selectedItems,
  onSelectionChange,
  maxPreviewItems = 100,
}: ImportPreviewProps) {
  const [showAll, setShowAll] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [showWarnings, setShowWarnings] = useState(false);

  const { items, errors, warnings, stats } = parseResult;

  const displayItems = useMemo(() => {
    return showAll ? items : items.slice(0, maxPreviewItems);
  }, [items, showAll, maxPreviewItems]);

  const toggleAll = () => {
    if (selectedItems.size === items.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(items.map((_, i) => i)));
    }
  };

  const toggleItem = (index: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    onSelectionChange(newSelected);
  };

  const allSelected = selectedItems.size === items.length && items.length > 0;
  const someSelected = selectedItems.size > 0 && selectedItems.size < items.length;

  return (
    <div className="space-y-4">
      {/* Stats summary */}
      <div className="flex flex-wrap gap-4 rounded-lg bg-muted/50 p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span className="text-sm">
            <strong>{stats.parsed}</strong> items parsed
          </span>
        </div>
        {stats.skipped > 0 && (
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <span className="text-sm">
              <strong>{stats.skipped}</strong> skipped
            </span>
          </div>
        )}
        {selectedItems.size > 0 && (
          <div className="flex items-center gap-2 text-primary">
            <Circle className="h-4 w-4 fill-current" />
            <span className="text-sm">
              <strong>{selectedItems.size}</strong> selected for import
            </span>
          </div>
        )}
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <ErrorsSection errors={errors} isOpen={showErrors} onToggle={() => setShowErrors(!showErrors)} />
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <WarningsSection
          warnings={warnings}
          isOpen={showWarnings}
          onToggle={() => setShowWarnings(!showWarnings)}
        />
      )}

      {/* Items list */}
      {items.length > 0 && (
        <div className="rounded-lg border">
          {/* Header with select all */}
          <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-3">
            <button
              type="button"
              onClick={toggleAll}
              className="flex items-center gap-2 text-sm font-medium hover:text-primary"
            >
              <SelectCheckbox checked={allSelected} indeterminate={someSelected} />
              Select all ({items.length} items)
            </button>
            {items.length > maxPreviewItems && (
              <Button variant="ghost" size="sm" onClick={() => setShowAll(!showAll)}>
                {showAll ? 'Show less' : `Show all (${items.length})`}
              </Button>
            )}
          </div>

          {/* Items */}
          <div className="max-h-96 divide-y overflow-y-auto">
            {displayItems.map((item, index) => (
              <ItemRow
                key={index}
                item={item}
                isSelected={selectedItems.has(index)}
                onToggle={() => toggleItem(index)}
              />
            ))}
          </div>

          {!showAll && items.length > maxPreviewItems && (
            <div className="border-t bg-muted/30 px-4 py-2 text-center text-sm text-muted-foreground">
              Showing {maxPreviewItems} of {items.length} items
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ItemRowProps {
  item: ImportItem;
  isSelected: boolean;
  onToggle: () => void;
}

function ItemRow({ item, isSelected, onToggle }: ItemRowProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50',
        isSelected && 'bg-accent/30'
      )}
    >
      <SelectCheckbox checked={isSelected} className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {item.type === 'link' ? (
            <Link className="h-4 w-4 shrink-0 text-blue-500" />
          ) : (
            <FileText className="h-4 w-4 shrink-0 text-green-500" />
          )}
          <span className="truncate font-medium">{item.title}</span>
        </div>
        {item.url && (
          <p className="mt-1 truncate text-xs text-muted-foreground">{item.url}</p>
        )}
        {item.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            <Tag className="h-3 w-3 text-muted-foreground" />
            {item.tags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
            {item.tags.length > 5 && (
              <span className="text-xs text-muted-foreground">+{item.tags.length - 5} more</span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

interface SelectCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  className?: string;
}

function SelectCheckbox({ checked, indeterminate, className }: SelectCheckboxProps) {
  return (
    <div
      className={cn(
        'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
        checked || indeterminate ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/50',
        className
      )}
    >
      {checked && (
        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
          <path d="M10.28 2.28L4 8.56 1.72 6.28a.75.75 0 00-1.06 1.06l3 3a.75.75 0 001.06 0l7-7a.75.75 0 00-1.06-1.06z" />
        </svg>
      )}
      {!checked && indeterminate && (
        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
          <rect x="2" y="5" width="8" height="2" rx="1" />
        </svg>
      )}
    </div>
  );
}

interface ErrorsSectionProps {
  errors: ParseError[];
  isOpen: boolean;
  onToggle: () => void;
}

function ErrorsSection({ errors, isOpen, onToggle }: ErrorsSectionProps) {
  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/10">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <span className="font-medium">{errors.length} parsing error{errors.length !== 1 ? 's' : ''}</span>
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {isOpen && (
        <div className="max-h-48 divide-y divide-destructive/20 overflow-y-auto border-t border-destructive/20">
          {errors.map((error, i) => (
            <div key={i} className="px-4 py-2 text-sm">
              {error.item && <span className="font-medium">{error.item}: </span>}
              {error.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface WarningsSectionProps {
  warnings: string[];
  isOpen: boolean;
  onToggle: () => void;
}

function WarningsSection({ warnings, isOpen, onToggle }: WarningsSectionProps) {
  return (
    <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
          <AlertTriangle className="h-4 w-4" />
          <span className="font-medium">{warnings.length} warning{warnings.length !== 1 ? 's' : ''}</span>
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {isOpen && (
        <div className="max-h-48 divide-y divide-yellow-500/20 overflow-y-auto border-t border-yellow-500/20">
          {warnings.map((warning, i) => (
            <div key={i} className="px-4 py-2 text-sm">
              {warning}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
