import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecommendationsDialog, type RecommendationsDialogProps } from './RecommendationsDialog';

// Mock the RecommendationCard component
vi.mock('./RecommendationCard', () => ({
  RecommendationCard: ({ id, title, similarity }: { id: string; title: string; similarity: number }) => (
    <div data-testid={`recommendation-card-${id}`}>
      {title} - {Math.round(similarity * 100)}%
    </div>
  ),
}));

// Mock the getRecommendationsAction
const mockGetRecommendationsAction = vi.fn();
vi.mock('@/app/actions/search', () => ({
  getRecommendationsAction: (...args: any[]) => mockGetRecommendationsAction(...args),
}));

describe('RecommendationsDialog', () => {
  const baseProps: RecommendationsDialogProps = {
    contentId: 'content-1',
    contentTitle: 'Test Content',
    open: true,
    onOpenChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRecommendationsAction.mockResolvedValue({
      success: true,
      recommendations: [],
    });
  });

  describe('Loading state', () => {
    it('should show loading skeleton when fetching', async () => {
      // Keep the promise pending to see loading state
      mockGetRecommendationsAction.mockImplementation(() => new Promise(() => {}));

      render(<RecommendationsDialog {...baseProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('recommendations-loading')).toBeInTheDocument();
      });
    });

    it('should hide loading skeleton after fetch completes', async () => {
      mockGetRecommendationsAction.mockResolvedValue({
        success: true,
        recommendations: [],
      });

      render(<RecommendationsDialog {...baseProps} />);

      await waitFor(() => {
        expect(screen.queryByTestId('recommendations-loading')).not.toBeInTheDocument();
      });
    });
  });

  describe('Empty state', () => {
    it('should show empty state when no recommendations', async () => {
      mockGetRecommendationsAction.mockResolvedValue({
        success: true,
        recommendations: [],
      });

      render(<RecommendationsDialog {...baseProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('recommendations-empty')).toBeInTheDocument();
      });
      expect(screen.getByText('No similar content found')).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('should show error state when fetch fails', async () => {
      mockGetRecommendationsAction.mockResolvedValue({
        success: false,
        message: 'Something went wrong',
        recommendations: [],
      });

      render(<RecommendationsDialog {...baseProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('recommendations-error')).toBeInTheDocument();
      });
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should show error state when fetch throws', async () => {
      mockGetRecommendationsAction.mockRejectedValue(new Error('Network error'));

      render(<RecommendationsDialog {...baseProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('recommendations-error')).toBeInTheDocument();
      });
    });
  });

  describe('Recommendations list', () => {
    it('should display recommendations when available', async () => {
      mockGetRecommendationsAction.mockResolvedValue({
        success: true,
        recommendations: [
          { id: 'rec-1', title: 'Recommendation 1', body: 'Body', type: 'note', tags: [], autoTags: [], url: null, createdAt: new Date(), similarity: 0.9 },
          { id: 'rec-2', title: 'Recommendation 2', body: 'Body', type: 'link', tags: [], autoTags: [], url: null, createdAt: new Date(), similarity: 0.8 },
        ],
      });

      render(<RecommendationsDialog {...baseProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('recommendations-list')).toBeInTheDocument();
      });
      expect(screen.getByTestId('recommendation-card-rec-1')).toBeInTheDocument();
      expect(screen.getByTestId('recommendation-card-rec-2')).toBeInTheDocument();
    });

    it('should pass correct props to RecommendationCard', async () => {
      mockGetRecommendationsAction.mockResolvedValue({
        success: true,
        recommendations: [
          { id: 'rec-1', title: 'Test Rec', body: 'Body', type: 'note', tags: ['tag1'], autoTags: ['auto1'], url: null, createdAt: new Date(), similarity: 0.85 },
        ],
      });

      render(<RecommendationsDialog {...baseProps} />);

      await waitFor(() => {
        expect(screen.getByText('Test Rec - 85%')).toBeInTheDocument();
      });
    });
  });

  describe('Dialog behavior', () => {
    it('should show dialog title', async () => {
      render(<RecommendationsDialog {...baseProps} />);

      expect(screen.getByText('Similar Content')).toBeInTheDocument();
    });

    it('should show content title in description', async () => {
      render(<RecommendationsDialog {...baseProps} />);

      expect(screen.getByText(/Content similar to "Test Content"/)).toBeInTheDocument();
    });

    it('should call onOpenChange when dialog is closed', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(<RecommendationsDialog {...baseProps} onOpenChange={onOpenChange} />);

      // Click the close button (X button in dialog)
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should not render when closed', () => {
      render(<RecommendationsDialog {...baseProps} open={false} />);

      expect(screen.queryByText('Similar Content')).not.toBeInTheDocument();
    });
  });

  describe('Fetching behavior', () => {
    it('should fetch recommendations when dialog opens', async () => {
      render(<RecommendationsDialog {...baseProps} />);

      await waitFor(() => {
        expect(mockGetRecommendationsAction).toHaveBeenCalledWith('content-1', 5, 0.5);
      });
    });

    it('should refetch when contentId changes', async () => {
      const { rerender } = render(<RecommendationsDialog {...baseProps} />);

      await waitFor(() => {
        expect(mockGetRecommendationsAction).toHaveBeenCalledTimes(1);
      });

      rerender(<RecommendationsDialog {...baseProps} contentId="content-2" />);

      await waitFor(() => {
        expect(mockGetRecommendationsAction).toHaveBeenCalledWith('content-2', 5, 0.5);
      });
    });

    it('should not fetch when dialog is closed', () => {
      render(<RecommendationsDialog {...baseProps} open={false} />);

      expect(mockGetRecommendationsAction).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible dialog structure', async () => {
      mockGetRecommendationsAction.mockResolvedValue({
        success: true,
        recommendations: [],
      });

      render(<RecommendationsDialog {...baseProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should have error state with alert role', async () => {
      mockGetRecommendationsAction.mockResolvedValue({
        success: false,
        message: 'Error',
        recommendations: [],
      });

      render(<RecommendationsDialog {...baseProps} />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });
});
