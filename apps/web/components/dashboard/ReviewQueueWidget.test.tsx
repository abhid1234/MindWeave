import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ReviewQueueWidget } from './ReviewQueueWidget';

const mockGetReviewQueue = vi.fn();

vi.mock('@/app/actions/review', () => ({
  getReviewQueueAction: (...args: unknown[]) => mockGetReviewQueue(...args),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('ReviewQueueWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state initially', () => {
    mockGetReviewQueue.mockReturnValue(new Promise(() => {}));
    render(<ReviewQueueWidget />);
    expect(document.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('should show count when items available', async () => {
    mockGetReviewQueue.mockResolvedValue({
      success: true,
      queue: [{ id: '1' }, { id: '2' }, { id: '3' }],
    });
    render(<ReviewQueueWidget />);
    await waitFor(() => {
      expect(screen.getByText('3 items to review')).toBeInTheDocument();
    });
  });

  it('should show singular for 1 item', async () => {
    mockGetReviewQueue.mockResolvedValue({
      success: true,
      queue: [{ id: '1' }],
    });
    render(<ReviewQueueWidget />);
    await waitFor(() => {
      expect(screen.getByText('1 item to review')).toBeInTheDocument();
    });
  });

  it('should render nothing when queue is empty', async () => {
    mockGetReviewQueue.mockResolvedValue({ success: true, queue: [] });
    const { container } = render(<ReviewQueueWidget />);
    await waitFor(() => {
      expect(container.querySelector('.animate-pulse')).toBeFalsy();
    });
    expect(screen.queryByText(/items? to review/)).not.toBeInTheDocument();
  });

  it('should link to review page', async () => {
    mockGetReviewQueue.mockResolvedValue({
      success: true,
      queue: [{ id: '1' }],
    });
    render(<ReviewQueueWidget />);
    await waitFor(() => {
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/dashboard/review');
    });
  });
});
