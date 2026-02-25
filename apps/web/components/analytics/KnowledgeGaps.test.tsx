import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { KnowledgeGaps } from './KnowledgeGaps';
import * as analyticsActions from '@/app/actions/analytics';

vi.mock('@/app/actions/analytics', () => ({
  getKnowledgeGapsAction: vi.fn(),
}));

describe('KnowledgeGaps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading skeleton initially', () => {
    vi.mocked(analyticsActions.getKnowledgeGapsAction).mockImplementation(
      () => new Promise(() => {})
    );

    render(<KnowledgeGaps />);
    expect(screen.getByTestId('knowledge-gaps-skeleton')).toBeInTheDocument();
  });

  it('should show sparse topics', async () => {
    vi.mocked(analyticsActions.getKnowledgeGapsAction).mockResolvedValue({
      success: true,
      data: [
        { tag: 'react', count: 1, lastAdded: new Date() },
        { tag: 'python', count: 2, lastAdded: new Date() },
      ],
    });

    render(<KnowledgeGaps />);

    await waitFor(() => {
      expect(screen.getByText('react')).toBeInTheDocument();
      expect(screen.getByText('python')).toBeInTheDocument();
    });
  });

  it('should show stale topics', async () => {
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - 60); // 60 days ago

    vi.mocked(analyticsActions.getKnowledgeGapsAction).mockResolvedValue({
      success: true,
      data: [
        { tag: 'old-topic', count: 5, lastAdded: staleDate },
      ],
    });

    render(<KnowledgeGaps />);

    await waitFor(() => {
      expect(screen.getByText('old-topic')).toBeInTheDocument();
    });
  });

  it('should show empty state when no gaps', async () => {
    vi.mocked(analyticsActions.getKnowledgeGapsAction).mockResolvedValue({
      success: true,
      data: [],
    });

    render(<KnowledgeGaps />);

    await waitFor(() => {
      expect(screen.getByText(/no knowledge gaps detected/i)).toBeInTheDocument();
    });
  });

  it('should show capture more link', async () => {
    vi.mocked(analyticsActions.getKnowledgeGapsAction).mockResolvedValue({
      success: true,
      data: [
        { tag: 'sparse-tag', count: 1, lastAdded: new Date() },
      ],
    });

    render(<KnowledgeGaps />);

    await waitFor(() => {
      const link = screen.getByText(/capture more knowledge/i);
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/dashboard/capture?template=learning-journal');
    });
  });
});
