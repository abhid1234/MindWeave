import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PublishToMarketplaceDialog } from './PublishToMarketplaceDialog';
import * as marketplaceActions from '@/app/actions/marketplace';

vi.mock('@/app/actions/marketplace', () => ({
  publishToMarketplaceAction: vi.fn(),
}));

describe('PublishToMarketplaceDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSuccess = vi.fn();

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    collectionId: 'col-1',
    collectionName: 'My Collection',
    onSuccess: mockOnSuccess,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dialog title', () => {
    render(<PublishToMarketplaceDialog {...defaultProps} />);
    expect(screen.getByText('Publish to Marketplace')).toBeInTheDocument();
  });

  it('should show collection name in description', () => {
    render(<PublishToMarketplaceDialog {...defaultProps} />);
    expect(screen.getByText(/My Collection/)).toBeInTheDocument();
  });

  it('should render category options', () => {
    render(<PublishToMarketplaceDialog {...defaultProps} />);
    expect(screen.getByText('Programming')).toBeInTheDocument();
    expect(screen.getByText('Design')).toBeInTheDocument();
    expect(screen.getByText('Business')).toBeInTheDocument();
  });

  it('should render description textarea', () => {
    render(<PublishToMarketplaceDialog {...defaultProps} />);
    expect(screen.getByPlaceholderText(/tell others/i)).toBeInTheDocument();
  });

  it('should show character count', () => {
    render(<PublishToMarketplaceDialog {...defaultProps} />);
    expect(screen.getByText('0/1000')).toBeInTheDocument();
  });

  it('should call publishToMarketplaceAction on submit', async () => {
    vi.mocked(marketplaceActions.publishToMarketplaceAction).mockResolvedValue({
      success: true,
      message: 'Published',
    });

    render(<PublishToMarketplaceDialog {...defaultProps} />);

    // Select a category
    fireEvent.click(screen.getByText('Programming'));

    // Submit
    const form = screen.getByPlaceholderText(/tell others/i).closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(marketplaceActions.publishToMarketplaceAction).toHaveBeenCalledWith({
        collectionId: 'col-1',
        category: 'programming',
        description: undefined,
      });
    });
  });

  it('should close dialog on success', async () => {
    vi.mocked(marketplaceActions.publishToMarketplaceAction).mockResolvedValue({
      success: true,
      message: 'Published',
    });

    render(<PublishToMarketplaceDialog {...defaultProps} />);
    const form = screen.getByPlaceholderText(/tell others/i).closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should display error on failure', async () => {
    vi.mocked(marketplaceActions.publishToMarketplaceAction).mockResolvedValue({
      success: false,
      message: 'Collection must have at least 1 item',
    });

    render(<PublishToMarketplaceDialog {...defaultProps} />);
    const form = screen.getByPlaceholderText(/tell others/i).closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByText('Collection must have at least 1 item')).toBeInTheDocument();
    });
  });

  it('should close dialog when Cancel is clicked', () => {
    render(<PublishToMarketplaceDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
});
