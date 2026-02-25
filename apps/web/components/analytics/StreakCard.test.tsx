import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { StreakCard } from './StreakCard';
import * as analyticsActions from '@/app/actions/analytics';

vi.mock('@/app/actions/analytics', () => ({
  getStreakDataAction: vi.fn(),
}));

describe('StreakCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading skeleton initially', () => {
    vi.mocked(analyticsActions.getStreakDataAction).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<StreakCard />);
    expect(screen.getByTestId('streak-skeleton')).toBeInTheDocument();
  });

  it('should render streak stats', async () => {
    const heatmap = Array.from({ length: 90 }, (_, i) => ({
      date: `2024-0${Math.floor(i / 30) + 1}-${String((i % 30) + 1).padStart(2, '0')}`,
      count: i % 3 === 0 ? 1 : 0,
    }));

    vi.mocked(analyticsActions.getStreakDataAction).mockResolvedValue({
      success: true,
      data: {
        currentStreak: 5,
        longestStreak: 12,
        totalActiveDays: 30,
        heatmap,
      },
    });

    render(<StreakCard />);

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('30')).toBeInTheDocument();
    });
  });

  it('should render current streak label', async () => {
    vi.mocked(analyticsActions.getStreakDataAction).mockResolvedValue({
      success: true,
      data: {
        currentStreak: 0,
        longestStreak: 0,
        totalActiveDays: 0,
        heatmap: Array.from({ length: 90 }, (_, i) => ({
          date: `2024-01-${String(i + 1).padStart(2, '0')}`,
          count: 0,
        })),
      },
    });

    render(<StreakCard />);

    await waitFor(() => {
      expect(screen.getByText('Current Streak')).toBeInTheDocument();
      expect(screen.getByText('Longest Streak')).toBeInTheDocument();
      expect(screen.getByText('Active Days')).toBeInTheDocument();
    });
  });

  it('should render heatmap cells', async () => {
    vi.mocked(analyticsActions.getStreakDataAction).mockResolvedValue({
      success: true,
      data: {
        currentStreak: 1,
        longestStreak: 1,
        totalActiveDays: 1,
        heatmap: Array.from({ length: 90 }, (_, i) => ({
          date: `2024-01-${String(i + 1).padStart(2, '0')}`,
          count: i === 89 ? 3 : 0,
        })),
      },
    });

    render(<StreakCard />);

    await waitFor(() => {
      const heatmapContainer = screen.getByRole('img', { name: /activity heatmap/i });
      expect(heatmapContainer).toBeInTheDocument();
      expect(heatmapContainer.children).toHaveLength(90);
    });
  });

  it('should render nothing when action fails', async () => {
    vi.mocked(analyticsActions.getStreakDataAction).mockResolvedValue({
      success: false,
      message: 'Error',
    });

    const { container } = render(<StreakCard />);

    await waitFor(() => {
      expect(screen.queryByTestId('streak-skeleton')).not.toBeInTheDocument();
    });

    // Should render nothing (null)
    expect(container.firstChild).toBeNull();
  });
});
