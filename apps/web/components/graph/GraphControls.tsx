'use client';

import { Loader2 } from 'lucide-react';

type GraphControlsProps = {
  minSimilarity: number;
  onSimilarityChange: (value: number) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  showLabels: boolean;
  onShowLabelsChange: (value: boolean) => void;
  isLoading: boolean;
  nodeCount: number;
  edgeCount: number;
  communityCount: number;
};

const TYPE_OPTIONS = ['all', 'note', 'link', 'file'] as const;

export function GraphControls({
  minSimilarity,
  onSimilarityChange,
  typeFilter,
  onTypeFilterChange,
  showLabels,
  onShowLabelsChange,
  isLoading,
  nodeCount,
  edgeCount,
  communityCount,
}: GraphControlsProps) {
  return (
    <div className="flex items-center gap-4 flex-wrap" data-testid="graph-controls">
      {/* Similarity Slider */}
      <div className="flex items-center gap-2">
        <label htmlFor="similarity-slider" className="text-sm font-medium whitespace-nowrap">
          Similarity
        </label>
        <input
          id="similarity-slider"
          type="range"
          min={0.3}
          max={0.9}
          step={0.05}
          value={minSimilarity}
          onChange={(e) => onSimilarityChange(Number(e.target.value))}
          className="w-24"
        />
        <span className="text-sm text-muted-foreground w-10">{minSimilarity.toFixed(2)}</span>
      </div>

      {/* Type Filter */}
      <div className="flex items-center gap-1">
        {TYPE_OPTIONS.map((type) => (
          <button
            key={type}
            onClick={() => onTypeFilterChange(type)}
            className={`px-2 py-1 text-xs rounded-md capitalize transition-colors ${
              typeFilter === type
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
            data-testid={`type-filter-${type}`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Labels Toggle */}
      <label className="flex items-center gap-1.5 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={showLabels}
          onChange={(e) => onShowLabelsChange(e.target.checked)}
          className="rounded"
          data-testid="labels-toggle"
        />
        <span className="text-muted-foreground">Labels</span>
      </label>

      {/* Stats & Loading */}
      <div className="flex items-center gap-2 ml-auto">
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" data-testid="graph-loading-spinner" />
        )}
        <span className="text-xs text-muted-foreground">
          {nodeCount}n / {edgeCount}e
          {communityCount > 0 && ` / ${communityCount}c`}
        </span>
      </div>
    </div>
  );
}
