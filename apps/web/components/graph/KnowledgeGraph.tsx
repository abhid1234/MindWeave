'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getContentGraphAction, type GraphData, type GraphNode } from '@/app/actions/graph';
import { Skeleton } from '@/components/ui/skeleton';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => null,
});

const TYPE_COLORS: Record<string, string> = {
  note: '#3b82f6',
  link: '#22c55e',
  file: '#f97316',
};

export function KnowledgeGraph() {
  const router = useRouter();
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [minSimilarity, setMinSimilarity] = useState(0.5);
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

  // Count connections per node for sizing
  const connectionCount = new Map<string, number>();
  if (graphData) {
    for (const edge of graphData.edges) {
      connectionCount.set(edge.source, (connectionCount.get(edge.source) || 0) + 1);
      connectionCount.set(edge.target, (connectionCount.get(edge.target) || 0) + 1);
    }
  }

  const handleNodeClick = useCallback(
    (node: { id?: string | number }) => {
      if (node.id) {
        router.push(`/dashboard/library?highlight=${node.id}`);
      }
    },
    [router]
  );

  if (isLoading && !graphData) {
    return (
      <div className="space-y-4" data-testid="graph-loading">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[500px] w-full rounded-lg" />
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

  // Prepare data for ForceGraph2D
  const forceGraphData = {
    nodes: graphData.nodes.map((node) => ({
      id: node.id,
      name: node.title,
      type: node.type,
      val: (connectionCount.get(node.id) || 1) * 2,
    })),
    links: graphData.edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
      similarity: edge.similarity,
    })),
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label htmlFor="similarity-slider" className="text-sm font-medium whitespace-nowrap">
            Similarity threshold
          </label>
          <input
            id="similarity-slider"
            type="range"
            min={0.3}
            max={0.9}
            step={0.05}
            value={minSimilarity}
            onChange={(e) => handleSimilarityChange(Number(e.target.value))}
            className="w-32"
          />
          <span className="text-sm text-muted-foreground w-10">{minSimilarity.toFixed(2)}</span>
        </div>

        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}

        {/* Legend */}
        <div className="flex items-center gap-3 ml-auto">
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-muted-foreground capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Graph */}
      <div
        className="rounded-lg border bg-card overflow-hidden"
        style={{ height: '500px' }}
        data-testid="graph-container"
      >
        <ForceGraph2D
          graphData={forceGraphData}
          nodeColor={(node: Record<string, unknown>) =>
            TYPE_COLORS[(node.type as string) || 'note'] || '#888'
          }
          nodeLabel={(node: Record<string, unknown>) => (node.name as string) || ''}
          linkWidth={(link: Record<string, unknown>) =>
            ((link.similarity as number) || 0.5) * 3
          }
          linkColor={() => 'rgba(156, 163, 175, 0.3)'}
          onNodeClick={handleNodeClick}
          nodeRelSize={5}
          backgroundColor="transparent"
          width={undefined}
          height={500}
        />
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {graphData.nodes.length} items connected by {graphData.edges.length} relationships.
        Click a node to navigate to it.
      </p>
    </div>
  );
}
