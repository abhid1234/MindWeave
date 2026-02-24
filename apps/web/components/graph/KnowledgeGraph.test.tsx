import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const { mockGetContentGraphAction } = vi.hoisted(() => ({
  mockGetContentGraphAction: vi.fn(),
}));

// Mock getContentGraphAction server action
vi.mock('@/app/actions/graph', () => ({
  getContentGraphAction: mockGetContentGraphAction,
}));

// Mock react-force-graph-2d dynamic import
vi.mock('react-force-graph-2d', () => ({
  default: (props: Record<string, unknown>) => (
    <div data-testid="force-graph" {...props} />
  ),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock Skeleton component
vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

import { KnowledgeGraph } from './KnowledgeGraph';

describe('KnowledgeGraph', () => {
  beforeEach(() => {
    mockGetContentGraphAction.mockReset();
  });

  it('shows loading state initially', () => {
    mockGetContentGraphAction.mockReturnValue(new Promise(() => {}));

    render(<KnowledgeGraph />);

    expect(screen.getByTestId('graph-loading')).toBeInTheDocument();
  });

  it('shows empty state when no data', async () => {
    mockGetContentGraphAction.mockResolvedValue({
      success: true,
      data: { nodes: [], edges: [] },
    });

    render(<KnowledgeGraph />);

    await waitFor(() => {
      expect(screen.getByTestId('graph-empty')).toBeInTheDocument();
    });
  });

  it('renders graph container with data', async () => {
    mockGetContentGraphAction.mockResolvedValue({
      success: true,
      data: {
        nodes: [
          { id: '1', title: 'Note 1', type: 'note', tags: ['js'] },
          { id: '2', title: 'Link 1', type: 'link', tags: ['web'] },
        ],
        edges: [{ source: '1', target: '2', similarity: 0.8 }],
      },
    });

    render(<KnowledgeGraph />);

    await waitFor(() => {
      expect(screen.getByTestId('graph-container')).toBeInTheDocument();
    });
  });

  it('shows error message on failure', async () => {
    mockGetContentGraphAction.mockResolvedValue({
      success: false,
      message: 'Failed',
    });

    render(<KnowledgeGraph />);

    await waitFor(() => {
      expect(screen.getByText('Failed')).toBeInTheDocument();
    });
  });
});
