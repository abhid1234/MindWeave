import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/tests/test-utils';
import { BulkActionsBar } from './BulkActionsBar';
import * as BulkSelectionModule from './BulkSelectionContext';
import * as contentActions from '@/app/actions/content';

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
  bulkDeleteContentAction: vi.fn(),
  bulkAddTagsAction: vi.fn(),
  bulkShareContentAction: vi.fn(),
  bulkUnshareContentAction: vi.fn(),
}));

// Mock ExportDialog and CollectionSelector
vi.mock('./ExportDialog', () => ({
  ExportDialog: ({ open, onOpenChange }: any) => (
    open ? (
      <div data-testid="export-dialog">
        <button onClick={() => onOpenChange(false)}>Close Export</button>
      </div>
    ) : null
  ),
}));

vi.mock('./CollectionSelector', () => ({
  CollectionSelector: ({ open, onOpenChange, onSuccess }: any) => (
    open ? (
      <div data-testid="collection-dialog">
        <button onClick={() => { onSuccess?.(); onOpenChange(false); }}>Add to Collection</button>
      </div>
    ) : null
  ),
}));

describe('BulkActionsBar', () => {
  const mockDeselectAll = vi.fn();
  const mockToggleSelectionMode = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('When no items selected', () => {
    beforeEach(() => {
      vi.mocked(BulkSelectionModule.useBulkSelection).mockReturnValue({
        selectedIds: new Set(),
        isSelectionMode: true,
        toggleSelectionMode: mockToggleSelectionMode,
        toggleSelection: vi.fn(),
        selectAll: vi.fn(),
        deselectAll: mockDeselectAll,
        isSelected: vi.fn(),
      });
    });

    it('should not render the action bar when no items selected', () => {
      render(<BulkActionsBar />);
      // Action bar content should not be rendered
      expect(screen.queryByText(/items? selected/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });
  });

  describe('When items are selected', () => {
    beforeEach(() => {
      vi.mocked(BulkSelectionModule.useBulkSelection).mockReturnValue({
        selectedIds: new Set(['id1', 'id2', 'id3']),
        isSelectionMode: true,
        toggleSelectionMode: mockToggleSelectionMode,
        toggleSelection: vi.fn(),
        selectAll: vi.fn(),
        deselectAll: mockDeselectAll,
        isSelected: vi.fn(),
      });
    });

    it('should render the action bar', () => {
      render(<BulkActionsBar />);
      expect(screen.getByText('3 items selected')).toBeInTheDocument();
    });

    it('should show singular item text for single selection', () => {
      vi.mocked(BulkSelectionModule.useBulkSelection).mockReturnValue({
        selectedIds: new Set(['id1']),
        isSelectionMode: true,
        toggleSelectionMode: mockToggleSelectionMode,
        toggleSelection: vi.fn(),
        selectAll: vi.fn(),
        deselectAll: mockDeselectAll,
        isSelected: vi.fn(),
      });

      render(<BulkActionsBar />);
      expect(screen.getByText('1 item selected')).toBeInTheDocument();
    });

    describe('Cancel Button', () => {
      it('should render Cancel button', () => {
        render(<BulkActionsBar />);
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });

      it('should deselect all and exit selection mode on cancel', () => {
        render(<BulkActionsBar />);
        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

        expect(mockDeselectAll).toHaveBeenCalled();
        expect(mockToggleSelectionMode).toHaveBeenCalled();
      });
    });

    describe('Action Buttons', () => {
      it('should render Add Tags button', () => {
        render(<BulkActionsBar />);
        expect(screen.getByText('Add Tags')).toBeInTheDocument();
      });

      it('should render Add to Collection button', () => {
        render(<BulkActionsBar />);
        expect(screen.getByText('Add to Collection')).toBeInTheDocument();
      });

      it('should render Share All button', () => {
        render(<BulkActionsBar />);
        expect(screen.getByText('Share All')).toBeInTheDocument();
      });

      it('should render Unshare All button', () => {
        render(<BulkActionsBar />);
        expect(screen.getByText('Unshare All')).toBeInTheDocument();
      });

      it('should render Export button', () => {
        render(<BulkActionsBar />);
        expect(screen.getByText('Export')).toBeInTheDocument();
      });

      it('should render Delete button', () => {
        render(<BulkActionsBar />);
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });
    });

    describe('Delete Action', () => {
      it('should open delete confirmation dialog', () => {
        render(<BulkActionsBar />);
        fireEvent.click(screen.getByRole('button', { name: /delete/i }));

        expect(screen.getByText('Delete 3 Items?')).toBeInTheDocument();
      });

      it('should show item count in delete dialog description', () => {
        render(<BulkActionsBar />);
        fireEvent.click(screen.getByRole('button', { name: /delete/i }));

        expect(screen.getByText(/are you sure you want to delete 3 items/i)).toBeInTheDocument();
      });

      it('should call bulkDeleteContentAction on confirm', async () => {
        vi.mocked(contentActions.bulkDeleteContentAction).mockResolvedValue({
          success: true,
          message: '3 items deleted',
        });

        render(<BulkActionsBar />);
        fireEvent.click(screen.getByRole('button', { name: /delete/i }));

        await waitFor(() => {
          expect(screen.getByRole('button', { name: /delete all/i })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /delete all/i }));

        await waitFor(() => {
          expect(contentActions.bulkDeleteContentAction).toHaveBeenCalledWith(['id1', 'id2', 'id3']);
        });
      });

      it('should clear selections and exit mode on successful delete', async () => {
        vi.mocked(contentActions.bulkDeleteContentAction).mockResolvedValue({
          success: true,
          message: 'Deleted',
        });

        render(<BulkActionsBar />);
        fireEvent.click(screen.getByRole('button', { name: /delete/i }));
        fireEvent.click(screen.getByRole('button', { name: /delete all/i }));

        await waitFor(() => {
          expect(mockDeselectAll).toHaveBeenCalled();
          expect(mockToggleSelectionMode).toHaveBeenCalled();
        });
      });

      it('should show error message on delete failure', async () => {
        vi.mocked(contentActions.bulkDeleteContentAction).mockResolvedValue({
          success: false,
          message: 'Failed to delete items',
        });

        render(<BulkActionsBar />);
        fireEvent.click(screen.getByRole('button', { name: /delete/i }));
        fireEvent.click(screen.getByRole('button', { name: /delete all/i }));

        await waitFor(() => {
          expect(screen.getByText('Failed to delete items')).toBeInTheDocument();
        });
      });
    });

    describe('Add Tags Action', () => {
      it('should open add tags dialog', () => {
        render(<BulkActionsBar />);
        const addTagsButtons = screen.getAllByText('Add Tags');
        fireEvent.click(addTagsButtons[0]);

        expect(screen.getByText('Add Tags to 3 Items')).toBeInTheDocument();
      });

      it('should have input field for tags', () => {
        render(<BulkActionsBar />);
        const addTagsButtons = screen.getAllByText('Add Tags');
        fireEvent.click(addTagsButtons[0]);

        expect(screen.getByPlaceholderText('tag1, tag2, tag3')).toBeInTheDocument();
      });

      it('should call bulkAddTagsAction with parsed tags', async () => {
        vi.mocked(contentActions.bulkAddTagsAction).mockResolvedValue({
          success: true,
          message: 'Tags added',
        });

        render(<BulkActionsBar />);
        const addTagsButtons = screen.getAllByText('Add Tags');
        fireEvent.click(addTagsButtons[0]);

        const input = screen.getByPlaceholderText('tag1, tag2, tag3');
        fireEvent.change(input, { target: { value: 'react, typescript, testing' } });

        // Find the Add Tags button in the dialog
        const dialogAddTagsButtons = screen.getAllByText('Add Tags');
        const dialogButton = dialogAddTagsButtons[dialogAddTagsButtons.length - 1];
        fireEvent.click(dialogButton);

        await waitFor(() => {
          expect(contentActions.bulkAddTagsAction).toHaveBeenCalledWith(
            ['id1', 'id2', 'id3'],
            ['react', 'typescript', 'testing']
          );
        });
      });

      it('should show error when no tags entered', async () => {
        render(<BulkActionsBar />);
        const addTagsButtons = screen.getAllByText('Add Tags');
        fireEvent.click(addTagsButtons[0]);

        const dialogAddTagsButtons = screen.getAllByText('Add Tags');
        const dialogButton = dialogAddTagsButtons[dialogAddTagsButtons.length - 1];
        fireEvent.click(dialogButton);

        await waitFor(() => {
          expect(screen.getByText('Please enter at least one tag.')).toBeInTheDocument();
        });
      });
    });

    describe('Share All Action', () => {
      it('should call bulkShareContentAction', async () => {
        vi.mocked(contentActions.bulkShareContentAction).mockResolvedValue({
          success: true,
          message: '3 items shared',
        });

        render(<BulkActionsBar />);
        fireEvent.click(screen.getByText('Share All'));

        await waitFor(() => {
          expect(contentActions.bulkShareContentAction).toHaveBeenCalledWith(['id1', 'id2', 'id3']);
        });
      });

      it('should show success message', async () => {
        vi.mocked(contentActions.bulkShareContentAction).mockResolvedValue({
          success: true,
          message: '3 items shared',
        });

        render(<BulkActionsBar />);
        fireEvent.click(screen.getByText('Share All'));

        await waitFor(() => {
          expect(screen.getByText('3 items shared')).toBeInTheDocument();
        });
      });
    });

    describe('Unshare All Action', () => {
      it('should call bulkUnshareContentAction', async () => {
        vi.mocked(contentActions.bulkUnshareContentAction).mockResolvedValue({
          success: true,
          message: '3 items unshared',
        });

        render(<BulkActionsBar />);
        fireEvent.click(screen.getByText('Unshare All'));

        await waitFor(() => {
          expect(contentActions.bulkUnshareContentAction).toHaveBeenCalledWith(['id1', 'id2', 'id3']);
        });
      });
    });

    describe('Export Action', () => {
      it('should open export dialog', () => {
        render(<BulkActionsBar />);
        fireEvent.click(screen.getByText('Export'));

        expect(screen.getByTestId('export-dialog')).toBeInTheDocument();
      });
    });

    describe('Add to Collection Action', () => {
      it('should open collection selector dialog', () => {
        render(<BulkActionsBar />);
        const addToCollectionBtn = screen.getByText('Add to Collection');
        fireEvent.click(addToCollectionBtn);

        expect(screen.getByTestId('collection-dialog')).toBeInTheDocument();
      });

      it('should show success message after adding to collection', async () => {
        render(<BulkActionsBar />);
        const addToCollectionBtn = screen.getByText('Add to Collection');
        fireEvent.click(addToCollectionBtn);

        // Find and click the success button in the mock dialog
        const dialogBtn = screen.getByTestId('collection-dialog').querySelector('button');
        if (dialogBtn) fireEvent.click(dialogBtn);

        await waitFor(() => {
          expect(screen.getByText('Added to collection')).toBeInTheDocument();
        });
      });
    });

    describe('Message Display', () => {
      it('should show success message with dismiss button', async () => {
        vi.mocked(contentActions.bulkShareContentAction).mockResolvedValue({
          success: true,
          message: 'Success!',
        });

        render(<BulkActionsBar />);
        fireEvent.click(screen.getByText('Share All'));

        await waitFor(() => {
          // Toast has close button with aria-label
          expect(screen.getByLabelText('Close notification')).toBeInTheDocument();
        });
      });

      it('should clear message when dismiss is clicked', async () => {
        vi.mocked(contentActions.bulkShareContentAction).mockResolvedValue({
          success: true,
          message: 'Success!',
        });

        render(<BulkActionsBar />);
        fireEvent.click(screen.getByText('Share All'));

        await waitFor(() => {
          expect(screen.getByText('Success!')).toBeInTheDocument();
        });

        // Toast close button
        fireEvent.click(screen.getByLabelText('Close notification'));

        await waitFor(() => {
          expect(screen.queryByText('Success!')).not.toBeInTheDocument();
        });
      });

      it('should show error message with red styling', async () => {
        vi.mocked(contentActions.bulkShareContentAction).mockResolvedValue({
          success: false,
          message: 'Error occurred',
        });

        render(<BulkActionsBar />);
        fireEvent.click(screen.getByText('Share All'));

        await waitFor(() => {
          // Toast notifications use bg-red-50 for error variant
          const messageDiv = screen.getByText('Error occurred').closest('div[role="alert"]');
          expect(messageDiv).toHaveClass('bg-red-50');
        });
      });
    });
  });
});
