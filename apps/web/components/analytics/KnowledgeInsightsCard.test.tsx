import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { KnowledgeInsightsCard } from './KnowledgeInsightsCard';

// Mock the server action
vi.mock('@/app/actions/analytics', () => ({
  getKnowledgeInsightsAction: vi.fn(),
}));

import { getKnowledgeInsightsAction } from '@/app/actions/analytics';
const mockedGetKnowledgeInsights = vi.mocked(getKnowledgeInsightsAction);

describe('KnowledgeInsightsCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading state', () => {
    it('should show loading skeletons initially', () => {
      mockedGetKnowledgeInsights.mockImplementation(() => new Promise(() => {}));
      render(<KnowledgeInsightsCard />);

      expect(screen.getByTestId('insights-loading')).toBeInTheDocument();
    });
  });

  describe('Success state', () => {
    const mockInsights = [
      {
        type: 'achievement' as const,
        title: 'Knowledge Champion',
        description: "You've captured 127 items in your knowledge base. Keep building!",
        icon: 'trophy' as const,
      },
      {
        type: 'pattern' as const,
        title: 'Top Focus Area',
        description: '"javascript" is your most common topic with 25 items tagged.',
        icon: 'tag' as const,
      },
      {
        type: 'suggestion' as const,
        title: 'AI Insight',
        description: 'Consider exploring more TypeScript resources based on your interests.',
        icon: 'lightbulb' as const,
      },
    ];

    beforeEach(() => {
      mockedGetKnowledgeInsights.mockResolvedValue({
        success: true,
        data: mockInsights,
      });
    });

    it('should render insights', async () => {
      render(<KnowledgeInsightsCard />);

      await waitFor(() => {
        expect(screen.getByTestId('insights-content')).toBeInTheDocument();
      });

      const insightItems = screen.getAllByTestId('insight-item');
      expect(insightItems).toHaveLength(3);
    });

    it('should render insight titles', async () => {
      render(<KnowledgeInsightsCard />);

      await waitFor(() => {
        expect(screen.getByText('Knowledge Champion')).toBeInTheDocument();
        expect(screen.getByText('Top Focus Area')).toBeInTheDocument();
        expect(screen.getByText('AI Insight')).toBeInTheDocument();
      });
    });

    it('should render insight descriptions', async () => {
      render(<KnowledgeInsightsCard />);

      await waitFor(() => {
        expect(screen.getByText(/captured 127 items/)).toBeInTheDocument();
        expect(screen.getByText(/javascript.*most common topic/)).toBeInTheDocument();
        expect(screen.getByText(/TypeScript resources/)).toBeInTheDocument();
      });
    });

    it('should render card title', () => {
      render(<KnowledgeInsightsCard />);
      expect(screen.getByText('Knowledge Insights')).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('should display error message when fetch fails', async () => {
      mockedGetKnowledgeInsights.mockResolvedValue({
        success: false,
        message: 'Failed to generate insights',
      });

      render(<KnowledgeInsightsCard />);

      await waitFor(() => {
        expect(screen.getByTestId('insights-error')).toBeInTheDocument();
      });

      expect(screen.getByText('Failed to generate insights')).toBeInTheDocument();
    });

    it('should display fallback error when no message', async () => {
      mockedGetKnowledgeInsights.mockResolvedValue({
        success: false,
      });

      render(<KnowledgeInsightsCard />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load insights')).toBeInTheDocument();
      });
    });
  });

  describe('Empty state', () => {
    it('should display empty message when no insights', async () => {
      mockedGetKnowledgeInsights.mockResolvedValue({
        success: true,
        data: [],
      });

      render(<KnowledgeInsightsCard />);

      await waitFor(() => {
        expect(screen.getByTestId('insights-empty')).toBeInTheDocument();
      });

      expect(screen.getByText('No insights available yet')).toBeInTheDocument();
    });
  });

  describe('Insight types', () => {
    it('should render pattern type insight', async () => {
      mockedGetKnowledgeInsights.mockResolvedValue({
        success: true,
        data: [
          {
            type: 'pattern' as const,
            title: 'Momentum Building',
            description: 'Your activity is increasing!',
            icon: 'trending-up' as const,
          },
        ],
      });

      render(<KnowledgeInsightsCard />);

      await waitFor(() => {
        expect(screen.getByText('Momentum Building')).toBeInTheDocument();
      });
    });

    it('should render suggestion type insight', async () => {
      mockedGetKnowledgeInsights.mockResolvedValue({
        success: true,
        data: [
          {
            type: 'suggestion' as const,
            title: 'Organize with Collections',
            description: 'Create collections to group related items.',
            icon: 'lightbulb' as const,
          },
        ],
      });

      render(<KnowledgeInsightsCard />);

      await waitFor(() => {
        expect(screen.getByText('Organize with Collections')).toBeInTheDocument();
      });
    });

    it('should render achievement type insight', async () => {
      mockedGetKnowledgeInsights.mockResolvedValue({
        success: true,
        data: [
          {
            type: 'achievement' as const,
            title: 'Growing Library',
            description: '50 items saved. Great progress!',
            icon: 'trophy' as const,
          },
        ],
      });

      render(<KnowledgeInsightsCard />);

      await waitFor(() => {
        expect(screen.getByText('Growing Library')).toBeInTheDocument();
      });
    });
  });

  describe('Data testid', () => {
    it('should have correct testid on the container', () => {
      mockedGetKnowledgeInsights.mockImplementation(() => new Promise(() => {}));
      render(<KnowledgeInsightsCard />);

      expect(screen.getByTestId('knowledge-insights-card')).toBeInTheDocument();
    });
  });
});
