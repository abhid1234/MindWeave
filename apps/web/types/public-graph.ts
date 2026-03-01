/**
 * Types for Public Knowledge Graph feature
 */

export interface PublicGraphNode {
  id: string;
  title: string;
  type: string;
  tags: string[];
  community?: number;
  pageRank?: number;
}

export interface PublicGraphEdge {
  source: string;
  target: string;
  weight: number;
}

export interface PublicGraphStats {
  nodeCount: number;
  edgeCount: number;
  communityCount: number;
  topTags: string[];
}

export interface PublicGraphData {
  nodes: PublicGraphNode[];
  edges: PublicGraphEdge[];
  stats?: PublicGraphStats;
}

export interface PublicGraphSettings {
  showLabels?: boolean;
  colorBy?: 'type' | 'community';
}

export interface PublicGraphResult {
  success: boolean;
  data?: {
    graphId: string;
    title: string;
    description: string | null;
    graphData: PublicGraphData;
    settings: PublicGraphSettings | null;
    createdAt: string;
  };
  message?: string;
}

export interface GeneratePublicGraphResult {
  success: boolean;
  data?: {
    graphId: string;
    stats?: PublicGraphStats;
  };
  message?: string;
}
