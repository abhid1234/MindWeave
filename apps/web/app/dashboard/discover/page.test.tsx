import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock auth
const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

// Mock next/navigation
const mockRedirect = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: (path: string) => mockRedirect(path),
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock discover components
vi.mock('@/components/discover/ActivityRecommendations', () => ({
  ActivityRecommendations: () => <div data-testid="activity-recommendations">Activity Recommendations</div>,
}));

vi.mock('@/components/discover/UnexploredTopics', () => ({
  UnexploredTopics: () => <div data-testid="unexplored-topics">Unexplored Topics</div>,
}));

vi.mock('@/components/discover/RediscoverContent', () => ({
  RediscoverContent: () => <div data-testid="rediscover-content">Rediscover Content</div>,
}));

vi.mock('@/components/discover/SmartCollections', () => ({
  SmartCollections: () => <div data-testid="smart-collections">Smart Collections</div>,
}));

import DiscoverPage from './page';

describe('DiscoverPage', () => {
  it('should redirect to login when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    await DiscoverPage();

    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });

  it('should render the page when authenticated', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
    });

    const page = await DiscoverPage();
    render(page);

    expect(screen.getByText('Discover')).toBeInTheDocument();
    expect(screen.getByText('Explore your knowledge base with personalized recommendations')).toBeInTheDocument();
  });

  it('should render all four discover sections', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
    });

    const page = await DiscoverPage();
    render(page);

    expect(screen.getByTestId('activity-recommendations')).toBeInTheDocument();
    expect(screen.getByTestId('unexplored-topics')).toBeInTheDocument();
    expect(screen.getByTestId('rediscover-content')).toBeInTheDocument();
    expect(screen.getByTestId('smart-collections')).toBeInTheDocument();
  });
});
