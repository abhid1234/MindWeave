import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContentEditDialog, type ContentEditDialogProps } from './ContentEditDialog';

// Mock the updateContentAction
vi.mock('@/app/actions/content', () => ({
  updateContentAction: vi.fn(),
}));

import { updateContentAction } from '@/app/actions/content';

const mockUpdateContentAction = updateContentAction as ReturnType<typeof vi.fn>;

describe('ContentEditDialog', () => {
  const defaultProps: ContentEditDialogProps = {
    content: {
      id: 'test-id-123',
      type: 'note',
      title: 'Test Note',
      body: 'Test body content',
      url: null,
    },
    open: true,
    onOpenChange: vi.fn(),
    onUpdated: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render dialog when open is true', () => {
      render(<ContentEditDialog {...defaultProps} />);

      expect(screen.getByText('Edit Content')).toBeInTheDocument();
      expect(screen.getByText('Editing')).toBeInTheDocument();
      expect(screen.getByText('note')).toBeInTheDocument();
    });

    it('should not render dialog when open is false', () => {
      render(<ContentEditDialog {...defaultProps} open={false} />);

      expect(screen.queryByText('Edit Content')).not.toBeInTheDocument();
    });

    it('should render form fields with current content values', async () => {
      render(<ContentEditDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Title/)).toHaveValue('Test Note');
        expect(screen.getByRole('textbox', { name: /Content/i })).toHaveValue('Test body content');
      });
    });

    it('should show URL field for link type content', () => {
      render(
        <ContentEditDialog
          {...defaultProps}
          content={{
            ...defaultProps.content,
            type: 'link',
            url: 'https://example.com',
          }}
        />
      );

      expect(screen.getByLabelText(/URL/)).toHaveValue('https://example.com');
    });

    it('should not show URL field for note type content', () => {
      render(<ContentEditDialog {...defaultProps} />);

      expect(screen.queryByLabelText(/URL/)).not.toBeInTheDocument();
    });

    it('should render Cancel and Save Changes buttons', () => {
      render(<ContentEditDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
    });

    it('should display content type badge', () => {
      render(<ContentEditDialog {...defaultProps} />);

      const badge = screen.getByText('note');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Form interactions', () => {
    it('should update title field on input', async () => {
      const user = userEvent.setup();
      render(<ContentEditDialog {...defaultProps} />);

      const titleInput = screen.getByLabelText(/Title/);
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Title');

      expect(titleInput).toHaveValue('Updated Title');
    });

    it('should update body field on input', async () => {
      const user = userEvent.setup();
      render(<ContentEditDialog {...defaultProps} />);

      const bodyInput = screen.getByRole('textbox', { name: /Content/i });
      await user.clear(bodyInput);
      await user.type(bodyInput, 'Updated body');

      expect(bodyInput).toHaveValue('Updated body');
    });

    it('should update URL field on input for link type', async () => {
      const user = userEvent.setup();
      render(
        <ContentEditDialog
          {...defaultProps}
          content={{
            ...defaultProps.content,
            type: 'link',
            url: 'https://example.com',
          }}
        />
      );

      const urlInput = screen.getByLabelText(/URL/);
      await user.clear(urlInput);
      await user.type(urlInput, 'https://new-url.com');

      expect(urlInput).toHaveValue('https://new-url.com');
    });
  });

  describe('Form submission', () => {
    it('should call updateContentAction on form submit', async () => {
      const user = userEvent.setup();

      mockUpdateContentAction.mockResolvedValue({
        success: true,
        message: 'Content updated successfully!',
        data: { id: 'test-id-123' },
      });

      render(<ContentEditDialog {...defaultProps} />);

      const titleInput = screen.getByLabelText(/Title/);
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Title');

      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

      await waitFor(() => {
        expect(mockUpdateContentAction).toHaveBeenCalledWith({
          contentId: 'test-id-123',
          title: 'Updated Title',
          body: 'Test body content',
          url: undefined,
        });
      });
    });

    it('should include URL in submit for link type', async () => {
      mockUpdateContentAction.mockResolvedValue({
        success: true,
        message: 'Content updated successfully!',
        data: { id: 'test-id-123' },
      });

      render(
        <ContentEditDialog
          {...defaultProps}
          content={{
            ...defaultProps.content,
            type: 'link',
            url: 'https://example.com',
          }}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

      await waitFor(() => {
        expect(mockUpdateContentAction).toHaveBeenCalledWith({
          contentId: 'test-id-123',
          title: 'Test Note',
          body: 'Test body content',
          url: 'https://example.com',
        });
      });
    });

    it('should show loading state during submission', async () => {
      mockUpdateContentAction.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true, message: '', data: { id: 'test-id-123' } }), 100)
          )
      );

      render(<ContentEditDialog {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

      expect(screen.getByRole('button', { name: 'Saving...' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    });

    it('should call onOpenChange and onUpdated on successful submit', async () => {
      const onOpenChange = vi.fn();
      const onUpdated = vi.fn();

      mockUpdateContentAction.mockResolvedValue({
        success: true,
        message: 'Content updated successfully!',
        data: { id: 'test-id-123' },
      });

      render(
        <ContentEditDialog
          {...defaultProps}
          onOpenChange={onOpenChange}
          onUpdated={onUpdated}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
        expect(onUpdated).toHaveBeenCalled();
      });
    });

    it('should display general error message on failed submit', async () => {
      mockUpdateContentAction.mockResolvedValue({
        success: false,
        message: 'Failed to update content',
      });

      render(<ContentEditDialog {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

      await waitFor(() => {
        expect(screen.getByText('Failed to update content')).toBeInTheDocument();
      });
    });

    it('should display field-level errors', async () => {
      mockUpdateContentAction.mockResolvedValue({
        success: false,
        message: 'Validation failed',
        errors: {
          title: ['Title is required'],
        },
      });

      render(<ContentEditDialog {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
      });
    });

    it('should display URL field error for link type', async () => {
      mockUpdateContentAction.mockResolvedValue({
        success: false,
        message: 'Validation failed',
        errors: {
          url: ['Invalid URL format'],
        },
      });

      render(
        <ContentEditDialog
          {...defaultProps}
          content={{
            ...defaultProps.content,
            type: 'link',
            url: 'https://example.com',
          }}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

      // First verify the mock was called
      await waitFor(() => {
        expect(mockUpdateContentAction).toHaveBeenCalled();
      });

      // Then verify the error is displayed
      await waitFor(() => {
        expect(screen.getByText('Invalid URL format')).toBeInTheDocument();
      });
    });

    it('should display error message on exception', async () => {
      mockUpdateContentAction.mockRejectedValue(new Error('Network error'));

      render(<ContentEditDialog {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

      await waitFor(() => {
        expect(
          screen.getByText('An unexpected error occurred. Please try again.')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Dialog controls', () => {
    it('should call onOpenChange with false when Cancel is clicked', () => {
      const onOpenChange = vi.fn();
      render(<ContentEditDialog {...defaultProps} onOpenChange={onOpenChange} />);

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should reset form when dialog is reopened', async () => {
      const onOpenChange = vi.fn();

      const { rerender } = render(
        <ContentEditDialog {...defaultProps} onOpenChange={onOpenChange} />
      );

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByLabelText(/Title/)).toHaveValue('Test Note');
      });

      // Modify title
      const titleInput = screen.getByLabelText(/Title/);
      fireEvent.change(titleInput, { target: { value: 'Modified Title' } });
      expect(titleInput).toHaveValue('Modified Title');

      // Close dialog
      rerender(
        <ContentEditDialog {...defaultProps} open={false} onOpenChange={onOpenChange} />
      );

      // Reopen dialog
      rerender(
        <ContentEditDialog {...defaultProps} open={true} onOpenChange={onOpenChange} />
      );

      // Title should be reset to original value - wait for effect to run
      await waitFor(() => {
        expect(screen.getByLabelText(/Title/)).toHaveValue('Test Note');
      });
    });

    it('should not allow closing dialog while submitting', async () => {
      const onOpenChange = vi.fn();

      mockUpdateContentAction.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true, message: '', data: { id: 'test-id-123' } }), 100)
          )
      );

      render(<ContentEditDialog {...defaultProps} onOpenChange={onOpenChange} />);

      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

      // Try to cancel while submitting
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      // onOpenChange should not be called with false while submitting
      expect(onOpenChange).not.toHaveBeenCalledWith(false);
    });
  });
});
