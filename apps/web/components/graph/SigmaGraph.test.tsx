import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const { mockGetContentGraphAction } = vi.hoisted(() => ({
  mockGetContentGraphAction: vi.fn(),
}));

vi.mock('@/app/actions/graph', () => ({
  getContentGraphAction: mockGetContentGraphAction,
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock Skeleton
vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

// Mock graphology and algorithms (these are heavy libs)
vi.mock('graphology', () => {
  class MockGraph {
    addNode = vi.fn();
    addEdge = vi.fn();
    hasNode = vi.fn().mockReturnValue(true);
    nodes = vi.fn().mockReturnValue([]);
    edges = vi.fn().mockReturnValue([]);
    order = 0;
    getNodeAttribute = vi.fn().mockReturnValue(0);
    setNodeAttribute = vi.fn();
    removeNodeAttribute = vi.fn();
    source = vi.fn();
    target = vi.fn();
    getNodeAttributes = vi.fn().mockReturnValue({});
    setEdgeAttribute = vi.fn();
    neighbors = vi.fn().mockReturnValue([]);
    getGraph = vi.fn();
  }
  return { default: MockGraph };
});

vi.mock('graphology-communities-louvain', () => ({
  default: vi.fn().mockReturnValue({}),
}));

vi.mock('graphology-metrics/centrality/pagerank', () => ({
  default: vi.fn().mockReturnValue({}),
}));

vi.mock('graphology-layout-forceatlas2', () => ({
  assign: vi.fn(),
}));

// Mock sigma
vi.mock('sigma', () => {
  class MockSigma {
    on = vi.fn();
    kill = vi.fn();
    refresh = vi.fn();
    getGraph = vi.fn().mockReturnValue({
      nodes: vi.fn().mockReturnValue([]),
      edges: vi.fn().mockReturnValue([]),
      setNodeAttribute: vi.fn(),
      setEdgeAttribute: vi.fn(),
      removeNodeAttribute: vi.fn(),
      getNodeAttributes: vi.fn().mockReturnValue({}),
      source: vi.fn(),
      target: vi.fn(),
      neighbors: vi.fn().mockReturnValue([]),
      hasNode: vi.fn().mockReturnValue(true),
    });
  }
  return { Sigma: MockSigma };
});

// Mock sub-components
vi.mock('./GraphControls', () => ({
  GraphControls: (_props: Record<string, unknown>) => <div data-testid="graph-controls" />,
}));
vi.mock('./GraphDetailPanel', () => ({
  GraphDetailPanel: (_props: Record<string, unknown>) => <div data-testid="graph-detail-panel" />,
}));
vi.mock('./NodeSearch', () => ({
  NodeSearch: (_props: Record<string, unknown>) => <div data-testid="node-search" />,
}));

import { SigmaGraph } from './SigmaGraph';

const mockGraphData = {
  nodes: [
    { id: '1', title: 'Note One', type: 'note' as const, tags: ['ai'], autoTags: [] },
    { id: '2', title: 'Link Two', type: 'link' as const, tags: ['web'], autoTags: [] },
    { id: '3', title: 'File Three', type: 'file' as const, tags: ['doc'], autoTags: [] },
  ],
  edges: [
    { source: '1', target: '2', similarity: 0.8 },
    { source: '2', target: '3', similarity: 0.6 },
  ],
};

describe('SigmaGraph', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    // Keep the action pending so loading state persists
    mockGetContentGraphAction.mockReturnValue(new Promise(() => {}));
    render(<SigmaGraph />);
    expect(screen.getByTestId('graph-loading')).toBeInTheDocument();
  });

  it('shows empty state when no data', async () => {
    mockGetContentGraphAction.mockResolvedValue({
      success: true,
      data: { nodes: [], edges: [] },
    });
    render(<SigmaGraph />);
    await waitFor(() => {
      expect(screen.getByTestId('graph-empty')).toBeInTheDocument();
    });
    expect(screen.getByText(/Add more content/i)).toBeInTheDocument();
  });

  it('renders graph container with data', async () => {
    mockGetContentGraphAction.mockResolvedValue({
      success: true,
      data: mockGraphData,
    });
    render(<SigmaGraph />);
    await waitFor(() => {
      expect(screen.getByTestId('graph-container')).toBeInTheDocument();
    });
  });

  it('shows error message on failure', async () => {
    mockGetContentGraphAction.mockResolvedValue({
      success: false,
      message: 'Something went wrong',
    });
    render(<SigmaGraph />);
    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  it('renders controls when data loaded', async () => {
    mockGetContentGraphAction.mockResolvedValue({
      success: true,
      data: mockGraphData,
    });
    render(<SigmaGraph />);
    await waitFor(() => {
      expect(screen.getByTestId('graph-controls')).toBeInTheDocument();
    });
  });

  it('renders node search when data loaded', async () => {
    mockGetContentGraphAction.mockResolvedValue({
      success: true,
      data: mockGraphData,
    });
    render(<SigmaGraph />);
    await waitFor(() => {
      expect(screen.getByTestId('node-search')).toBeInTheDocument();
    });
  });

  it('shows node count and edge count in legend', async () => {
    mockGetContentGraphAction.mockResolvedValue({
      success: true,
      data: mockGraphData,
    });
    render(<SigmaGraph />);
    await waitFor(() => {
      expect(screen.getByText(/3 nodes/)).toBeInTheDocument();
      expect(screen.getByText(/2 edges/)).toBeInTheDocument();
    });
  });

  it('shows community info in legend', async () => {
    mockGetContentGraphAction.mockResolvedValue({
      success: true,
      data: mockGraphData,
    });
    render(<SigmaGraph />);
    await waitFor(() => {
      // communityCount is derived from enrichedData; with mock louvain returning {}
      // all nodes get community 0, so 1 community
      expect(screen.getByText(/1 communities/)).toBeInTheDocument();
    });
  });
});
