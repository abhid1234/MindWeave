import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RelatedItemsBadge } from './RelatedItemsBadge';
import * as searchActions from '@/app/actions/search';

vi.mock('@/app/actions/search', () => ({
  getRecommendationsAction: vi.fn(),
}));

// Mock ResizeObserver which is needed for Radix UI components
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
global.ResizeObserver = ResizeObserverMock as any;

const mockRecommendation = (overrides: Record<string, unknown> = {}) => ({
  id: 'r1',
  title: 'Related Item',
  body: null,
  type: 'note' as const,
  tags: [],
  autoTags: [],
  url: null,
  createdAt: new Date(),
  similarity: 0.85,
  ...overrides,
});

describe('RelatedItemsBadge', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render trigger button with Sparkles icon', () => {
    render(<RelatedItemsBadge contentId="test-1" />);
    expect(screen.getByRole('button', { name: /related items/i })).toBeInTheDocument();
  });

  it('should not fetch on mount', () => {
    render(<RelatedItemsBadge contentId="test-1" />);
    expect(searchActions.getRecommendationsAction).not.toHaveBeenCalled();
  });

  it('should fetch related items on click', async () => {
    vi.mocked(searchActions.getRecommendationsAction).mockResolvedValue({
      success: true,
      recommendations: [
        mockRecommendation({ id: 'r1', title: 'Related Item 1' }),
        mockRecommendation({ id: 'r2', title: 'Related Item 2', type: 'link', similarity: 0.72 }),
      ],
    });

    render(<RelatedItemsBadge contentId="test-1" />);
    await user.click(screen.getByRole('button', { name: /related items/i }));

    await waitFor(() => {
      expect(searchActions.getRecommendationsAction).toHaveBeenCalledWith('test-1', 3);
    });
  });

  it('should show loading state while fetching', async () => {
    vi.mocked(searchActions.getRecommendationsAction).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({
        success: true,
        recommendations: [],
      }), 100))
    );

    render(<RelatedItemsBadge contentId="test-1" />);
    await user.click(screen.getByRole('button', { name: /related items/i }));

    await waitFor(() => {
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  it('should render related items with titles', async () => {
    vi.mocked(searchActions.getRecommendationsAction).mockResolvedValue({
      success: true,
      recommendations: [
        mockRecommendation({ id: 'r1', title: 'Related Item 1' }),
        mockRecommendation({ id: 'r2', title: 'Related Item 2', type: 'link', similarity: 0.72 }),
      ],
    });

    render(<RelatedItemsBadge contentId="test-1" />);
    await user.click(screen.getByRole('button', { name: /related items/i }));

    expect(await screen.findByText('Related Item 1')).toBeInTheDocument();
    expect(await screen.findByText('Related Item 2')).toBeInTheDocument();
  });

  it('should show similarity percentage', async () => {
    vi.mocked(searchActions.getRecommendationsAction).mockResolvedValue({
      success: true,
      recommendations: [
        mockRecommendation({ id: 'r1', title: 'Related Item', similarity: 0.85 }),
      ],
    });

    render(<RelatedItemsBadge contentId="test-1" />);
    await user.click(screen.getByRole('button', { name: /related items/i }));

    expect(await screen.findByText('85%')).toBeInTheDocument();
  });

  it('should show empty state when no related items found', async () => {
    vi.mocked(searchActions.getRecommendationsAction).mockResolvedValue({
      success: true,
      recommendations: [],
    });

    render(<RelatedItemsBadge contentId="test-1" />);
    await user.click(screen.getByRole('button', { name: /related items/i }));

    expect(await screen.findByText('No related items found')).toBeInTheDocument();
  });

  it('should show error message on failure', async () => {
    vi.mocked(searchActions.getRecommendationsAction).mockResolvedValue({
      success: false,
      message: 'Something went wrong',
      recommendations: [],
    });

    render(<RelatedItemsBadge contentId="test-1" />);
    await user.click(screen.getByRole('button', { name: /related items/i }));

    expect(await screen.findByText('Something went wrong')).toBeInTheDocument();
  });
});
