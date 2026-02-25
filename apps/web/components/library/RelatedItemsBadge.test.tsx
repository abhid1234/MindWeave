import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RelatedItemsBadge } from './RelatedItemsBadge';
import * as searchActions from '@/app/actions/search';

vi.mock('@/app/actions/search', () => ({
  getRecommendationsAction: vi.fn(),
}));

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
    fireEvent.click(screen.getByRole('button', { name: /related items/i }));

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
    fireEvent.click(screen.getByRole('button', { name: /related items/i }));

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
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
    fireEvent.click(screen.getByRole('button', { name: /related items/i }));

    await waitFor(() => {
      expect(screen.getByText('Related Item 1')).toBeInTheDocument();
      expect(screen.getByText('Related Item 2')).toBeInTheDocument();
    });
  });

  it('should show similarity percentage', async () => {
    vi.mocked(searchActions.getRecommendationsAction).mockResolvedValue({
      success: true,
      recommendations: [
        mockRecommendation({ id: 'r1', title: 'Related Item', similarity: 0.85 }),
      ],
    });

    render(<RelatedItemsBadge contentId="test-1" />);
    fireEvent.click(screen.getByRole('button', { name: /related items/i }));

    await waitFor(() => {
      expect(screen.getByText('85%')).toBeInTheDocument();
    });
  });

  it('should show empty state when no related items found', async () => {
    vi.mocked(searchActions.getRecommendationsAction).mockResolvedValue({
      success: true,
      recommendations: [],
    });

    render(<RelatedItemsBadge contentId="test-1" />);
    fireEvent.click(screen.getByRole('button', { name: /related items/i }));

    await waitFor(() => {
      expect(screen.getByText('No related items found')).toBeInTheDocument();
    });
  });

  it('should show error message on failure', async () => {
    vi.mocked(searchActions.getRecommendationsAction).mockResolvedValue({
      success: false,
      message: 'Something went wrong',
      recommendations: [],
    });

    render(<RelatedItemsBadge contentId="test-1" />);
    fireEvent.click(screen.getByRole('button', { name: /related items/i }));

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });
});
