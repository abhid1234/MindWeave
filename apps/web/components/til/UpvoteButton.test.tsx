import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UpvoteButton } from './UpvoteButton';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/app/actions/til', () => ({
  upvoteTilAction: vi.fn().mockResolvedValue({ success: true, message: 'Upvoted!' }),
}));

describe('UpvoteButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render count', () => {
    render(
      <UpvoteButton tilId="til-1" initialCount={5} initialUpvoted={false} isAuthenticated={true} />
    );
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should show upvoted state when initialUpvoted is true', () => {
    render(
      <UpvoteButton tilId="til-1" initialCount={5} initialUpvoted={true} isAuthenticated={true} />
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Remove upvote');
  });

  it('should show non-upvoted state when initialUpvoted is false', () => {
    render(
      <UpvoteButton tilId="til-1" initialCount={5} initialUpvoted={false} isAuthenticated={true} />
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Upvote');
  });

  it('should redirect to login when not authenticated', () => {
    render(
      <UpvoteButton
        tilId="til-1"
        initialCount={5}
        initialUpvoted={false}
        isAuthenticated={false}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('should optimistically update count on click', () => {
    render(
      <UpvoteButton tilId="til-1" initialCount={5} initialUpvoted={false} isAuthenticated={true} />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('6')).toBeInTheDocument();
  });
});
