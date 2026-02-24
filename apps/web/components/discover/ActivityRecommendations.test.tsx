import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ActivityRecommendations } from './ActivityRecommendations';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('./DiscoverSection', () => ({
  DiscoverSection: ({ title, isLoading, isEmpty, children }: { title: string; isLoading: boolean; isEmpty: boolean; children?: React.ReactNode }) => (
    <div data-testid="discover-section" data-loading={isLoading} data-empty={isEmpty}>
      <h2>{title}</h2>
      {!isLoading && !isEmpty && children}
    </div>
  ),
}));

vi.mock('./DiscoverCard', () => ({
  DiscoverCard: ({ id, title }: { id: string; title: string }) => (
    <div data-testid={`discover-card-${id}`}>{title}</div>
  ),
}));

const mockGetActivityBasedRecommendationsAction = vi.fn();
vi.mock('@/app/actions/discover', () => ({
  getActivityBasedRecommendationsAction: (...args: unknown[]) => mockGetActivityBasedRecommendationsAction(...args),
}));

describe('ActivityRecommendations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state initially', () => {
    mockGetActivityBasedRecommendationsAction.mockImplementation(() => new Promise(() => {}));

    render(<ActivityRecommendations />);

    expect(screen.getByTestId('discover-section')).toHaveAttribute('data-loading', 'true');
  });

  it('should render results when available', async () => {
    mockGetActivityBasedRecommendationsAction.mockResolvedValue({
      success: true,
      results: [
        { id: 'rec-1', title: 'Rec 1', body: null, type: 'note', tags: [], autoTags: [], similarity: 0.9, score: 0.8, lastViewedAt: null, createdAt: new Date(), url: null },
      ],
    });

    render(<ActivityRecommendations />);

    await waitFor(() => {
      expect(screen.getByTestId('discover-section')).toHaveAttribute('data-loading', 'false');
    });
    expect(screen.getByTestId('discover-card-rec-1')).toBeInTheDocument();
  });

  it('should handle empty results', async () => {
    mockGetActivityBasedRecommendationsAction.mockResolvedValue({
      success: true,
      results: [],
    });

    render(<ActivityRecommendations />);

    await waitFor(() => {
      expect(screen.getByTestId('discover-section')).toHaveAttribute('data-empty', 'true');
    });
  });

  it('should handle errors gracefully', async () => {
    mockGetActivityBasedRecommendationsAction.mockRejectedValue(new Error('fail'));

    render(<ActivityRecommendations />);

    await waitFor(() => {
      expect(screen.getByTestId('discover-section')).toHaveAttribute('data-loading', 'false');
    });
  });

  it('should render correct section title', async () => {
    mockGetActivityBasedRecommendationsAction.mockResolvedValue({ success: true, results: [] });

    render(<ActivityRecommendations />);

    expect(screen.getByText('Based on your activity')).toBeInTheDocument();
  });
});
