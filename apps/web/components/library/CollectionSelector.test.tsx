import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CollectionSelector } from './CollectionSelector';
import * as collectionActions from '@/app/actions/collections';

// Mock server actions
vi.mock('@/app/actions/collections', () => ({
  getCollectionsAction: vi.fn(),
  getContentCollectionsAction: vi.fn(),
  addToCollectionAction: vi.fn(),
  removeFromCollectionAction: vi.fn(),
  bulkAddToCollectionAction: vi.fn(),
}));

// Mock CollectionDialog
vi.mock('./CollectionDialog', () => ({
  CollectionDialog: ({ open, onOpenChange, onSuccess }: any) => (
    open ? (
      <div data-testid="collection-dialog">
        <button onClick={() => onOpenChange(false)}>Close Dialog</button>
        <button onClick={() => { onSuccess?.(); onOpenChange(false); }}>Create Collection</button>
      </div>
    ) : null
  ),
}));

describe('CollectionSelector', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSuccess = vi.fn();

  const mockCollections = [
    { id: 'col-1', name: 'Collection 1', description: 'Desc 1', color: '#EF4444', contentCount: 5, createdAt: new Date(), updatedAt: new Date() },
    { id: 'col-2', name: 'Collection 2', description: null, color: '#3B82F6', contentCount: 3, createdAt: new Date(), updatedAt: new Date() },
    { id: 'col-3', name: 'Collection 3', description: 'Desc 3', color: null, contentCount: 0, createdAt: new Date(), updatedAt: new Date() },
  ];

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    onSuccess: mockOnSuccess,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(collectionActions.getCollectionsAction).mockResolvedValue({
      success: true,
      collections: mockCollections,
    });
    vi.mocked(collectionActions.getContentCollectionsAction).mockResolvedValue({
      success: true,
      collectionIds: [],
    });
  });

  describe('Rendering', () => {
    it('should render dialog title for single content', async () => {
      render(<CollectionSelector {...defaultProps} contentId="content-1" />);
      await waitFor(() => {
        expect(screen.getByText('Manage Collections')).toBeInTheDocument();
      });
    });

    it('should render dialog title for bulk mode', async () => {
      render(
        <CollectionSelector
          {...defaultProps}
          contentIds={['content-1', 'content-2', 'content-3']}
        />
      );
      await waitFor(() => {
        expect(screen.getByText('Add 3 items to Collections')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner while fetching collections', async () => {
      vi.mocked(collectionActions.getCollectionsAction).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          success: true,
          collections: mockCollections,
        }), 100))
      );

      render(<CollectionSelector {...defaultProps} contentId="content-1" />);
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no collections exist', async () => {
      vi.mocked(collectionActions.getCollectionsAction).mockResolvedValue({
        success: true,
        collections: [],
      });

      render(<CollectionSelector {...defaultProps} contentId="content-1" />);

      await waitFor(() => {
        expect(screen.getByText('No collections yet')).toBeInTheDocument();
      });
    });

    it('should show Create Collection button in empty state', async () => {
      vi.mocked(collectionActions.getCollectionsAction).mockResolvedValue({
        success: true,
        collections: [],
      });

      render(<CollectionSelector {...defaultProps} contentId="content-1" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create collection/i })).toBeInTheDocument();
      });
    });
  });

  describe('Collection List', () => {
    it('should render all collections', async () => {
      render(<CollectionSelector {...defaultProps} contentId="content-1" />);

      await waitFor(() => {
        expect(screen.getByText('Collection 1')).toBeInTheDocument();
        expect(screen.getByText('Collection 2')).toBeInTheDocument();
        expect(screen.getByText('Collection 3')).toBeInTheDocument();
      });
    });

    it('should display collection descriptions', async () => {
      render(<CollectionSelector {...defaultProps} contentId="content-1" />);

      await waitFor(() => {
        expect(screen.getByText('Desc 1')).toBeInTheDocument();
        expect(screen.getByText('Desc 3')).toBeInTheDocument();
      });
    });

    it('should display content counts', async () => {
      render(<CollectionSelector {...defaultProps} contentId="content-1" />);

      await waitFor(() => {
        expect(screen.getByText('5 items')).toBeInTheDocument();
        expect(screen.getByText('3 items')).toBeInTheDocument();
        expect(screen.getByText('0 items')).toBeInTheDocument();
      });
    });

    it('should show color indicators', async () => {
      render(<CollectionSelector {...defaultProps} contentId="content-1" />);

      await waitFor(() => {
        const colorDivs = document.querySelectorAll('[style*="background-color"]');
        expect(colorDivs.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Selection Behavior', () => {
    it('should toggle collection selection on click', async () => {
      render(<CollectionSelector {...defaultProps} contentId="content-1" />);

      await waitFor(() => {
        expect(screen.getByText('Collection 1')).toBeInTheDocument();
      });

      const collection1Button = screen.getByText('Collection 1').closest('button');
      fireEvent.click(collection1Button!);

      // Should show check mark when selected
      await waitFor(() => {
        expect(collection1Button).toHaveClass('border-primary');
      });
    });

    it('should load current collections for single content', async () => {
      vi.mocked(collectionActions.getContentCollectionsAction).mockResolvedValue({
        success: true,
        collectionIds: ['col-1', 'col-2'],
      });

      render(<CollectionSelector {...defaultProps} contentId="content-1" />);

      await waitFor(() => {
        expect(collectionActions.getContentCollectionsAction).toHaveBeenCalledWith('content-1');
      });
    });

    it('should not load current collections in bulk mode', async () => {
      render(
        <CollectionSelector
          {...defaultProps}
          contentIds={['content-1', 'content-2']}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Collection 1')).toBeInTheDocument();
      });

      expect(collectionActions.getContentCollectionsAction).not.toHaveBeenCalled();
    });
  });

  describe('Save Functionality', () => {
    describe('Single Content Mode', () => {
      it('should add new collections and remove old ones', async () => {
        vi.mocked(collectionActions.getContentCollectionsAction).mockResolvedValue({
          success: true,
          collectionIds: ['col-1'],
        });
        vi.mocked(collectionActions.addToCollectionAction).mockResolvedValue({ success: true, message: 'Added to collection' });
        vi.mocked(collectionActions.removeFromCollectionAction).mockResolvedValue({ success: true, message: 'Removed from collection' });

        render(<CollectionSelector {...defaultProps} contentId="content-1" />);

        await waitFor(() => {
          expect(screen.getByText('Collection 1')).toBeInTheDocument();
        });

        // Toggle off col-1 (remove) and toggle on col-2 (add)
        fireEvent.click(screen.getByText('Collection 1').closest('button')!);
        fireEvent.click(screen.getByText('Collection 2').closest('button')!);

        const saveBtn = screen.getByRole('button', { name: /save/i });
        fireEvent.click(saveBtn);

        await waitFor(() => {
          expect(collectionActions.removeFromCollectionAction).toHaveBeenCalledWith('content-1', 'col-1');
          expect(collectionActions.addToCollectionAction).toHaveBeenCalledWith('content-1', 'col-2');
        });
      });

      it('should call onSuccess and close dialog after save', async () => {
        vi.mocked(collectionActions.getContentCollectionsAction).mockResolvedValue({
          success: true,
          collectionIds: [],
        });
        vi.mocked(collectionActions.addToCollectionAction).mockResolvedValue({ success: true, message: 'Added to collection' });

        render(<CollectionSelector {...defaultProps} contentId="content-1" />);

        await waitFor(() => {
          expect(screen.getByText('Collection 1')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Collection 1').closest('button')!);

        const saveBtn = screen.getByRole('button', { name: /save/i });
        fireEvent.click(saveBtn);

        await waitFor(() => {
          expect(mockOnSuccess).toHaveBeenCalled();
          expect(mockOnOpenChange).toHaveBeenCalledWith(false);
        });
      });
    });

    describe('Bulk Mode', () => {
      it('should call bulkAddToCollectionAction for each selected collection', async () => {
        vi.mocked(collectionActions.bulkAddToCollectionAction).mockResolvedValue({ success: true, message: 'Added to collection' });

        render(
          <CollectionSelector
            {...defaultProps}
            contentIds={['content-1', 'content-2']}
          />
        );

        await waitFor(() => {
          expect(screen.getByText('Collection 1')).toBeInTheDocument();
        });

        // Select two collections
        fireEvent.click(screen.getByText('Collection 1').closest('button')!);
        fireEvent.click(screen.getByText('Collection 2').closest('button')!);

        const saveBtn = screen.getByRole('button', { name: /save/i });
        fireEvent.click(saveBtn);

        await waitFor(() => {
          expect(collectionActions.bulkAddToCollectionAction).toHaveBeenCalledWith(
            ['content-1', 'content-2'],
            'col-1'
          );
          expect(collectionActions.bulkAddToCollectionAction).toHaveBeenCalledWith(
            ['content-1', 'content-2'],
            'col-2'
          );
        });
      });
    });
  });

  describe('Create Collection Button', () => {
    it('should show New Collection button when collections exist', async () => {
      render(<CollectionSelector {...defaultProps} contentId="content-1" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new collection/i })).toBeInTheDocument();
      });
    });

    it('should open CollectionDialog when New Collection is clicked', async () => {
      render(<CollectionSelector {...defaultProps} contentId="content-1" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new collection/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /new collection/i }));

      await waitFor(() => {
        expect(screen.getByTestId('collection-dialog')).toBeInTheDocument();
      });
    });

    it('should reload collections after creating new collection', async () => {
      render(<CollectionSelector {...defaultProps} contentId="content-1" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new collection/i })).toBeInTheDocument();
      });

      // Initial load
      expect(collectionActions.getCollectionsAction).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole('button', { name: /new collection/i }));

      await waitFor(() => {
        expect(screen.getByTestId('collection-dialog')).toBeInTheDocument();
      });

      // Click the "Create Collection" button in the mock dialog
      fireEvent.click(screen.getByText('Create Collection'));

      await waitFor(() => {
        expect(collectionActions.getCollectionsAction).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when load fails', async () => {
      vi.mocked(collectionActions.getCollectionsAction).mockRejectedValue(new Error('Network error'));

      render(<CollectionSelector {...defaultProps} contentId="content-1" />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load collections')).toBeInTheDocument();
      });
    });

    it('should display error message when save fails', async () => {
      vi.mocked(collectionActions.getContentCollectionsAction).mockResolvedValue({
        success: true,
        collectionIds: [],
      });
      vi.mocked(collectionActions.addToCollectionAction).mockRejectedValue(new Error('Save failed'));

      render(<CollectionSelector {...defaultProps} contentId="content-1" />);

      await waitFor(() => {
        expect(screen.getByText('Collection 1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Collection 1').closest('button')!);

      const saveBtn = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText('Failed to update collections')).toBeInTheDocument();
      });
    });
  });

  describe('Cancel Button', () => {
    it('should close dialog when Cancel is clicked', async () => {
      render(<CollectionSelector {...defaultProps} contentId="content-1" />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
