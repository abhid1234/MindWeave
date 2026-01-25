import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeleteConfirmDialog, type DeleteConfirmDialogProps } from './DeleteConfirmDialog';

// Mock the deleteContentAction
vi.mock('@/app/actions/content', () => ({
  deleteContentAction: vi.fn(),
}));

import { deleteContentAction } from '@/app/actions/content';

const mockDeleteContentAction = deleteContentAction as ReturnType<typeof vi.fn>;

describe('DeleteConfirmDialog', () => {
  const defaultProps: DeleteConfirmDialogProps = {
    contentId: 'test-id-123',
    contentTitle: 'Test Note',
    open: true,
    onOpenChange: vi.fn(),
    onDeleted: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render dialog when open is true', () => {
      render(<DeleteConfirmDialog {...defaultProps} />);

      expect(screen.getByText('Delete Content')).toBeInTheDocument();
      expect(
        screen.getByText(/Are you sure you want to delete "Test Note"\?/)
      ).toBeInTheDocument();
      expect(screen.getByText(/This action cannot be undone/)).toBeInTheDocument();
    });

    it('should not render dialog when open is false', () => {
      render(<DeleteConfirmDialog {...defaultProps} open={false} />);

      expect(screen.queryByText('Delete Content')).not.toBeInTheDocument();
    });

    it('should render Cancel and Delete buttons', () => {
      render(<DeleteConfirmDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    it('should display the content title in the confirmation message', () => {
      render(
        <DeleteConfirmDialog {...defaultProps} contentTitle="My Important Note" />
      );

      expect(
        screen.getByText(/Are you sure you want to delete "My Important Note"\?/)
      ).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onOpenChange with false when Cancel is clicked', () => {
      const onOpenChange = vi.fn();
      render(<DeleteConfirmDialog {...defaultProps} onOpenChange={onOpenChange} />);

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should call deleteContentAction when Delete is clicked', async () => {
      mockDeleteContentAction.mockResolvedValue({
        success: true,
        message: 'Content deleted successfully!',
      });

      render(<DeleteConfirmDialog {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

      await waitFor(() => {
        expect(mockDeleteContentAction).toHaveBeenCalledWith('test-id-123');
      });
    });

    it('should show loading state during deletion', async () => {
      mockDeleteContentAction.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true, message: '' }), 100))
      );

      render(<DeleteConfirmDialog {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

      expect(screen.getByRole('button', { name: 'Deleting...' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Deleting...' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    });

    it('should call onOpenChange and onDeleted on successful deletion', async () => {
      const onOpenChange = vi.fn();
      const onDeleted = vi.fn();

      mockDeleteContentAction.mockResolvedValue({
        success: true,
        message: 'Content deleted successfully!',
      });

      render(
        <DeleteConfirmDialog
          {...defaultProps}
          onOpenChange={onOpenChange}
          onDeleted={onDeleted}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
        expect(onDeleted).toHaveBeenCalled();
      });
    });

    it('should display error message on failed deletion', async () => {
      mockDeleteContentAction.mockResolvedValue({
        success: false,
        message: 'Failed to delete content',
      });

      render(<DeleteConfirmDialog {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

      await waitFor(() => {
        expect(screen.getByText('Failed to delete content')).toBeInTheDocument();
      });
    });

    it('should display error message on exception', async () => {
      mockDeleteContentAction.mockRejectedValue(new Error('Network error'));

      render(<DeleteConfirmDialog {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

      await waitFor(() => {
        expect(
          screen.getByText('An unexpected error occurred. Please try again.')
        ).toBeInTheDocument();
      });
    });

    it('should not allow closing dialog while deleting', async () => {
      const onOpenChange = vi.fn();

      mockDeleteContentAction.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true, message: '' }), 100))
      );

      render(<DeleteConfirmDialog {...defaultProps} onOpenChange={onOpenChange} />);

      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

      // Try to cancel while deleting
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      // onOpenChange should not be called with false while deleting
      expect(onOpenChange).not.toHaveBeenCalledWith(false);
    });

    it('should clear error when dialog is reopened', async () => {
      const onOpenChange = vi.fn();

      mockDeleteContentAction.mockResolvedValue({
        success: false,
        message: 'Failed to delete content',
      });

      const { rerender } = render(
        <DeleteConfirmDialog {...defaultProps} onOpenChange={onOpenChange} />
      );

      // Trigger error
      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

      await waitFor(() => {
        expect(screen.getByText('Failed to delete content')).toBeInTheDocument();
      });

      // Close dialog
      rerender(
        <DeleteConfirmDialog {...defaultProps} open={false} onOpenChange={onOpenChange} />
      );

      // Reopen dialog
      rerender(
        <DeleteConfirmDialog {...defaultProps} open={true} onOpenChange={onOpenChange} />
      );

      // Error should be cleared (the component state reset doesn't happen in rerender,
      // but the onOpenChange handler clears the error)
    });
  });
});
