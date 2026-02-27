'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getContentGraphAction, type GraphData, type GraphNode } from '@/app/actions/graph';
import { Skeleton } from '@/components/ui/skeleton';
import { GraphControls } from './GraphControls';
import { GraphDetailPanel } from './GraphDetailPanel';
import { NodeSearch } from './NodeSearch';
import Graph from 'graphology';
import louvain from 'graphology-communities-louvain';
import pagerank from 'graphology-metrics/centrality/pagerank';
import forceAtlas2 from 'graphology-layout-forceatlas2';

// Community colors — 10 distinct hues
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

type EnrichedNode = GraphNode & {
  community: number;
  pageRank: number;
  x: number;
  y: number;
  size: number;
  color: string;
  borderColor: string;
};

export function SigmaGraph() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<import('sigma').Sigma | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [minSimilarity, setMinSimilarity] = useState(0.5);
  const [selectedNode, setSelectedNode] = useState<EnrichedNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showLabels, setShowLabels] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchGraph = useCallback(async (similarity: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getContentGraphAction(similarity);
      if (result.success && result.data) {
        setGraphData(result.data);
      } else {
        setError(result.message || 'Failed to load graph');
      }
    } catch {
      setError('Failed to load graph data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGraph(minSimilarity);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSimilarityChange = (value: number) => {
    setMinSimilarity(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchGraph(value);
    }, 500);
  };

  // Build enriched nodes with community detection, PageRank, and layout
  const enrichedData = useMemo(() => {
    if (!graphData || graphData.nodes.length === 0) return null;

    const graph = new Graph({ type: 'undirected' });

    // Add nodes
    for (const node of graphData.nodes) {
      graph.addNode(node.id, {
        label: node.title,
        type: node.type,
        tags: node.tags,
      });
    }

    // Add edges
    for (const edge of graphData.edges) {
      if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
        try {
          graph.addEdge(edge.source, edge.target, {
            weight: edge.similarity,
            similarity: edge.similarity,
          });
        } catch {
          // Skip duplicate edges
        }
      }
    }

    // Run community detection
    let communities: Record<string, number> = {};
    try {
      communities = louvain(graph);
    } catch {
      // Fallback: assign all to community 0
      for (const nodeId of graph.nodes()) {
        communities[nodeId] = 0;
      }
    }

    // Run PageRank
    let ranks: Record<string, number> = {};
    try {
      ranks = pagerank(graph);
    } catch {
      for (const nodeId of graph.nodes()) {
        ranks[nodeId] = 1 / graph.order;
      }
    }

    // Normalize PageRank for sizing (4px - 20px)
    const rankValues = Object.values(ranks);
    const minRank = Math.min(...rankValues);
    const maxRank = Math.max(...rankValues);
    const rankRange = maxRank - minRank || 1;

    // Run ForceAtlas2 layout
    try {
      // Assign random initial positions spread out
      for (const nodeId of graph.nodes()) {
        graph.setNodeAttribute(nodeId, 'x', Math.random() * 200 - 100);
        graph.setNodeAttribute(nodeId, 'y', Math.random() * 200 - 100);
      }
      forceAtlas2.assign(graph, {
        iterations: 200,
        settings: {
          gravity: 0.05,
          scalingRatio: 10,
          barnesHutOptimize: true,
          strongGravityMode: false,
        },
      });
    } catch {
      // Fallback: use random positions already assigned
    }

    // Build enriched nodes
    const nodes: EnrichedNode[] = graphData.nodes.map((node) => {
      const community = communities[node.id] ?? 0;
      const rank = ranks[node.id] ?? 0;
      const normalizedRank = (rank - minRank) / rankRange;
      const size = 6 + normalizedRank * 18;

      return {
        ...node,
        community,
        pageRank: rank,
        x: graph.hasNode(node.id) ? graph.getNodeAttribute(node.id, 'x') : Math.random() * 100,
        y: graph.hasNode(node.id) ? graph.getNodeAttribute(node.id, 'y') : Math.random() * 100,
        size,
        color: COMMUNITY_COLORS[community % COMMUNITY_COLORS.length],
        borderColor: TYPE_COLORS[node.type] || '#888',
      };
    });

    return { nodes, edges: graphData.edges, graph };
  }, [graphData]);

  // Initialize and manage Sigma.js renderer
  useEffect(() => {
    if (!enrichedData || !containerRef.current) return;

    // Dynamic import Sigma
    let sigma: import('sigma').Sigma | null = null;

    const initSigma = async () => {
      const { Sigma } = await import('sigma');

      // Build a fresh graph for Sigma
      const graph = new Graph({ type: 'undirected' });

      for (const node of enrichedData.nodes) {
        graph.addNode(node.id, {
          x: node.x,
          y: node.y,
          size: node.size,
          label: node.title,
          color: node.color,
          originalColor: node.color,
          borderColor: node.borderColor,
          type: node.type,
          community: node.community,
          hidden: false,
        });
      }

      for (const edge of enrichedData.edges) {
        if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
          try {
            graph.addEdge(edge.source, edge.target, {
              size: 0.5 + edge.similarity * 2.5,
              color: `rgba(100, 100, 130, ${0.2 + edge.similarity * 0.5})`,
              similarity: edge.similarity,
            });
          } catch {
            // Skip duplicate edges
          }
        }
      }

      if (!containerRef.current) return;

      // Detect light/dark mode for label colors
      const isDark = document.documentElement.classList.contains('dark');
      const labelColor = isDark ? '#e2e8f0' : '#1e293b';

      sigma = new Sigma(graph, containerRef.current, {
        renderLabels: showLabels,
        labelRenderedSizeThreshold: 0,
        labelSize: 12,
        labelColor: { color: labelColor },
        defaultNodeColor: '#6366f1',
        defaultEdgeColor: isDark ? 'rgba(150, 150, 170, 0.3)' : 'rgba(100, 100, 130, 0.25)',
        minCameraRatio: 0.1,
        maxCameraRatio: 10,
      });

      sigmaRef.current = sigma;

      // Fit camera to show all nodes
      const camera = sigma.getCamera();
      camera.animatedReset({ duration: 200 });

      // Event handlers
      sigma.on('enterNode', ({ node }) => {
        setHoveredNode(node);
        highlightNeighbors(graph, sigma!, node);
      });

      sigma.on('leaveNode', () => {
        setHoveredNode(null);
        resetHighlight(graph, sigma!);
      });

      sigma.on('clickNode', ({ node }) => {
        const nodeData = enrichedData.nodes.find((n) => n.id === node);
        if (nodeData) {
          setSelectedNode(nodeData);
        }
      });

      sigma.on('doubleClickNode', ({ node }) => {
        router.push(`/dashboard/library?highlight=${node}`);
      });

      sigma.on('clickStage', () => {
        setSelectedNode(null);
      });
    };

    initSigma().catch((err) => {
      console.error('Failed to initialize Sigma.js:', err);
      setError('Failed to initialize graph renderer');
    });

    return () => {
      if (sigmaRef.current) {
        sigmaRef.current.kill();
        sigmaRef.current = null;
      }
    };
  }, [enrichedData, showLabels, router]);

  // Handle search highlighting
  useEffect(() => {
    if (!sigmaRef.current || !enrichedData) return;
    const graph = sigmaRef.current.getGraph();
    const query = searchQuery.toLowerCase();

    for (const node of enrichedData.nodes) {
      if (query && !node.title.toLowerCase().includes(query) &&
          !node.tags.some((t) => t.toLowerCase().includes(query))) {
        graph.setNodeAttribute(node.id, 'hidden', true);
      } else {
        graph.setNodeAttribute(node.id, 'hidden', false);
      }
    }

    sigmaRef.current.refresh();
  }, [searchQuery, enrichedData]);

  // Handle type filter
  useEffect(() => {
    if (!sigmaRef.current || !enrichedData) return;
    const graph = sigmaRef.current.getGraph();

    for (const node of enrichedData.nodes) {
      if (typeFilter !== 'all' && node.type !== typeFilter) {
        graph.setNodeAttribute(node.id, 'hidden', true);
      } else if (!searchQuery) {
        graph.setNodeAttribute(node.id, 'hidden', false);
      }
    }

    sigmaRef.current.refresh();
  }, [typeFilter, enrichedData, searchQuery]);

  // Community count for controls
  const communityCount = useMemo(() => {
    if (!enrichedData) return 0;
    return new Set(enrichedData.nodes.map((n) => n.community)).size;
  }, [enrichedData]);

  if (isLoading && !graphData) {
    return (
      <div className="space-y-4" data-testid="graph-loading">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[600px] w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center" data-testid="graph-empty">
        <p className="text-muted-foreground">
          Add more content with sufficient text to see relationships between your items.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls Row */}
      <div className="flex items-center gap-4 flex-wrap">
        <NodeSearch
          value={searchQuery}
          onChange={setSearchQuery}
        />
        <GraphControls
          minSimilarity={minSimilarity}
          onSimilarityChange={handleSimilarityChange}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          showLabels={showLabels}
          onShowLabelsChange={setShowLabels}
          isLoading={isLoading}
          nodeCount={graphData.nodes.length}
          edgeCount={graphData.edges.length}
          communityCount={communityCount}
        />
      </div>

      {/* Graph Container */}
      <div
        className="relative rounded-lg border bg-card overflow-hidden"
        style={{ height: '600px' }}
        data-testid="graph-container"
      >
        <div
          ref={containerRef}
          className="w-full h-full"
          style={{ background: 'hsl(var(--card))', position: 'absolute', inset: 0 }}
        />

        {/* Detail Panel */}
        {selectedNode && (
          <GraphDetailPanel
            node={selectedNode}
            connectionCount={
              graphData.edges.filter(
                (e) => e.source === selectedNode.id || e.target === selectedNode.id
              ).length
            }
            communityColor={COMMUNITY_COLORS[selectedNode.community % COMMUNITY_COLORS.length]}
            onClose={() => setSelectedNode(null)}
            onNavigate={() => router.push(`/dashboard/library?highlight=${selectedNode.id}`)}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div
                className="h-3 w-3 rounded-full border-2"
                style={{ borderColor: color, backgroundColor: 'transparent' }}
              />
              <span className="capitalize">{type}</span>
            </div>
          ))}
        </div>
        <span>
          {graphData.nodes.length} nodes, {graphData.edges.length} edges
          {communityCount > 0 && `, ${communityCount} communities`}
        </span>
      </div>
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
    // Restore original color from community
    if (attrs.originalColor) {
      graph.setNodeAttribute(n, 'color', attrs.originalColor);
    }
  }

  for (const e of graph.edges()) {
    graph.setEdgeAttribute(e, 'hidden', false);
  }

  sigma.refresh();
}
