import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { OverviewStats } from './OverviewStats';

// Mock useCountUp to return target value immediately
vi.mock('@/hooks/useCountUp', () => ({
  useCountUp: (target: number) => target,
}));

// Mock the server action
vi.mock('@/app/actions/analytics', () => ({
  getOverviewStatsAction: vi.fn(),
}));

// Import the mocked module
import { getOverviewStatsAction } from '@/app/actions/analytics';
const mockedGetOverviewStats = vi.mocked(getOverviewStatsAction);

describe('OverviewStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading state', () => {
    it('should show loading skeletons initially', () => {
      mockedGetOverviewStats.mockImplementation(() => new Promise(() => {})); // Never resolves
      render(<OverviewStats />);

      expect(screen.getByTestId('overview-stats-loading')).toBeInTheDocument();
    });
  });

  describe('Success state', () => {
    const mockStats = {
      totalItems: 127,
      itemsThisMonth: 23,
      totalCollections: 8,
      totalTags: 45,
    };

    beforeEach(() => {
      mockedGetOverviewStats.mockResolvedValue({
        success: true,
        data: mockStats,
      });
    });

    it('should display total items', async () => {
      render(<OverviewStats />);

      await waitFor(() => {
        expect(screen.getByTestId('overview-stats')).toBeInTheDocument();
      });

      expect(screen.getByText('127')).toBeInTheDocument();
      expect(screen.getByText('Total Items')).toBeInTheDocument();
    });

    it('should display items this month', async () => {
      render(<OverviewStats />);

      await waitFor(() => {
        expect(screen.getByText('23')).toBeInTheDocument();
      });

      expect(screen.getByText('This Month')).toBeInTheDocument();
    });

    it('should display collections count', async () => {
      render(<OverviewStats />);

      await waitFor(() => {
        expect(screen.getByText('8')).toBeInTheDocument();
      });

      expect(screen.getByText('Collections')).toBeInTheDocument();
    });

    it('should display tags count', async () => {
      render(<OverviewStats />);

      await waitFor(() => {
        expect(screen.getByText('45')).toBeInTheDocument();
      });

      expect(screen.getByText('Tags')).toBeInTheDocument();
    });

    it('should render all four stat cards', async () => {
      render(<OverviewStats />);

      await waitFor(() => {
        expect(screen.getByTestId('overview-stats')).toBeInTheDocument();
      });

      // Check descriptions
      expect(screen.getByText('Notes, links & files')).toBeInTheDocument();
      expect(screen.getByText('Items added this month')).toBeInTheDocument();
      expect(screen.getByText('Organized groups')).toBeInTheDocument();
      expect(screen.getByText('Unique tags used')).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('should display error message when fetch fails', async () => {
      mockedGetOverviewStats.mockResolvedValue({
        success: false,
        message: 'Failed to load stats',
      });

      render(<OverviewStats />);

      await waitFor(() => {
        expect(screen.getByTestId('overview-stats-error')).toBeInTheDocument();
      });

      expect(screen.getByText('Failed to load stats')).toBeInTheDocument();
    });

    it('should display fallback error message when none provided', async () => {
      mockedGetOverviewStats.mockResolvedValue({
        success: false,
      });

      render(<OverviewStats />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load stats')).toBeInTheDocument();
      });
    });
  });

  describe('Empty state', () => {
    it('should handle zero values', async () => {
      mockedGetOverviewStats.mockResolvedValue({
        success: true,
        data: {
          totalItems: 0,
          itemsThisMonth: 0,
          totalCollections: 0,
          totalTags: 0,
        },
      });

      render(<OverviewStats />);

      await waitFor(() => {
        expect(screen.getByTestId('overview-stats')).toBeInTheDocument();
      });

      // Should display 0 values (4 zeros)
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBe(4);
    });
  });
});
