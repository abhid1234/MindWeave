import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MoveCollectionDialog } from './MoveCollectionDialog';

// Mock useToast
const mockAddToast = vi.fn();
vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({ addToast: mockAddToast, toasts: [], removeToast: vi.fn() }),
}));

// Mock server actions
vi.mock('@/app/actions/collections', () => ({
  getCollectionsAction: vi.fn(),
  bulkMoveToCollectionAction: vi.fn(),
}));

import { getCollectionsAction, bulkMoveToCollectionAction } from '@/app/actions/collections';

const mockGetCollectionsAction = getCollectionsAction as ReturnType<typeof vi.fn>;
const mockBulkMoveToCollectionAction = bulkMoveToCollectionAction as ReturnType<typeof vi.fn>;

describe('MoveCollectionDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSuccess = vi.fn();

  const mockCollections = [
    { id: 'col-1', name: 'Collection A', description: null, color: '#EF4444', contentCount: 5, createdAt: new Date(), updatedAt: new Date() },
    { id: 'col-2', name: 'Collection B', description: null, color: '#3B82F6', contentCount: 3, createdAt: new Date(), updatedAt: new Date() },
    { id: 'col-3', name: 'Collection C', description: null, color: '#10B981', contentCount: 1, createdAt: new Date(), updatedAt: new Date() },
  ];

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    contentIds: ['content-1', 'content-2'],
    onSuccess: mockOnSuccess,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCollectionsAction.mockResolvedValue({
      success: true,
      collections: mockCollections,
    });
  });

  describe('Rendering', () => {
    it('should render dialog with title and description', async () => {
      render(<MoveCollectionDialog {...defaultProps} />);

      expect(screen.getByText('Move to Collection')).toBeInTheDocument();
      expect(
        screen.getByText('Move 2 items from one collection to another.')
      ).toBeInTheDocument();
    });

    it('should use singular "item" for single content', async () => {
      render(<MoveCollectionDialog {...defaultProps} contentIds={['content-1']} />);

      expect(
        screen.getByText('Move 1 item from one collection to another.')
      ).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner while fetching collections', async () => {
      mockGetCollectionsAction.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  collections: mockCollections,
                }),
              100
            )
          )
      );

      render(<MoveCollectionDialog {...defaultProps} />);

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Insufficient Collections', () => {
    it('should show message when fewer than 2 collections exist', async () => {
      mockGetCollectionsAction.mockResolvedValue({
        success: true,
        collections: [{ id: 'col-1', name: 'Only One', description: null, color: null, contentCount: 0, createdAt: new Date(), updatedAt: new Date() }],
      });

      render(<MoveCollectionDialog {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('You need at least 2 collections to move content between them.')
        ).toBeInTheDocument();
      });
    });

    it('should show message when no collections exist', async () => {
      mockGetCollectionsAction.mockResolvedValue({
        success: true,
        collections: [],
      });

      render(<MoveCollectionDialog {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.getByText('You need at least 2 collections to move content between them.')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Collection Selects', () => {
    it('should render From and To collection selects', async () => {
      render(<MoveCollectionDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('From')).toBeInTheDocument();
        expect(screen.getByText('To')).toBeInTheDocument();
      });

      const fromSelect = screen.getByTestId('from-collection-select');
      const toSelect = screen.getByTestId('to-collection-select');
      expect(fromSelect).toBeInTheDocument();
      expect(toSelect).toBeInTheDocument();
    });

    it('should populate selects with collection options', async () => {
      render(<MoveCollectionDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('from-collection-select')).toBeInTheDocument();
      });

      const fromSelect = screen.getByTestId('from-collection-select');
      const options = fromSelect.querySelectorAll('option');
      // "Select..." + 3 collections
      expect(options).toHaveLength(4);
      expect(options[1].textContent).toBe('Collection A');
      expect(options[2].textContent).toBe('Collection B');
      expect(options[3].textContent).toBe('Collection C');
    });

    it('should filter selected from-collection out of to-collection options', async () => {
      render(<MoveCollectionDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('from-collection-select')).toBeInTheDocument();
      });

      const fromSelect = screen.getByTestId('from-collection-select');
      fireEvent.change(fromSelect, { target: { value: 'col-1' } });

      const toSelect = screen.getByTestId('to-collection-select');
      const toOptions = toSelect.querySelectorAll('option');
      // "Select..." + 2 remaining collections (col-2, col-3)
      expect(toOptions).toHaveLength(3);
      expect(toOptions[1].textContent).toBe('Collection B');
      expect(toOptions[2].textContent).toBe('Collection C');
    });
  });

  describe('Move Button State', () => {
    it('should disable Move button when no collections are selected', async () => {
      render(<MoveCollectionDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('from-collection-select')).toBeInTheDocument();
      });

      const moveBtn = screen.getByRole('button', { name: 'Move' });
      expect(moveBtn).toBeDisabled();
    });

    it('should disable Move button when only from-collection is selected', async () => {
      render(<MoveCollectionDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('from-collection-select')).toBeInTheDocument();
      });

      const fromSelect = screen.getByTestId('from-collection-select');
      fireEvent.change(fromSelect, { target: { value: 'col-1' } });

      const moveBtn = screen.getByRole('button', { name: 'Move' });
      expect(moveBtn).toBeDisabled();
    });

    it('should enable Move button when different from and to collections are selected', async () => {
      render(<MoveCollectionDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('from-collection-select')).toBeInTheDocument();
      });

      const fromSelect = screen.getByTestId('from-collection-select');
      fireEvent.change(fromSelect, { target: { value: 'col-1' } });

      const toSelect = screen.getByTestId('to-collection-select');
      fireEvent.change(toSelect, { target: { value: 'col-2' } });

      const moveBtn = screen.getByRole('button', { name: 'Move' });
      expect(moveBtn).not.toBeDisabled();
    });
  });

  describe('Move Functionality', () => {
    it('should call bulkMoveToCollectionAction on move', async () => {
      mockBulkMoveToCollectionAction.mockResolvedValue({
        success: true,
        message: 'Moved 2 items successfully',
      });

      render(<MoveCollectionDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('from-collection-select')).toBeInTheDocument();
      });

      const fromSelect = screen.getByTestId('from-collection-select');
      fireEvent.change(fromSelect, { target: { value: 'col-1' } });

      const toSelect = screen.getByTestId('to-collection-select');
      fireEvent.change(toSelect, { target: { value: 'col-2' } });

      const moveBtn = screen.getByRole('button', { name: 'Move' });
      fireEvent.click(moveBtn);

      await waitFor(() => {
        expect(mockBulkMoveToCollectionAction).toHaveBeenCalledWith(
          ['content-1', 'content-2'],
          'col-1',
          'col-2'
        );
      });
    });

    it('should call onSuccess and close dialog on successful move', async () => {
      mockBulkMoveToCollectionAction.mockResolvedValue({
        success: true,
        message: 'Moved 2 items successfully',
      });

      render(<MoveCollectionDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('from-collection-select')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByTestId('from-collection-select'), {
        target: { value: 'col-1' },
      });
      fireEvent.change(screen.getByTestId('to-collection-select'), {
        target: { value: 'col-2' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Move' }));

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('should show success toast on successful move', async () => {
      mockBulkMoveToCollectionAction.mockResolvedValue({
        success: true,
        message: 'Moved 2 items successfully',
      });

      render(<MoveCollectionDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('from-collection-select')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByTestId('from-collection-select'), {
        target: { value: 'col-1' },
      });
      fireEvent.change(screen.getByTestId('to-collection-select'), {
        target: { value: 'col-2' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Move' }));

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith({
          variant: 'success',
          title: 'Moved',
          description: 'Moved 2 items successfully',
        });
      });
    });

    it('should show error toast on failed move', async () => {
      mockBulkMoveToCollectionAction.mockResolvedValue({
        success: false,
        message: 'Move failed due to server error',
      });

      render(<MoveCollectionDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('from-collection-select')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByTestId('from-collection-select'), {
        target: { value: 'col-1' },
      });
      fireEvent.change(screen.getByTestId('to-collection-select'), {
        target: { value: 'col-2' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Move' }));

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith({
          variant: 'error',
          title: 'Move failed',
          description: 'Move failed due to server error',
        });
      });
    });

    it('should show error toast on unexpected exception', async () => {
      mockBulkMoveToCollectionAction.mockRejectedValue(new Error('Network error'));

      render(<MoveCollectionDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('from-collection-select')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByTestId('from-collection-select'), {
        target: { value: 'col-1' },
      });
      fireEvent.change(screen.getByTestId('to-collection-select'), {
        target: { value: 'col-2' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Move' }));

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith({
          variant: 'error',
          title: 'Move failed',
          description: 'An unexpected error occurred.',
        });
      });
    });

    it('should show "Moving..." text while move is in progress', async () => {
      mockBulkMoveToCollectionAction.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true, message: 'Done' }), 100)
          )
      );

      render(<MoveCollectionDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('from-collection-select')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByTestId('from-collection-select'), {
        target: { value: 'col-1' },
      });
      fireEvent.change(screen.getByTestId('to-collection-select'), {
        target: { value: 'col-2' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Move' }));

      expect(screen.getByText('Moving...')).toBeInTheDocument();
    });

    it('should disable Cancel button while moving', async () => {
      mockBulkMoveToCollectionAction.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true, message: 'Done' }), 100)
          )
      );

      render(<MoveCollectionDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('from-collection-select')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByTestId('from-collection-select'), {
        target: { value: 'col-1' },
      });
      fireEvent.change(screen.getByTestId('to-collection-select'), {
        target: { value: 'col-2' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Move' }));

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    });
  });

  describe('Cancel Button', () => {
    it('should close dialog when Cancel is clicked', async () => {
      render(<MoveCollectionDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Data Fetching', () => {
    it('should fetch collections when dialog opens', async () => {
      render(<MoveCollectionDialog {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetCollectionsAction).toHaveBeenCalled();
      });
    });

    it('should not fetch collections when dialog is closed', () => {
      render(<MoveCollectionDialog {...defaultProps} open={false} />);

      expect(mockGetCollectionsAction).not.toHaveBeenCalled();
    });
  });
});
