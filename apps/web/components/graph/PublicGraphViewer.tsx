'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Graph from 'graphology';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import type { PublicGraphData, PublicGraphSettings } from '@/types/public-graph';

const COMMUNITY_COLORS = [
  '#6366f1', // indigo
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#8b5cf6', // violet
  '#22c55e', // green
  '#ef4444', // red
  '#06b6d4', // cyan
  '#eab308', // yellow
  '#64748b', // slate
];

const TYPE_COLORS: Record<string, string> = {
  note: '#3b82f6',
  link: '#22c55e',
  file: '#f97316',
};

interface PublicGraphViewerProps {
  graphData: PublicGraphData;
  settings?: PublicGraphSettings | null;
}

export function PublicGraphViewer({ graphData, settings }: PublicGraphViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<import('sigma').Sigma | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const showLabels = settings?.showLabels !== false;
  const colorBy = settings?.colorBy ?? 'community';

  // Tooltip state
  const updateTooltip = useCallback((
    node: { title: string; type: string; tags: string[]; connections: number } | null,
    x: number,
    y: number
  ) => {
    const tooltip = tooltipRef.current;
    if (!tooltip) return;

    if (!node) {
      tooltip.style.display = 'none';
      return;
    }

    tooltip.style.display = 'block';
    tooltip.style.left = `${x + 12}px`;
    tooltip.style.top = `${y - 12}px`;

    const tagHtml = node.tags.slice(0, 5).map((t) =>
      `<span style="display:inline-block;background:rgba(99,102,241,0.15);color:#6366f1;padding:1px 6px;border-radius:9999px;font-size:10px;margin-right:3px;">${t}</span>`
    ).join('');

    tooltip.innerHTML = `
      <div style="font-weight:600;font-size:13px;margin-bottom:4px;">${node.title}</div>
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${TYPE_COLORS[node.type] || '#64748b'}"></span>
        <span style="font-size:11px;text-transform:capitalize;opacity:0.7;">${node.type}</span>
        <span style="font-size:11px;opacity:0.5;">&middot; ${node.connections} connections</span>
      </div>
      ${tagHtml ? `<div style="margin-top:2px;">${tagHtml}</div>` : ''}
    `;
  }, []);

  useEffect(() => {
    if (!containerRef.current || graphData.nodes.length === 0) {
      setIsLoading(false);
      return;
    }

    let mounted = true;

    async function initGraph() {
      const sigmaModule = await import('sigma');
      const Sigma = sigmaModule.Sigma || sigmaModule.default;

      if (!mounted || !containerRef.current) return;

      // Detect light/dark mode
      const isDark = document.documentElement.classList.contains('dark');

      // Build graphology graph
      const graph = new Graph({ type: 'undirected' });

      // Compute PageRank-based sizing from pre-computed data
      const rankValues = graphData.nodes
        .map((n) => n.pageRank ?? 0)
        .filter((r) => r > 0);
      const minRank = rankValues.length > 0 ? Math.min(...rankValues) : 0;
      const maxRank = rankValues.length > 0 ? Math.max(...rankValues) : 1;
      const rankRange = maxRank - minRank || 1;

      for (const node of graphData.nodes) {
        const community = node.community ?? 0;
        const rank = node.pageRank ?? 0;
        const normalizedRank = rankValues.length > 0 ? (rank - minRank) / rankRange : 0.5;
        const size = 6 + normalizedRank * 18; // 6-24px

        const nodeColor = colorBy === 'type'
          ? (TYPE_COLORS[node.type] || '#64748b')
          : COMMUNITY_COLORS[community % COMMUNITY_COLORS.length];

        graph.addNode(node.id, {
          label: node.title,
          contentType: node.type,
          tags: node.tags,
          size,
          color: nodeColor,
          originalColor: nodeColor,
          community,
        });
      }

      // Build edge connection count map
      const connectionCount: Record<string, number> = {};
      for (const edge of graphData.edges) {
        if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
          try {
            graph.addEdge(edge.source, edge.target, {
              weight: edge.weight,
              size: 0.5 + edge.weight * 2.5,
              color: `rgba(100, 100, 130, ${0.2 + edge.weight * 0.5})`,
            });
            connectionCount[edge.source] = (connectionCount[edge.source] || 0) + 1;
            connectionCount[edge.target] = (connectionCount[edge.target] || 0) + 1;
          } catch {
            // Skip duplicate edges
          }
        }
      }

      // Apply layout
      if (graph.order > 1) {
        // Random initial positions spread out (match SigmaGraph range: 200)
        graph.forEachNode((node) => {
          graph.setNodeAttribute(node, 'x', Math.random() * 200 - 100);
          graph.setNodeAttribute(node, 'y', Math.random() * 200 - 100);
        });

        forceAtlas2.assign(graph, {
          iterations: 300,
          settings: {
            gravity: 0.02,
            scalingRatio: 20,
            barnesHutOptimize: true,
            strongGravityMode: false,
            linLogMode: true,
          },
        });
      }

      if (!mounted || !containerRef.current) return;

      const labelColor = isDark ? '#e2e8f0' : '#1e293b';

      // Create Sigma instance (read-only)
      const sigma = new Sigma(graph, containerRef.current, {
        renderLabels: showLabels,
        labelRenderedSizeThreshold: 8,
        labelSize: 11,
        labelWeight: 'bold',
        labelColor: { color: labelColor },
        defaultNodeColor: '#6366f1',
        defaultEdgeColor: isDark ? 'rgba(150, 150, 170, 0.3)' : 'rgba(100, 100, 130, 0.25)',
        minCameraRatio: 0.1,
        maxCameraRatio: 10,
        labelDensity: 0.5,
        labelGridCellSize: 120,
        allowInvalidContainer: true,
      });

      sigmaRef.current = sigma;

      // Fit camera
      try {
        const camera = sigma.getCamera();
        camera.animatedReset({ duration: 200 });
      } catch {
        // Camera fit is optional
      }

      // Hover interactions — highlight neighbors
      sigma.on('enterNode', ({ node }) => {
        highlightNeighbors(graph, sigma, node);

        // Show tooltip
        const nodeAttrs = graph.getNodeAttributes(node);
        const pos = sigma.graphToViewport({ x: graph.getNodeAttribute(node, 'x'), y: graph.getNodeAttribute(node, 'y') });
        updateTooltip(
          {
            title: nodeAttrs.label as string,
            type: nodeAttrs.contentType as string,
            tags: (nodeAttrs.tags as string[]) || [],
            connections: connectionCount[node] || 0,
          },
          pos.x,
          pos.y
        );
      });

      sigma.on('leaveNode', () => {
        resetHighlight(graph, sigma);
        updateTooltip(null, 0, 0);
      });

      setIsLoading(false);
    }

    initGraph().catch((err) => {
      console.error('Failed to initialize public graph:', err);
      setError(err instanceof Error ? err.message : String(err));
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      if (sigmaRef.current) {
        sigmaRef.current.kill();
        sigmaRef.current = null;
      }
    };
  }, [graphData, showLabels, colorBy, updateTooltip]);

  if (graphData.nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">This graph has no data.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-destructive">Failed to render graph: {error}</p>
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
      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={{
          display: 'none',
          position: 'absolute',
          pointerEvents: 'none',
          zIndex: 20,
          background: 'var(--color-card, white)',
          border: '1px solid var(--color-border, #e5e7eb)',
          borderRadius: '8px',
          padding: '8px 12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          maxWidth: '260px',
          fontSize: '12px',
          color: 'var(--color-foreground, #1e293b)',
        }}
      />
    </div>
  );
}

