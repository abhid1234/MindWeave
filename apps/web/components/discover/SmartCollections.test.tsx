import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SmartCollections } from './SmartCollections';

const mockAddToast = vi.hoisted(() => vi.fn());
const mockGetClustersAction = vi.hoisted(() => vi.fn());
const mockCreateCollectionAction = vi.hoisted(() => vi.fn());
const mockBulkAddToCollectionAction = vi.hoisted(() => vi.fn());

vi.mock('@/app/actions/clusters', () => ({
  getClustersAction: (...args: unknown[]) => mockGetClustersAction(...args),
}));

vi.mock('@/app/actions/collections', () => ({
  createCollectionAction: (...args: unknown[]) => mockCreateCollectionAction(...args),
  bulkAddToCollectionAction: (...args: unknown[]) => mockBulkAddToCollectionAction(...args),
}));

vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({ addToast: mockAddToast, toasts: [], removeToast: vi.fn() }),
}));

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

vi.mock('./DiscoverSection', () => ({
  DiscoverSection: ({
    children,
    isLoading,
    isEmpty,
  }: {
    children?: React.ReactNode;
    isLoading?: boolean;
    isEmpty?: boolean;
    title: string;
    description: string;
    icon: unknown;
  }) => {
    if (isEmpty && !isLoading) return null;
    if (isLoading) return <div data-testid="smart-collections-loading">Loading...</div>;
    return <div data-testid="smart-collections">{children}</div>;
  },
}));

const sampleClusters = [
  {
    id: 'c1',
    name: 'JavaScript',
    description: 'JS related content',
    contentIds: ['1', '2'],
    contentPreviews: [
      { id: '1', title: 'React Hooks', type: 'note' },
      { id: '2', title: 'MDN Web Docs', type: 'link' },
    ],
    size: 2,
  },
  {
    id: 'c2',
    name: 'Python',
    description: 'Python related content',
    contentIds: ['3', '4'],
    contentPreviews: [
      { id: '3', title: 'Django Guide', type: 'note' },
      { id: '4', title: 'Flask Tutorial', type: 'link' },
    ],
    size: 2,
  },
];

describe('SmartCollections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state', () => {
    mockGetClustersAction.mockImplementation(() => new Promise(() => {}));

    render(<SmartCollections />);

    expect(screen.getByTestId('smart-collections-loading')).toBeInTheDocument();
  });

  it('renders clusters with name and description', async () => {
    mockGetClustersAction.mockResolvedValue({
      success: true,
      clusters: sampleClusters,
    });

    render(<SmartCollections />);

    await waitFor(() => {
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
    });
    expect(screen.getByText('JS related content')).toBeInTheDocument();
    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByText('Python related content')).toBeInTheDocument();
  });

  it('shows empty state when no clusters', async () => {
    mockGetClustersAction.mockResolvedValue({
      success: true,
      clusters: [],
    });

    const { queryByTestId } = render(<SmartCollections />);

    await waitFor(() => {
      expect(queryByTestId('smart-collections-loading')).not.toBeInTheDocument();
    });
    expect(queryByTestId('smart-collections')).toBeNull();
  });

  it('Create Collection button calls actions', async () => {
    const user = userEvent.setup();

    mockGetClustersAction.mockResolvedValue({
      success: true,
      clusters: [sampleClusters[0]],
    });
    mockCreateCollectionAction.mockResolvedValue({
      success: true,
      collection: { id: 'col-1' },
      message: 'Collection created',
    });
    mockBulkAddToCollectionAction.mockResolvedValue({
      success: true,
      message: 'Added',
    });

    render(<SmartCollections />);

    await waitFor(() => {
      expect(screen.getByTestId('create-collection-btn')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('create-collection-btn'));

    await waitFor(() => {
      expect(mockCreateCollectionAction).toHaveBeenCalledWith({
        name: 'JavaScript',
        description: 'JS related content',
      });
    });
    expect(mockBulkAddToCollectionAction).toHaveBeenCalledWith(['1', '2'], 'col-1');
  });

  it('button shows Created after success', async () => {
    const user = userEvent.setup();

    mockGetClustersAction.mockResolvedValue({
      success: true,
      clusters: [sampleClusters[0]],
    });
    mockCreateCollectionAction.mockResolvedValue({
      success: true,
      collection: { id: 'col-1' },
      message: 'Collection created',
    });
    mockBulkAddToCollectionAction.mockResolvedValue({
      success: true,
      message: 'Added',
    });

    render(<SmartCollections />);

    await waitFor(() => {
      expect(screen.getByTestId('create-collection-btn')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('create-collection-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('create-collection-btn')).toHaveTextContent('Created');
    });
    expect(screen.getByTestId('create-collection-btn')).toBeDisabled();
  });
});
