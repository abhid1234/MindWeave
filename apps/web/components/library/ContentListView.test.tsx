import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContentListView } from './ContentListView';
import * as BulkSelectionModule from './BulkSelectionContext';

// Mock BulkSelectionContext
vi.mock('./BulkSelectionContext', async () => {
  const actual = await vi.importActual('./BulkSelectionContext');
  return {
    ...actual,
    useBulkSelection: vi.fn(),
  };
});

// Mock server actions
vi.mock('@/app/actions/content', () => ({
  toggleFavoriteAction: vi.fn().mockResolvedValue({ success: true, isFavorite: true }),
}));

// Mock toast
vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

// Mock dynamic imports for dialogs
vi.mock('./ContentDetailDialog', () => ({
  ContentDetailDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="detail-dialog">Detail</div> : null,
}));
vi.mock('./DeleteConfirmDialog', () => ({
  DeleteConfirmDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="delete-dialog">Delete</div> : null,
}));
vi.mock('./ContentEditDialog', () => ({
  ContentEditDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="edit-dialog">Edit</div> : null,
}));
vi.mock('./ShareDialog', () => ({
  ShareDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="share-dialog">Share</div> : null,
}));
vi.mock('./CollectionSelector', () => ({
  CollectionSelector: ({ open }: { open: boolean }) =>
    open ? <div data-testid="collection-dialog">Collection</div> : null,
}));
vi.mock('./RecommendationsDialog', () => ({
  RecommendationsDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="recs-dialog">Recs</div> : null,
}));

const mockItems = [
  {
    id: 'item-1',
    type: 'note' as const,
    title: 'My First Note',
    body: 'Note body',
    url: null,
    tags: ['react', 'typescript'],
    autoTags: ['frontend'],
    createdAt: new Date('2024-01-15'),
    metadata: null,
    isShared: false,
    shareId: null,
    isFavorite: false,
  },
  {
    id: 'item-2',
    type: 'link' as const,
    title: 'Useful Article',
    body: null,
    url: 'https://example.com',
    tags: [],
    autoTags: ['web'],
    createdAt: new Date('2024-01-10'),
    metadata: null,
    isShared: true,
    shareId: 'share-1',
    isFavorite: true,
  },
];

describe('ContentListView', () => {
  const mockToggleSelection = vi.fn();
  const mockIsSelected = vi.fn().mockReturnValue(false);

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsSelected.mockReturnValue(false);
    vi.mocked(BulkSelectionModule.useBulkSelection).mockReturnValue({
      isSelectionMode: false,
      toggleSelection: mockToggleSelection,
      isSelected: mockIsSelected,
      selectedIds: new Set(),
      toggleSelectionMode: vi.fn(),
      selectAll: vi.fn(),
      deselectAll: vi.fn(),
    });
  });

  it('should render all items', () => {
    render(<ContentListView items={mockItems} allTags={[]} />);

    expect(screen.getByText('My First Note')).toBeInTheDocument();
    expect(screen.getByText('Useful Article')).toBeInTheDocument();
  });

  it('should display type badges', () => {
    render(<ContentListView items={mockItems} allTags={[]} />);

    expect(screen.getByText('note')).toBeInTheDocument();
    expect(screen.getByText('link')).toBeInTheDocument();
  });

  it('should display tags (first 2)', () => {
    render(<ContentListView items={mockItems} allTags={[]} />);

    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('typescript')).toBeInTheDocument();
  });

  it('should render favorite buttons', () => {
    render(<ContentListView items={mockItems} allTags={[]} />);

    const favButtons = screen.getAllByLabelText(/favorites/);
    expect(favButtons).toHaveLength(2);
  });

  it('should open detail dialog on row click', async () => {
    render(<ContentListView items={mockItems} allTags={[]} />);

    fireEvent.click(screen.getByText('My First Note').closest('[role="button"]')!);

    await waitFor(() => {
      expect(screen.getByTestId('detail-dialog')).toBeInTheDocument();
    });
  });

  it('should open detail dialog on Enter key', async () => {
    render(<ContentListView items={mockItems} allTags={[]} />);

    fireEvent.keyDown(screen.getByText('My First Note').closest('[role="button"]')!, { key: 'Enter' });

    await waitFor(() => {
      expect(screen.getByTestId('detail-dialog')).toBeInTheDocument();
    });
  });

  describe('Selection mode', () => {
    beforeEach(() => {
      vi.mocked(BulkSelectionModule.useBulkSelection).mockReturnValue({
        isSelectionMode: true,
        toggleSelection: mockToggleSelection,
        isSelected: mockIsSelected,
        selectedIds: new Set(),
        toggleSelectionMode: vi.fn(),
        selectAll: vi.fn(),
        deselectAll: vi.fn(),
      });
    });

    it('should show checkboxes in selection mode', () => {
      render(<ContentListView items={mockItems} allTags={[]} />);

      // Checkboxes are rendered as divs with specific size classes
      const checkboxes = document.querySelectorAll('.h-5.w-5');
      expect(checkboxes.length).toBe(2);
    });

    it('should toggle selection on row click in selection mode', () => {
      render(<ContentListView items={mockItems} allTags={[]} />);

      fireEvent.click(screen.getByText('My First Note').closest('[role="button"]')!);

      expect(mockToggleSelection).toHaveBeenCalledWith('item-1');
    });

    it('should not open detail dialog in selection mode', () => {
      render(<ContentListView items={mockItems} allTags={[]} />);

      fireEvent.click(screen.getByText('My First Note').closest('[role="button"]')!);

      expect(screen.queryByTestId('detail-dialog')).not.toBeInTheDocument();
    });

    it('should highlight selected rows', () => {
      mockIsSelected.mockImplementation((id: string) => id === 'item-1');

      render(<ContentListView items={mockItems} allTags={[]} />);

      const firstRow = screen.getByText('My First Note').closest('[role="button"]')!;
      expect(firstRow.className).toContain('ring-2');
      expect(firstRow.className).toContain('ring-primary');
    });
  });

  it('should render empty when no items', () => {
    const { container } = render(<ContentListView items={[]} allTags={[]} />);

    // space-y-1 container should be empty
    expect(container.querySelector('.space-y-1')?.children.length).toBe(0);
  });
});
