import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RediscoverContent } from './RediscoverContent';

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

const mockGetRediscoverAction = vi.fn();
vi.mock('@/app/actions/discover', () => ({
  getRediscoverAction: (...args: unknown[]) => mockGetRediscoverAction(...args),
}));

describe('RediscoverContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state initially', () => {
    mockGetRediscoverAction.mockImplementation(() => new Promise(() => {}));

    render(<RediscoverContent />);

    expect(screen.getByTestId('discover-section')).toHaveAttribute('data-loading', 'true');
  });

  it('should render results when available', async () => {
    mockGetRediscoverAction.mockResolvedValue({
      success: true,
      results: [
        { id: 'old-1', title: 'Old Item 1', body: null, type: 'note', tags: [], autoTags: [], similarity: 0.7, score: 0.6, lastViewedAt: null, createdAt: new Date('2025-01-01'), url: null },
      ],
    });

    render(<RediscoverContent />);

    await waitFor(() => {
      expect(screen.getByTestId('discover-section')).toHaveAttribute('data-loading', 'false');
    });
    expect(screen.getByTestId('discover-card-old-1')).toBeInTheDocument();
  });

  it('should handle empty results', async () => {
    mockGetRediscoverAction.mockResolvedValue({
      success: true,
      results: [],
    });

    render(<RediscoverContent />);

    await waitFor(() => {
      expect(screen.getByTestId('discover-section')).toHaveAttribute('data-empty', 'true');
    });
  });

  it('should handle errors gracefully', async () => {
    mockGetRediscoverAction.mockRejectedValue(new Error('fail'));

    render(<RediscoverContent />);

    await waitFor(() => {
      expect(screen.getByTestId('discover-section')).toHaveAttribute('data-loading', 'false');
    });
  });

  it('should render correct section title', () => {
    mockGetRediscoverAction.mockResolvedValue({ success: true, results: [] });

    render(<RediscoverContent />);

    expect(screen.getByText('Rediscover')).toBeInTheDocument();
  });
});
