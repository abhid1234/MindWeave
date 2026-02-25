import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ContentBreakdown } from './ContentBreakdown';
import * as analyticsActions from '@/app/actions/analytics';

vi.mock('@/app/actions/analytics', () => ({
  getContentTypeBreakdownAction: vi.fn(),
}));

// Mock Recharts to avoid SVG rendering issues in tests
vi.mock('recharts', () => ({
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }: { children: React.ReactNode }) => <div data-testid="pie">{children}</div>,
  Cell: () => <div data-testid="cell" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Legend: () => <div data-testid="legend" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

describe('ContentBreakdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading skeleton initially', () => {
    vi.mocked(analyticsActions.getContentTypeBreakdownAction).mockImplementation(
      () => new Promise(() => {})
    );

    render(<ContentBreakdown />);
    expect(screen.getByTestId('content-breakdown-skeleton')).toBeInTheDocument();
  });

  it('should render chart with data', async () => {
    vi.mocked(analyticsActions.getContentTypeBreakdownAction).mockResolvedValue({
      success: true,
      data: { notes: 15, links: 10, files: 5 },
    });

    render(<ContentBreakdown />);

    await waitFor(() => {
      expect(screen.getByText('Content Breakdown')).toBeInTheDocument();
      expect(screen.getByText('30 total items')).toBeInTheDocument();
    });
  });

  it('should show empty state when no content', async () => {
    vi.mocked(analyticsActions.getContentTypeBreakdownAction).mockResolvedValue({
      success: true,
      data: { notes: 0, links: 0, files: 0 },
    });

    render(<ContentBreakdown />);

    await waitFor(() => {
      expect(screen.getByText(/no content yet/i)).toBeInTheDocument();
    });
  });

  it('should render nothing when action fails', async () => {
    vi.mocked(analyticsActions.getContentTypeBreakdownAction).mockResolvedValue({
      success: false,
      message: 'Error',
    });

    const { container } = render(<ContentBreakdown />);

    await waitFor(() => {
      expect(screen.queryByTestId('content-breakdown-skeleton')).not.toBeInTheDocument();
    });

    expect(container.firstChild).toBeNull();
  });

  it('should display pie chart when data available', async () => {
    vi.mocked(analyticsActions.getContentTypeBreakdownAction).mockResolvedValue({
      success: true,
      data: { notes: 10, links: 5, files: 3 },
    });

    render(<ContentBreakdown />);

    await waitFor(() => {
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });
  });
});
