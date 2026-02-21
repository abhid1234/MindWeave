import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CollectionDropZones } from './CollectionDropZones';

// Mock dnd-kit
vi.mock('@dnd-kit/core', () => ({
  useDroppable: vi.fn().mockReturnValue({ setNodeRef: vi.fn() }),
}));

// Mock collections action
const mockGetCollections = vi.fn();
vi.mock('@/app/actions/collections', () => ({
  getCollectionsAction: (...args: unknown[]) => mockGetCollections(...args),
}));

const mockCollections = [
  { id: 'col-1', name: 'Work', color: '#ff0000', description: null, contentCount: 5, createdAt: new Date(), updatedAt: new Date() },
  { id: 'col-2', name: 'Personal', color: '#00ff00', description: null, contentCount: 3, createdAt: new Date(), updatedAt: new Date() },
];

describe('CollectionDropZones', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCollections.mockResolvedValue({
      success: true,
      collections: mockCollections,
    });
  });

  it('should not render anything when isDragging is false', () => {
    const { container } = render(
      <CollectionDropZones isDragging={false} overCollectionId={null} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render collection zones when isDragging is true', async () => {
    render(<CollectionDropZones isDragging={true} overCollectionId={null} />);

    await waitFor(() => {
      expect(screen.getByText('Work')).toBeInTheDocument();
      expect(screen.getByText('Personal')).toBeInTheDocument();
    });
  });

  it('should show empty state when no collections exist', async () => {
    mockGetCollections.mockResolvedValue({
      success: true,
      collections: [],
    });

    render(<CollectionDropZones isDragging={true} overCollectionId={null} />);

    await waitFor(() => {
      expect(screen.getByText('Create a collection to organize by drag')).toBeInTheDocument();
    });
  });

  it('should show "Drop on a collection:" label', async () => {
    render(<CollectionDropZones isDragging={true} overCollectionId={null} />);

    await waitFor(() => {
      expect(screen.getByText('Drop on a collection:')).toBeInTheDocument();
    });
  });

  it('should highlight the active collection zone', async () => {
    render(<CollectionDropZones isDragging={true} overCollectionId="col-1" />);

    await waitFor(() => {
      const workZone = screen.getByText('Work').closest('div[class*="border"]');
      expect(workZone?.className).toContain('border-primary');
      expect(workZone?.className).toContain('scale-105');
    });
  });

  it('should not highlight non-active collection zones', async () => {
    render(<CollectionDropZones isDragging={true} overCollectionId="col-1" />);

    await waitFor(() => {
      const personalZone = screen.getByText('Personal').closest('div[class*="border"]');
      expect(personalZone?.className).toContain('border-dashed');
      expect(personalZone?.className).not.toContain('scale-105');
    });
  });

  it('should call getCollectionsAction on mount', async () => {
    render(<CollectionDropZones isDragging={true} overCollectionId={null} />);

    await waitFor(() => {
      expect(mockGetCollections).toHaveBeenCalledTimes(1);
    });
  });

  it('should handle failed collections fetch', async () => {
    mockGetCollections.mockResolvedValue({
      success: false,
      collections: [],
      message: 'Unauthorized',
    });

    render(<CollectionDropZones isDragging={true} overCollectionId={null} />);

    await waitFor(() => {
      expect(screen.getByText('Create a collection to organize by drag')).toBeInTheDocument();
    });
  });

  it('should render color dots for collections', async () => {
    render(<CollectionDropZones isDragging={true} overCollectionId={null} />);

    await waitFor(() => {
      const colorDots = document.querySelectorAll('span[style*="background-color"]');
      expect(colorDots.length).toBe(2);
    });
  });
});
