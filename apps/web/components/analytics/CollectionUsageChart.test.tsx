import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CollectionUsageChart } from './CollectionUsageChart';

// Mock recharts components to avoid issues with jsdom
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar">{children}</div>
  ),
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

// Mock the server action
vi.mock('@/app/actions/analytics', () => ({
  getCollectionUsageAction: vi.fn(),
}));

import { getCollectionUsageAction } from '@/app/actions/analytics';
const mockedGetCollectionUsage = vi.mocked(getCollectionUsageAction);

describe('CollectionUsageChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading state', () => {
    it('should show loading skeleton initially', () => {
      mockedGetCollectionUsage.mockImplementation(() => new Promise(() => {}));
      render(<CollectionUsageChart />);

      expect(screen.getByTestId('chart-loading')).toBeInTheDocument();
    });
  });

  describe('Success state', () => {
    const mockData = [
      { id: '1', name: 'Work Projects', color: '#FF5733', itemCount: 25 },
      { id: '2', name: 'Learning', color: '#3498DB', itemCount: 18 },
      { id: '3', name: 'Personal', color: null, itemCount: 12 },
    ];

    beforeEach(() => {
      mockedGetCollectionUsage.mockResolvedValue({
        success: true,
        data: mockData,
      });
    });

    it('should render the bar chart', async () => {
      render(<CollectionUsageChart />);

      await waitFor(() => {
        expect(screen.getByTestId('chart-content')).toBeInTheDocument();
      });

      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('should render chart title', () => {
      render(<CollectionUsageChart />);
      expect(screen.getByText('Collection Usage')).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('should display error message when fetch fails', async () => {
      mockedGetCollectionUsage.mockResolvedValue({
        success: false,
        message: 'Failed to load data',
      });

      render(<CollectionUsageChart />);

      await waitFor(() => {
        expect(screen.getByTestId('chart-error')).toBeInTheDocument();
      });

      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    });

    it('should display fallback error when no message', async () => {
      mockedGetCollectionUsage.mockResolvedValue({
        success: false,
      });

      render(<CollectionUsageChart />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load data')).toBeInTheDocument();
      });
    });
  });

  describe('Empty state', () => {
    it('should display empty message when no collections', async () => {
      mockedGetCollectionUsage.mockResolvedValue({
        success: true,
        data: [],
      });

      render(<CollectionUsageChart />);

      await waitFor(() => {
        expect(screen.getByTestId('chart-empty')).toBeInTheDocument();
      });

      expect(screen.getByText('No collections yet')).toBeInTheDocument();
      expect(screen.getByText('Create collections to organize your content')).toBeInTheDocument();
    });
  });

  describe('Data testid', () => {
    it('should have correct testid on the container', () => {
      mockedGetCollectionUsage.mockImplementation(() => new Promise(() => {}));
      render(<CollectionUsageChart />);

      expect(screen.getByTestId('collection-usage-chart')).toBeInTheDocument();
    });
  });
});
