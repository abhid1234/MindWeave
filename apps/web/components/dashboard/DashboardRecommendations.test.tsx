import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DashboardRecommendations } from './DashboardRecommendations';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock the RecommendationCard component
vi.mock('@/components/library/RecommendationCard', () => ({
  RecommendationCard: ({ id, title, similarity }: { id: string; title: string; similarity: number }) => (
    <div data-testid={`recommendation-card-${id}`}>
      {title} - {Math.round(similarity * 100)}%
    </div>
  ),
}));

// Mock the getDashboardRecommendationsAction
const mockGetDashboardRecommendationsAction = vi.fn();
vi.mock('@/app/actions/search', () => ({
  getDashboardRecommendationsAction: () => mockGetDashboardRecommendationsAction(),
}));

describe('DashboardRecommendations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDashboardRecommendationsAction.mockResolvedValue({
      success: true,
      recommendations: [],
    });
  });

  describe('Loading state', () => {
    it('should show loading skeleton initially', async () => {
      // Keep the promise pending to see loading state
      mockGetDashboardRecommendationsAction.mockImplementation(() => new Promise(() => {}));

      render(<DashboardRecommendations />);

      expect(screen.getByTestId('dashboard-recommendations-loading')).toBeInTheDocument();
    });

    it('should hide loading skeleton after fetch completes', async () => {
      mockGetDashboardRecommendationsAction.mockResolvedValue({
        success: true,
        recommendations: [
          { id: 'rec-1', title: 'Rec', body: null, type: 'note', tags: [], autoTags: [], url: null, createdAt: new Date(), similarity: 0.9 },
        ],
      });

      render(<DashboardRecommendations />);

      await waitFor(() => {
        expect(screen.queryByTestId('dashboard-recommendations-loading')).not.toBeInTheDocument();
      });
    });
  });

  describe('Empty state', () => {
    it('should not render anything when no recommendations', async () => {
      mockGetDashboardRecommendationsAction.mockResolvedValue({
        success: true,
        recommendations: [],
      });

      const { container } = render(<DashboardRecommendations />);

      await waitFor(() => {
        expect(screen.queryByTestId('dashboard-recommendations-loading')).not.toBeInTheDocument();
      });

      // Component should not render when empty
      expect(container.querySelector('section')).not.toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('should show error state when fetch fails', async () => {
      mockGetDashboardRecommendationsAction.mockResolvedValue({
        success: false,
        message: 'Something went wrong',
        recommendations: [],
      });

      render(<DashboardRecommendations />);

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-recommendations-error')).toBeInTheDocument();
      });
      expect(screen.getByText('Failed to load recommendations')).toBeInTheDocument();
    });

    it('should show error state when fetch throws', async () => {
      mockGetDashboardRecommendationsAction.mockRejectedValue(new Error('Network error'));

      render(<DashboardRecommendations />);

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-recommendations-error')).toBeInTheDocument();
      });
    });
  });

  describe('Recommendations list', () => {
    it('should display recommendations when available', async () => {
      mockGetDashboardRecommendationsAction.mockResolvedValue({
        success: true,
        recommendations: [
          { id: 'rec-1', title: 'Recommendation 1', body: null, type: 'note', tags: [], autoTags: [], url: null, createdAt: new Date(), similarity: 0.9 },
          { id: 'rec-2', title: 'Recommendation 2', body: null, type: 'link', tags: [], autoTags: [], url: null, createdAt: new Date(), similarity: 0.8 },
        ],
      });

      render(<DashboardRecommendations />);

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-recommendations-list')).toBeInTheDocument();
      });
      expect(screen.getByTestId('recommendation-card-rec-1')).toBeInTheDocument();
      expect(screen.getByTestId('recommendation-card-rec-2')).toBeInTheDocument();
    });

    it('should show section title when recommendations exist', async () => {
      mockGetDashboardRecommendationsAction.mockResolvedValue({
        success: true,
        recommendations: [
          { id: 'rec-1', title: 'Rec', body: null, type: 'note', tags: [], autoTags: [], url: null, createdAt: new Date(), similarity: 0.9 },
        ],
      });

      render(<DashboardRecommendations />);

      await waitFor(() => {
        expect(screen.getByText('Recommended for You')).toBeInTheDocument();
      });
    });

    it('should show View Library link when recommendations exist', async () => {
      mockGetDashboardRecommendationsAction.mockResolvedValue({
        success: true,
        recommendations: [
          { id: 'rec-1', title: 'Rec', body: null, type: 'note', tags: [], autoTags: [], url: null, createdAt: new Date(), similarity: 0.9 },
        ],
      });

      render(<DashboardRecommendations />);

      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'View Library' })).toHaveAttribute('href', '/dashboard/library');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper section labeling', async () => {
      mockGetDashboardRecommendationsAction.mockResolvedValue({
        success: true,
        recommendations: [
          { id: 'rec-1', title: 'Rec', body: null, type: 'note', tags: [], autoTags: [], url: null, createdAt: new Date(), similarity: 0.9 },
        ],
      });

      render(<DashboardRecommendations />);

      await waitFor(() => {
        const section = screen.getByRole('region', { name: 'Recommended for You' });
        expect(section).toBeInTheDocument();
      });
    });

    it('should have error alert role', async () => {
      mockGetDashboardRecommendationsAction.mockResolvedValue({
        success: false,
        recommendations: [],
      });

      render(<DashboardRecommendations />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });
});
