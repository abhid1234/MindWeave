import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContentClusters } from './ContentClusters';

// Mock the server action
vi.mock('@/app/actions/clusters', () => ({
  getClustersAction: vi.fn().mockResolvedValue({
    success: true,
    clusters: [
      {
        id: 'cluster-1',
        name: 'JavaScript Topics',
        description: 'Content related to JavaScript',
        contentIds: ['1', '2', '3'],
        contentPreviews: [
          { id: '1', title: 'React Basics', type: 'note' },
          { id: '2', title: 'Node.js Guide', type: 'link' },
        ],
        size: 3,
      },
      {
        id: 'cluster-2',
        name: 'Python Topics',
        description: 'Content related to Python',
        contentIds: ['4', '5'],
        contentPreviews: [
          { id: '4', title: 'Django Tutorial', type: 'note' },
        ],
        size: 2,
      },
    ],
  }),
}));

describe('ContentClusters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    render(<ContentClusters />);

    expect(screen.getByText('Content Clusters')).toBeInTheDocument();
  });

  it('should display clusters after loading', async () => {
    render(<ContentClusters />);

    await waitFor(() => {
      expect(screen.getByText('JavaScript Topics')).toBeInTheDocument();
      expect(screen.getByText('Python Topics')).toBeInTheDocument();
    });
  });

  it('should show cluster size', async () => {
    render(<ContentClusters />);

    await waitFor(() => {
      expect(screen.getByText('3 items')).toBeInTheDocument();
      expect(screen.getByText('2 items')).toBeInTheDocument();
    });
  });

  it('should expand cluster to show content previews on click', async () => {
    render(<ContentClusters />);

    await waitFor(() => {
      expect(screen.getByText('JavaScript Topics')).toBeInTheDocument();
    });

    // Click on the first cluster to expand it
    const clusterButton = screen.getByText('JavaScript Topics').closest('button');
    if (clusterButton) {
      fireEvent.click(clusterButton);
    }

    await waitFor(() => {
      expect(screen.getByText('React Basics')).toBeInTheDocument();
      expect(screen.getByText('Node.js Guide')).toBeInTheDocument();
    });
  });

  it('should show message when no clusters exist', async () => {
    const { getClustersAction } = await import('@/app/actions/clusters');
    vi.mocked(getClustersAction).mockResolvedValueOnce({
      success: true,
      clusters: [],
    });

    render(<ContentClusters />);

    await waitFor(() => {
      expect(screen.getByText('Add more content to see automatic clusters')).toBeInTheDocument();
    });
  });

  it('should show error message on failure', async () => {
    const { getClustersAction } = await import('@/app/actions/clusters');
    vi.mocked(getClustersAction).mockResolvedValueOnce({
      success: false,
      clusters: [],
      message: 'Failed to load clusters',
    });

    render(<ContentClusters />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load clusters')).toBeInTheDocument();
    });
  });
});
