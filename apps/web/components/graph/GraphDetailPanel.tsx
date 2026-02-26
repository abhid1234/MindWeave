'use client';

import { X, ExternalLink } from 'lucide-react';
import type { GraphNode } from '@/app/actions/graph';

type GraphDetailPanelProps = {
  node: GraphNode & { community: number; pageRank: number };
  connectionCount: number;
  communityColor: string;
  onClose: () => void;
  onNavigate: () => void;
};

export function GraphDetailPanel({
  node,
  connectionCount,
  communityColor,
  onClose,
  onNavigate,
}: GraphDetailPanelProps) {
  return (
    <div
      className="absolute top-4 right-4 w-72 rounded-lg border bg-card p-4 shadow-lg"
      data-testid="graph-detail-panel"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2">{node.title}</h3>
        <button
          onClick={onClose}
          className="shrink-0 rounded-md p-1 hover:bg-muted transition-colors"
          data-testid="detail-close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Metadata */}
      <div className="space-y-2 text-xs">
        {/* Type Badge */}
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Type:</span>
          <span className="capitalize font-medium">{node.type}</span>
        </div>

        {/* Community */}
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Community:</span>
          <div className="flex items-center gap-1.5">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: communityColor }}
            />
            <span className="font-medium">#{node.community}</span>
          </div>
        </div>

        {/* PageRank */}
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Importance:</span>
          <span className="font-medium">{(node.pageRank * 100).toFixed(1)}%</span>
        </div>

        {/* Connections */}
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Connections:</span>
          <span className="font-medium">{connectionCount}</span>
        </div>

        {/* Tags */}
        {node.tags.length > 0 && (
          <div>
            <span className="text-muted-foreground">Tags:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {node.tags.slice(0, 8).map((tag) => (
                <span
                  key={tag}
                  className="inline-block px-1.5 py-0.5 text-xs rounded bg-muted"
                >
                  {tag}
                </span>
              ))}
              {node.tags.length > 8 && (
                <span className="text-muted-foreground">+{node.tags.length - 8}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 pt-3 border-t">
        <button
          onClick={onNavigate}
          className="flex items-center gap-1.5 text-sm text-primary hover:underline"
          data-testid="detail-navigate"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View in Library
        </button>
      </div>
    </div>
  );
}
