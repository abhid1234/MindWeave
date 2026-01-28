import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContentGrowthChart } from './ContentGrowthChart';

// Mock recharts components to avoid issues with jsdom
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

// Mock the server action
vi.mock('@/app/actions/analytics', () => ({
  getContentGrowthAction: vi.fn(),
}));

import { getContentGrowthAction } from '@/app/actions/analytics';
const mockedGetContentGrowth = vi.mocked(getContentGrowthAction);

describe('ContentGrowthChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading state', () => {
    it('should show loading skeleton initially', () => {
      mockedGetContentGrowth.mockImplementation(() => new Promise(() => {}));
      render(<ContentGrowthChart />);

      expect(screen.getByTestId('chart-loading')).toBeInTheDocument();
    });
  });

  describe('Success state', () => {
    const mockData = [
      { date: '2024-01-01', notes: 2, links: 1, files: 0, total: 3 },
      { date: '2024-01-02', notes: 3, links: 2, files: 1, total: 6 },
      { date: '2024-01-03', notes: 1, links: 0, files: 2, total: 3 },
    ];

    beforeEach(() => {
      mockedGetContentGrowth.mockResolvedValue({
        success: true,
        data: mockData,
      });
    });

    it('should render the chart', async () => {
      render(<ContentGrowthChart />);

      await waitFor(() => {
        expect(screen.getByTestId('chart-content')).toBeInTheDocument();
      });

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should render period buttons', async () => {
      render(<ContentGrowthChart />);

      await waitFor(() => {
        expect(screen.getByTestId('chart-content')).toBeInTheDocument();
      });

      expect(screen.getByTestId('period-week')).toBeInTheDocument();
      expect(screen.getByTestId('period-month')).toBeInTheDocument();
      expect(screen.getByTestId('period-year')).toBeInTheDocument();
    });

    it('should default to month period', async () => {
      render(<ContentGrowthChart />);

      await waitFor(() => {
        expect(screen.getByTestId('chart-content')).toBeInTheDocument();
      });

      expect(mockedGetContentGrowth).toHaveBeenCalledWith('month');
    });

    it('should use initial period when provided', async () => {
      render(<ContentGrowthChart initialPeriod="week" />);

      await waitFor(() => {
        expect(mockedGetContentGrowth).toHaveBeenCalledWith('week');
      });
    });
  });

  describe('Period switching', () => {
    beforeEach(() => {
      mockedGetContentGrowth.mockResolvedValue({
        success: true,
        data: [{ date: '2024-01-01', notes: 1, links: 1, files: 1, total: 3 }],
      });
    });

    it('should fetch new data when period changes', async () => {
      const user = userEvent.setup();
      render(<ContentGrowthChart />);

      await waitFor(() => {
        expect(screen.getByTestId('chart-content')).toBeInTheDocument();
      });

      const weekButton = screen.getByTestId('period-week');
      await user.click(weekButton);

      await waitFor(() => {
        expect(mockedGetContentGrowth).toHaveBeenCalledWith('week');
      });
    });

    it('should fetch year data when year button clicked', async () => {
      const user = userEvent.setup();
      render(<ContentGrowthChart />);

      await waitFor(() => {
        expect(screen.getByTestId('chart-content')).toBeInTheDocument();
      });

      const yearButton = screen.getByTestId('period-year');
      await user.click(yearButton);

      await waitFor(() => {
        expect(mockedGetContentGrowth).toHaveBeenCalledWith('year');
      });
    });
  });

  describe('Error state', () => {
    it('should display error message when fetch fails', async () => {
      mockedGetContentGrowth.mockResolvedValue({
        success: false,
        message: 'Failed to load data',
      });

      render(<ContentGrowthChart />);

      await waitFor(() => {
        expect(screen.getByTestId('chart-error')).toBeInTheDocument();
      });

      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('should display empty message when no data', async () => {
      mockedGetContentGrowth.mockResolvedValue({
        success: true,
        data: [],
      });

      render(<ContentGrowthChart />);

      await waitFor(() => {
        expect(screen.getByTestId('chart-empty')).toBeInTheDocument();
      });

      expect(screen.getByText('No data available for this period')).toBeInTheDocument();
    });
  });

  describe('Chart rendering details', () => {
    const mockData = [
      { date: '2024-01-01', notes: 2, links: 1, files: 0, total: 3 },
      { date: '2024-01-02', notes: 3, links: 2, files: 1, total: 6 },
    ];

    beforeEach(() => {
      mockedGetContentGrowth.mockResolvedValue({
        success: true,
        data: mockData,
      });
    });

    it('should render 3 Line components for notes, links, files', async () => {
      render(<ContentGrowthChart />);

      await waitFor(() => {
        expect(screen.getByTestId('chart-content')).toBeInTheDocument();
      });

      const lines = screen.getAllByTestId('line');
      expect(lines).toHaveLength(3);
    });

    it('should render legend', async () => {
      render(<ContentGrowthChart />);

      await waitFor(() => {
        expect(screen.getByTestId('chart-content')).toBeInTheDocument();
      });

      expect(screen.getByTestId('legend')).toBeInTheDocument();
    });

    it('should render axes and grid', async () => {
      render(<ContentGrowthChart />);

      await waitFor(() => {
        expect(screen.getByTestId('chart-content')).toBeInTheDocument();
      });

      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    });
  });

  describe('Sequential period changes', () => {
    beforeEach(() => {
      mockedGetContentGrowth.mockResolvedValue({
        success: true,
        data: [{ date: '2024-01-01', notes: 1, links: 1, files: 1, total: 3 }],
      });
    });

    it('should fetch data for each period when switching week → month → year', async () => {
      const user = userEvent.setup();
      render(<ContentGrowthChart initialPeriod="week" />);

      await waitFor(() => {
        expect(screen.getByTestId('chart-content')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('period-month'));
      await waitFor(() => {
        expect(mockedGetContentGrowth).toHaveBeenCalledWith('month');
      });

      await user.click(screen.getByTestId('period-year'));
      await waitFor(() => {
        expect(mockedGetContentGrowth).toHaveBeenCalledWith('year');
      });
    });
  });

  describe('Error handling', () => {
    it('should show error when fetch throws', async () => {
      mockedGetContentGrowth.mockRejectedValue(new Error('Network error'));

      render(<ContentGrowthChart />);

      await waitFor(() => {
        expect(screen.getByTestId('chart-error')).toBeInTheDocument();
      });

      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    });

    it('should show error message from server', async () => {
      mockedGetContentGrowth.mockResolvedValue({
        success: false,
        message: 'Server overloaded',
      });

      render(<ContentGrowthChart />);

      await waitFor(() => {
        expect(screen.getByText('Server overloaded')).toBeInTheDocument();
      });
    });
  });

  describe('Chart title', () => {
    it('should render chart title', async () => {
      mockedGetContentGrowth.mockResolvedValue({
        success: true,
        data: [{ date: '2024-01-01', notes: 1, links: 1, files: 1, total: 3 }],
      });

      render(<ContentGrowthChart />);

      expect(screen.getByText('Content Growth')).toBeInTheDocument();
    });
  });
});
