import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CollectionDialog } from './CollectionDialog';
import * as collectionActions from '@/app/actions/collections';

// Mock server actions
vi.mock('@/app/actions/collections', () => ({
  createCollectionAction: vi.fn(),
  updateCollectionAction: vi.fn(),
}));

describe('CollectionDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSuccess = vi.fn();

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    onSuccess: mockOnSuccess,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Mode', () => {
    it('should render with Create Collection title', () => {
      render(<CollectionDialog {...defaultProps} />);
      expect(screen.getByRole('heading', { name: /create collection/i })).toBeInTheDocument();
    });

    it('should render create description', () => {
      render(<CollectionDialog {...defaultProps} />);
      expect(screen.getByText(/create a new collection to organize your content/i)).toBeInTheDocument();
    });

    it('should have empty name field', () => {
      render(<CollectionDialog {...defaultProps} />);
      const nameInput = screen.getByLabelText(/name/i);
      expect(nameInput).toHaveValue('');
    });

    it('should have empty description field', () => {
      render(<CollectionDialog {...defaultProps} />);
      const descInput = screen.getByLabelText(/description/i);
      expect(descInput).toHaveValue('');
    });

    it('should have Create Collection button', () => {
      render(<CollectionDialog {...defaultProps} />);
      expect(screen.getByRole('button', { name: /create collection/i })).toBeInTheDocument();
    });

    it('should have disabled submit button when name is empty', () => {
      render(<CollectionDialog {...defaultProps} />);
      const submitBtn = screen.getByRole('button', { name: /create collection/i });
      expect(submitBtn).toBeDisabled();
    });

    it('should enable submit button when name has value', () => {
      render(<CollectionDialog {...defaultProps} />);
      const nameInput = screen.getByLabelText(/name/i);

      fireEvent.change(nameInput, { target: { value: 'Test Collection' } });

      const submitBtn = screen.getByRole('button', { name: /create collection/i });
      expect(submitBtn).not.toBeDisabled();
    });

    it('should call createCollectionAction on submit', async () => {
      vi.mocked(collectionActions.createCollectionAction).mockResolvedValue({
        success: true,
        message: 'Collection created',
      });

      render(<CollectionDialog {...defaultProps} />);
      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: 'My Collection' } });

      const form = nameInput.closest('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(collectionActions.createCollectionAction).toHaveBeenCalledWith({
          name: 'My Collection',
          description: '',
          color: undefined,
        });
      });
    });

    it('should close dialog on successful creation', async () => {
      vi.mocked(collectionActions.createCollectionAction).mockResolvedValue({
        success: true,
        message: 'Collection created',
      });

      render(<CollectionDialog {...defaultProps} />);
      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: 'My Collection' } });

      const form = nameInput.closest('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('should display error message on failure', async () => {
      vi.mocked(collectionActions.createCollectionAction).mockResolvedValue({
        success: false,
        message: 'Collection name already exists',
      });

      render(<CollectionDialog {...defaultProps} />);
      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: 'Duplicate' } });

      const form = nameInput.closest('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText('Collection name already exists')).toBeInTheDocument();
      });
    });
  });

  describe('Edit Mode', () => {
    const existingCollection = {
      id: 'collection-1',
      name: 'Existing Collection',
      description: 'Existing description',
      color: '#EF4444',
    };

    it('should render with Edit Collection title', () => {
      render(<CollectionDialog {...defaultProps} collection={existingCollection} />);
      expect(screen.getByText('Edit Collection')).toBeInTheDocument();
    });

    it('should render edit description', () => {
      render(<CollectionDialog {...defaultProps} collection={existingCollection} />);
      expect(screen.getByText(/update your collection details/i)).toBeInTheDocument();
    });

    it('should pre-fill name field', () => {
      render(<CollectionDialog {...defaultProps} collection={existingCollection} />);
      const nameInput = screen.getByLabelText(/name/i);
      expect(nameInput).toHaveValue('Existing Collection');
    });

    it('should pre-fill description field', () => {
      render(<CollectionDialog {...defaultProps} collection={existingCollection} />);
      const descInput = screen.getByLabelText(/description/i);
      expect(descInput).toHaveValue('Existing description');
    });

    it('should have Save Changes button', () => {
      render(<CollectionDialog {...defaultProps} collection={existingCollection} />);
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });

    it('should call updateCollectionAction on submit', async () => {
      vi.mocked(collectionActions.updateCollectionAction).mockResolvedValue({
        success: true,
        message: 'Collection updated',
      });

      render(<CollectionDialog {...defaultProps} collection={existingCollection} />);
      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } });

      const form = nameInput.closest('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(collectionActions.updateCollectionAction).toHaveBeenCalledWith('collection-1', {
          name: 'Updated Name',
          description: 'Existing description',
          color: '#EF4444',
        });
      });
    });
  });

  describe('Color Picker', () => {
    it('should render color label', () => {
      render(<CollectionDialog {...defaultProps} />);
      expect(screen.getByText('Color')).toBeInTheDocument();
    });

    it('should render "no color" option', () => {
      render(<CollectionDialog {...defaultProps} />);
      const buttons = screen.getAllByRole('button');
      const noColorButton = buttons.find((btn) => btn.getAttribute('title') === 'No color');
      expect(noColorButton).toBeInTheDocument();
    });

    it('should render 8 preset color buttons', () => {
      render(<CollectionDialog {...defaultProps} />);
      const buttons = screen.getAllByRole('button');
      const colorButtons = buttons.filter((btn) =>
        btn.getAttribute('title')?.startsWith('#')
      );
      expect(colorButtons.length).toBe(8);
    });

    it('should select color when clicked', () => {
      render(<CollectionDialog {...defaultProps} />);
      const buttons = screen.getAllByRole('button');
      const redButton = buttons.find((btn) => btn.getAttribute('title') === '#EF4444');

      fireEvent.click(redButton!);

      expect(redButton).toHaveClass('ring-2');
    });

    it('should include selected color in form submission', async () => {
      vi.mocked(collectionActions.createCollectionAction).mockResolvedValue({
        success: true,
        message: 'Collection created',
      });

      render(<CollectionDialog {...defaultProps} />);

      // Set name
      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: 'Colored Collection' } });

      // Select a color
      const buttons = screen.getAllByRole('button');
      const blueButton = buttons.find((btn) => btn.getAttribute('title') === '#3B82F6');
      fireEvent.click(blueButton!);

      const form = nameInput.closest('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(collectionActions.createCollectionAction).toHaveBeenCalledWith({
          name: 'Colored Collection',
          description: '',
          color: '#3B82F6',
        });
      });
    });
  });

  describe('Cancel Button', () => {
    it('should close dialog when Cancel is clicked', () => {
      render(<CollectionDialog {...defaultProps} />);
      const cancelBtn = screen.getByRole('button', { name: /cancel/i });

      fireEvent.click(cancelBtn);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Loading States', () => {
    it('should show Creating... while submitting in create mode', async () => {
      vi.mocked(collectionActions.createCollectionAction).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true, message: 'Done' }), 100))
      );

      render(<CollectionDialog {...defaultProps} />);
      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: 'Test' } });

      const form = nameInput.closest('form');
      fireEvent.submit(form!);

      expect(screen.getByText(/creating\.\.\./i)).toBeInTheDocument();
    });

    it('should disable buttons while submitting', async () => {
      vi.mocked(collectionActions.createCollectionAction).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true, message: 'Done' }), 100))
      );

      render(<CollectionDialog {...defaultProps} />);
      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: 'Test' } });

      const form = nameInput.closest('form');
      fireEvent.submit(form!);

      const cancelBtn = screen.getByRole('button', { name: /cancel/i });
      expect(cancelBtn).toBeDisabled();
    });
  });
});
