import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TagDistributionChart } from './TagDistributionChart';

// Mock recharts components to avoid issues with jsdom
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie">{children}</div>
  ),
  Cell: () => <div data-testid="cell" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

// Mock the server action
vi.mock('@/app/actions/analytics', () => ({
  getTagDistributionAction: vi.fn(),
}));

import { getTagDistributionAction } from '@/app/actions/analytics';
const mockedGetTagDistribution = vi.mocked(getTagDistributionAction);

describe('TagDistributionChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading state', () => {
    it('should show loading skeleton initially', () => {
      mockedGetTagDistribution.mockImplementation(() => new Promise(() => {}));
      render(<TagDistributionChart />);

      expect(screen.getByTestId('chart-loading')).toBeInTheDocument();
    });
  });

  describe('Success state', () => {
    const mockData = [
      { tag: 'javascript', count: 25, percentage: 40 },
      { tag: 'react', count: 15, percentage: 24 },
      { tag: 'typescript', count: 12, percentage: 19 },
      { tag: 'nodejs', count: 10, percentage: 16 },
    ];

    beforeEach(() => {
      mockedGetTagDistribution.mockResolvedValue({
        success: true,
        data: mockData,
      });
    });

    it('should render the pie chart', async () => {
      render(<TagDistributionChart />);

      await waitFor(() => {
        expect(screen.getByTestId('chart-content')).toBeInTheDocument();
      });

      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });

    it('should render chart title', () => {
      render(<TagDistributionChart />);
      expect(screen.getByText('Tag Distribution')).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('should display error message when fetch fails', async () => {
      mockedGetTagDistribution.mockResolvedValue({
        success: false,
        message: 'Failed to load data',
      });

      render(<TagDistributionChart />);

      await waitFor(() => {
        expect(screen.getByTestId('chart-error')).toBeInTheDocument();
      });

      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    });

    it('should display fallback error when no message', async () => {
      mockedGetTagDistribution.mockResolvedValue({
        success: false,
      });

      render(<TagDistributionChart />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load data')).toBeInTheDocument();
      });
    });
  });

  describe('Empty state', () => {
    it('should display empty message when no tags', async () => {
      mockedGetTagDistribution.mockResolvedValue({
        success: true,
        data: [],
      });

      render(<TagDistributionChart />);

      await waitFor(() => {
        expect(screen.getByTestId('chart-empty')).toBeInTheDocument();
      });

      expect(screen.getByText('No tags found')).toBeInTheDocument();
      expect(screen.getByText('Add tags to your content to see distribution')).toBeInTheDocument();
    });
  });

  describe('Data testid', () => {
    it('should have correct testid on the container', () => {
      mockedGetTagDistribution.mockImplementation(() => new Promise(() => {}));
      render(<TagDistributionChart />);

      expect(screen.getByTestId('tag-distribution-chart')).toBeInTheDocument();
    });
  });
});
