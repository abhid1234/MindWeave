import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PublishTilDialog } from './PublishTilDialog';

// Mock the server action
vi.mock('@/app/actions/til', () => ({
  publishTilAction: vi.fn(),
}));

import { publishTilAction } from '@/app/actions/til';

describe('PublishTilDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    contentId: 'c-1',
    contentTitle: 'Understanding React Hooks',
    contentBody: 'React hooks are a way to use state in functional components.',
    contentTags: ['react', 'hooks'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dialog with title', () => {
    render(<PublishTilDialog {...defaultProps} />);
    expect(screen.getByText('Share as TIL')).toBeInTheDocument();
  });

  it('should pre-fill title from content', () => {
    render(<PublishTilDialog {...defaultProps} />);
    const titleInput = screen.getByLabelText(/Title/);
    expect(titleInput).toHaveValue('Understanding React Hooks');
  });

  it('should pre-fill body from content', () => {
    render(<PublishTilDialog {...defaultProps} />);
    const bodyInput = screen.getByLabelText(/Body/);
    expect(bodyInput).toHaveValue('React hooks are a way to use state in functional components.');
  });

  it('should pre-fill tags from content', () => {
    render(<PublishTilDialog {...defaultProps} />);
    const tagsInput = screen.getByLabelText(/Tags/);
    expect(tagsInput).toHaveValue('react, hooks');
  });

  it('should show validation when title is empty', () => {
    render(<PublishTilDialog {...defaultProps} />);
    const titleInput = screen.getByLabelText(/Title/);
    fireEvent.change(titleInput, { target: { value: '' } });
    // Submit button should be disabled when title is empty
    const submitButton = screen.getByText('Publish TIL');
    expect(submitButton).toBeDisabled();
  });

  it('should call publishTilAction on submit', async () => {
    vi.mocked(publishTilAction).mockResolvedValue({ success: true, message: 'Published!' });

    render(<PublishTilDialog {...defaultProps} />);
    const submitButton = screen.getByText('Publish TIL');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(publishTilAction).toHaveBeenCalledWith({
        contentId: 'c-1',
        title: 'Understanding React Hooks',
        body: 'React hooks are a way to use state in functional components.',
        tags: ['react', 'hooks'],
      });
    });
  });

  it('should show error on failure', async () => {
    vi.mocked(publishTilAction).mockResolvedValue({
      success: false,
      message: 'Already published',
    });

    render(<PublishTilDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Publish TIL'));

    await waitFor(() => {
      expect(screen.getByText('Already published')).toBeInTheDocument();
    });
  });
});
