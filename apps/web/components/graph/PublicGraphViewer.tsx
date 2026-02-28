'use client';

import { useEffect, useRef, useState } from 'react';
import Graph from 'graphology';
import louvain from 'graphology-communities-louvain';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import type { PublicGraphData } from '@/types/public-graph';

const COMMUNITY_COLORS = [
  '#6366f1', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6',
  '#22c55e', '#ef4444', '#06b6d4', '#eab308', '#64748b',
];

const TYPE_COLORS: Record<string, string> = {
  note: '#3b82f6',
  link: '#22c55e',
  file: '#f97316',
};

interface PublicGraphViewerProps {
  graphData: PublicGraphData;
}

export function PublicGraphViewer({ graphData }: PublicGraphViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<import('sigma').Sigma | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current || graphData.nodes.length === 0) {
      setIsLoading(false);
      return;
    }

    let mounted = true;

    async function initGraph() {
      const { Sigma } = await import('sigma');

      if (!mounted || !containerRef.current) return;

      // Build graphology graph
      const graph = new Graph();

      for (const node of graphData.nodes) {
        graph.addNode(node.id, {
          label: node.title,
          type: node.type,
          tags: node.tags,
          size: 5,
          color: TYPE_COLORS[node.type] || '#64748b',
        });
      }

      for (const edge of graphData.edges) {
        if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
          try {
            graph.addEdge(edge.source, edge.target, {
              weight: edge.weight,
              size: Math.max(0.5, edge.weight * 2),
              color: '#e5e7eb',
            });
          } catch {
            // Skip duplicate edges
          }
        }
      }

      // Apply community detection
      if (graph.size > 0) {
        try {
          louvain.assign(graph);
          graph.forEachNode((node, attrs) => {
            const community = (attrs.community as number) ?? 0;
            graph.setNodeAttribute(node, 'color', COMMUNITY_COLORS[community % COMMUNITY_COLORS.length]);
          });
        } catch {
          // Fall back to type colors
        }
      }

      // Apply layout
      if (graph.order > 1) {
        // Random initial positions
        graph.forEachNode((node) => {
          graph.setNodeAttribute(node, 'x', Math.random() * 100);
          graph.setNodeAttribute(node, 'y', Math.random() * 100);
        });

        forceAtlas2.assign(graph, {
          iterations: 100,
          settings: {
            gravity: 1,
            scalingRatio: 2,
            barnesHutOptimize: graph.order > 100,
          },
        });
      }

      // Create Sigma instance (read-only)
      const sigma = new Sigma(graph, containerRef.current, {
        renderLabels: true,
        labelRenderedSizeThreshold: 8,
        defaultEdgeColor: '#e5e7eb',
        labelColor: { color: '#374151' },
        labelSize: 12,
        // Allow zoom/pan but no editing
        allowInvalidContainer: true,
      });

      sigmaRef.current = sigma;
      setIsLoading(false);
    }

    initGraph();

    return () => {
      mounted = false;
      if (sigmaRef.current) {
        sigmaRef.current.kill();
        sigmaRef.current = null;
      }
    };
  }, [graphData]);

  if (graphData.nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">This graph has no data.</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        </div>
      )}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
