import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { mockGeneratePost, mockGetPostHistory, mockDeletePost, mockGetContentForSelection } = vi.hoisted(() => ({
  mockGeneratePost: vi.fn(),
  mockGetPostHistory: vi.fn(),
  mockDeletePost: vi.fn(),
  mockGetContentForSelection: vi.fn(),
}));

vi.mock('@/app/actions/post-generator', () => ({
  generatePostAction: (...args: unknown[]) => mockGeneratePost(...args),
  getPostHistoryAction: (...args: unknown[]) => mockGetPostHistory(...args),
  deletePostAction: (...args: unknown[]) => mockDeletePost(...args),
  getContentForSelectionAction: (...args: unknown[]) => mockGetContentForSelection(...args),
}));

// Mock toast
vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({
    addToast: vi.fn(),
    toasts: [],
    removeToast: vi.fn(),
  }),
}));

import { PostGenerator } from './PostGenerator';

const sampleContent = [
  { id: 'c1', title: 'AI Trends 2025', type: 'note', tags: ['ai'], createdAt: new Date() },
  { id: 'c2', title: 'React Best Practices', type: 'link', tags: ['react'], createdAt: new Date() },
  { id: 'c3', title: 'TypeScript Guide', type: 'note', tags: ['typescript'], createdAt: new Date() },
];

describe('PostGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetContentForSelection.mockResolvedValue({
      success: true,
      items: sampleContent,
    });
    mockGetPostHistory.mockResolvedValue({
      success: true,
      posts: [],
    });
  });

  it('should render Generate and History tabs', async () => {
    render(<PostGenerator />);

    expect(screen.getByText('Generate')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
  });

  it('should render content selector on initial load', async () => {
    render(<PostGenerator />);

    await waitFor(() => {
      expect(screen.getByText('Select Content')).toBeInTheDocument();
    });
  });

  it('should load content items from server', async () => {
    render(<PostGenerator />);

    await waitFor(() => {
      expect(screen.getByText('AI Trends 2025')).toBeInTheDocument();
      expect(screen.getByText('React Best Practices')).toBeInTheDocument();
    });
  });

  it('should show continue button as disabled when no content selected', async () => {
    render(<PostGenerator />);

    await waitFor(() => {
      const continueBtn = screen.getByText(/Continue/);
      expect(continueBtn).toBeDisabled();
    });
  });

  it('should allow selecting content and proceeding to options', async () => {
    const user = userEvent.setup();
    render(<PostGenerator />);

    await waitFor(() => {
      expect(screen.getByText('AI Trends 2025')).toBeInTheDocument();
    });

    await user.click(screen.getByText('AI Trends 2025'));

    const continueBtn = screen.getByText(/Continue.*1 selected/);
    expect(continueBtn).not.toBeDisabled();

    await user.click(continueBtn);

    // Should now show post options
    await waitFor(() => {
      expect(screen.getByText('Tone')).toBeInTheDocument();
      expect(screen.getByText('Length')).toBeInTheDocument();
    });
  });

  it('should switch to History tab', async () => {
    const user = userEvent.setup();
    render(<PostGenerator />);

    await user.click(screen.getByText('History'));

    await waitFor(() => {
      expect(screen.getByText(/No posts generated yet/)).toBeInTheDocument();
    });
  });

  it('should show history posts when available', async () => {
    mockGetPostHistory.mockResolvedValue({
      success: true,
      posts: [
        {
          id: 'p1',
          postContent: 'A great LinkedIn post about AI trends and their impact on industry.',
          tone: 'professional',
          length: 'medium',
          includeHashtags: true,
          sourceContentTitles: ['AI Trends 2025'],
          createdAt: new Date('2025-06-15'),
        },
      ],
    });

    const user = userEvent.setup();
    render(<PostGenerator />);

    await user.click(screen.getByText('History'));

    await waitFor(() => {
      expect(screen.getByText(/A great LinkedIn post/)).toBeInTheDocument();
      expect(screen.getByText('professional')).toBeInTheDocument();
    });
  });

  it('should enforce max 5 content selection limit', async () => {
    const manyItems = Array.from({ length: 6 }, (_, i) => ({
      id: `c${i}`,
      title: `Content ${i}`,
      type: 'note',
      tags: [],
      createdAt: new Date(),
    }));

    mockGetContentForSelection.mockResolvedValue({
      success: true,
      items: manyItems,
    });

    const user = userEvent.setup();
    render(<PostGenerator />);

    await waitFor(() => {
      expect(screen.getByText('Content 0')).toBeInTheDocument();
    });

    // Select 5 items
    for (let i = 0; i < 5; i++) {
      await user.click(screen.getByText(`Content ${i}`));
    }

    // The 6th item should not be selectable (disabled)
    expect(screen.getByText('5/5 selected')).toBeInTheDocument();
  });
});