/**
 * Highlight a node and its neighbors, dim everything else
 */
function highlightNeighbors(
  graph: import('graphology').default,
  sigma: import('sigma').Sigma,
  nodeId: string
) {
  const neighbors = new Set(graph.neighbors(nodeId));
  neighbors.add(nodeId);

  for (const n of graph.nodes()) {
    if (neighbors.has(n)) {
      graph.setNodeAttribute(n, 'highlighted', true);
    } else {
      graph.setNodeAttribute(n, 'color', 'rgba(100, 100, 120, 0.15)');
    }
  }

  for (const e of graph.edges()) {
    const src = graph.source(e);
    const tgt = graph.target(e);
    if (!neighbors.has(src) || !neighbors.has(tgt)) {
      graph.setEdgeAttribute(e, 'hidden', true);
    }
  }

  sigma.refresh();
}

/**
 * Reset highlighting after hover
 */
function resetHighlight(
  graph: import('graphology').default,
  sigma: import('sigma').Sigma
) {
  for (const n of graph.nodes()) {
    const attrs = graph.getNodeAttributes(n);
    graph.removeNodeAttribute(n, 'highlighted');
    if (attrs.originalColor) {
      graph.setNodeAttribute(n, 'color', attrs.originalColor);
    }
  }

  for (const e of graph.edges()) {
    graph.setEdgeAttribute(e, 'hidden', false);
  }

  sigma.refresh();
}
