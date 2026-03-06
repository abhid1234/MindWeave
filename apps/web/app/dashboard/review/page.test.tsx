import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReviewPage from './page';

// Mock actions
const mockGetReviewQueue = vi.fn();
const mockMarkReviewed = vi.fn();
const mockRateFlashcard = vi.fn();
const mockDismissReminder = vi.fn();
const mockSnoozeReminder = vi.fn();

vi.mock('@/app/actions/review', () => ({
  getReviewQueueAction: (...args: unknown[]) => mockGetReviewQueue(...args),
  markReviewedAction: (...args: unknown[]) => mockMarkReviewed(...args),
}));

vi.mock('@/app/actions/flashcards', () => ({
  rateFlashcardAction: (...args: unknown[]) => mockRateFlashcard(...args),
}));

vi.mock('@/app/actions/reminders', () => ({
  dismissReminderAction: (...args: unknown[]) => mockDismissReminder(...args),
  snoozeReminderAction: (...args: unknown[]) => mockSnoozeReminder(...args),
}));

vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

const flashcardItem = {
  id: 'flashcard-fc1',
  type: 'flashcard' as const,
  source: 'flashcard' as const,
  label: 'Flashcard',
  title: 'React Hooks',
  body: 'Learn about hooks',
  contentType: 'note',
  tags: ['react'],
  question: 'What is useState?',
  answer: 'A hook for state management',
  flashcardId: 'fc1',
  contentId: 'c1',
};

const contentItem = {
  id: 'stale-c2',
  type: 'content' as const,
  source: 'stale' as const,
  label: 'Forgotten Gem',
  title: 'Old Note',
  body: 'Some content',
  contentType: 'note',
  tags: [],
  contentId: 'c2',
};

describe('ReviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMarkReviewed.mockResolvedValue({ success: true });
    mockRateFlashcard.mockResolvedValue({ success: true });
    mockDismissReminder.mockResolvedValue({ success: true });
    mockSnoozeReminder.mockResolvedValue({ success: true });
  });

  it('should show loading state initially', () => {
    mockGetReviewQueue.mockReturnValue(new Promise(() => {}));
    render(<ReviewPage />);
    expect(document.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('should show complete state when queue is empty', async () => {
    mockGetReviewQueue.mockResolvedValue({ success: true, queue: [] });
    render(<ReviewPage />);
    await waitFor(() => {
      expect(screen.getByText('All caught up!')).toBeInTheDocument();
    });
  });

  it('should show review card when queue has items', async () => {
    mockGetReviewQueue.mockResolvedValue({ success: true, queue: [contentItem] });
    render(<ReviewPage />);
    await waitFor(() => {
      expect(screen.getByText('Old Note')).toBeInTheDocument();
    });
  });

  it('should show progress bar', async () => {
    mockGetReviewQueue.mockResolvedValue({ success: true, queue: [contentItem] });
    render(<ReviewPage />);
    await waitFor(() => {
      expect(screen.getByText('0 of 1 reviewed')).toBeInTheDocument();
    });
  });

  it('should advance to complete after reviewing last item', async () => {
    mockGetReviewQueue.mockResolvedValue({ success: true, queue: [contentItem] });
    const user = userEvent.setup();
    render(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByText('Old Note')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Mark Reviewed'));

    await waitFor(() => {
      expect(screen.getByText('All caught up!')).toBeInTheDocument();
    });
  });

  it('should handle flashcard rating', async () => {
    mockGetReviewQueue.mockResolvedValue({ success: true, queue: [flashcardItem, contentItem] });
    const user = userEvent.setup();
    render(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByText('What is useState?')).toBeInTheDocument();
    });

    // Flip card
    await user.click(screen.getByRole('button', { name: /flip to see answer/i }));
    expect(screen.getByText('A hook for state management')).toBeInTheDocument();

    // Rate easy
    await user.click(screen.getByText('Easy'));

    await waitFor(() => {
      expect(mockRateFlashcard).toHaveBeenCalledWith({ cardId: 'fc1', rating: 'easy' });
    });
  });

  it('should show page header', async () => {
    mockGetReviewQueue.mockResolvedValue({ success: true, queue: [contentItem] });
    render(<ReviewPage />);
    await waitFor(() => {
      expect(screen.getByText('Daily Review')).toBeInTheDocument();
    });
  });

  it('should handle skip action', async () => {
    mockGetReviewQueue.mockResolvedValue({ success: true, queue: [contentItem] });
    const user = userEvent.setup();
    render(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByText('Old Note')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Skip'));

    await waitFor(() => {
      expect(screen.getByText('All caught up!')).toBeInTheDocument();
    });
  });

  it('should handle error from getReviewQueue', async () => {
    mockGetReviewQueue.mockResolvedValue({ success: false, queue: [], message: 'Error' });
    render(<ReviewPage />);
    await waitFor(() => {
      expect(screen.getByText('All caught up!')).toBeInTheDocument();
    });
  });

  it('should advance to next item after review', async () => {
    mockGetReviewQueue.mockResolvedValue({
      success: true,
      queue: [contentItem, { ...contentItem, id: 'stale-c3', title: 'Second Note', contentId: 'c3' }],
    });
    const user = userEvent.setup();
    render(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByText('Old Note')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Mark Reviewed'));

    await waitFor(() => {
      expect(screen.getByText('Second Note')).toBeInTheDocument();
    });
  });
});
