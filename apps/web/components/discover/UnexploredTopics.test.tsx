import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { UnexploredTopics } from './UnexploredTopics';

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

const mockGetUnexploredTopicsAction = vi.fn();
vi.mock('@/app/actions/discover', () => ({
  getUnexploredTopicsAction: (...args: unknown[]) => mockGetUnexploredTopicsAction(...args),
}));

describe('UnexploredTopics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state initially', () => {
    mockGetUnexploredTopicsAction.mockImplementation(() => new Promise(() => {}));

    render(<UnexploredTopics />);

    expect(screen.getByTestId('discover-section')).toHaveAttribute('data-loading', 'true');
  });

  it('should render results when available', async () => {
    mockGetUnexploredTopicsAction.mockResolvedValue({
      success: true,
      results: [
        { id: 'topic-1', title: 'Topic 1', body: null, type: 'note', tags: ['new-tag'], autoTags: [], similarity: 0, score: 0.5, lastViewedAt: null, createdAt: new Date(), url: null },
      ],
    });

    render(<UnexploredTopics />);

    await waitFor(() => {
      expect(screen.getByTestId('discover-section')).toHaveAttribute('data-loading', 'false');
    });
    expect(screen.getByTestId('discover-card-topic-1')).toBeInTheDocument();
  });

  it('should handle empty results', async () => {
    mockGetUnexploredTopicsAction.mockResolvedValue({
      success: true,
      results: [],
    });

    render(<UnexploredTopics />);

    await waitFor(() => {
      expect(screen.getByTestId('discover-section')).toHaveAttribute('data-empty', 'true');
    });
  });

  it('should handle errors gracefully', async () => {
    mockGetUnexploredTopicsAction.mockRejectedValue(new Error('fail'));

    render(<UnexploredTopics />);

    await waitFor(() => {
      expect(screen.getByTestId('discover-section')).toHaveAttribute('data-loading', 'false');
    });
  });

  it('should render correct section title', () => {
    mockGetUnexploredTopicsAction.mockResolvedValue({ success: true, results: [] });

    render(<UnexploredTopics />);

    expect(screen.getByText('Unexplored topics')).toBeInTheDocument();
  });
});
