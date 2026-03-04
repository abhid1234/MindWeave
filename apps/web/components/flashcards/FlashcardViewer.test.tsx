import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FlashcardViewer } from './FlashcardViewer';

// Mock server action
const mockRateFlashcardAction = vi.fn().mockResolvedValue({ success: true, newBadges: [] });
vi.mock('@/app/actions/flashcards', () => ({
  rateFlashcardAction: (...args: unknown[]) => mockRateFlashcardAction(...args),
}));

// Mock toast
const mockAddToast = vi.fn();
vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

const mockCards = [
  { id: 'card-1', question: 'What is React?', answer: 'A JS library', interval: '1d', contentTitle: 'React Basics' },
  { id: 'card-2', question: 'What is JSX?', answer: 'Syntax extension', interval: '1d', contentTitle: 'React Basics' },
];

describe('FlashcardViewer', () => {
  const onComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the first card question', () => {
    render(<FlashcardViewer cards={mockCards} onComplete={onComplete} />);
    expect(screen.getByText('What is React?')).toBeInTheDocument();
    expect(screen.getByText('Click to reveal answer')).toBeInTheDocument();
  });

  it('should show progress bar', () => {
    render(<FlashcardViewer cards={mockCards} onComplete={onComplete} />);
    expect(screen.getByText('Card 1 of 2')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should flip card on click', async () => {
    const user = userEvent.setup();
    render(<FlashcardViewer cards={mockCards} onComplete={onComplete} />);

    await user.click(screen.getByTestId('flashcard'));
    expect(screen.getByText('A JS library')).toBeInTheDocument();
    expect(screen.getByTestId('rating-buttons')).toBeInTheDocument();
  });

  it('should show rating buttons after flip', async () => {
    const user = userEvent.setup();
    render(<FlashcardViewer cards={mockCards} onComplete={onComplete} />);

    await user.click(screen.getByTestId('flashcard'));
    expect(screen.getByText('Again')).toBeInTheDocument();
    expect(screen.getByText('Hard')).toBeInTheDocument();
    expect(screen.getByText('Easy')).toBeInTheDocument();
  });

  it('should rate card and advance to next', async () => {
    const user = userEvent.setup();
    render(<FlashcardViewer cards={mockCards} onComplete={onComplete} />);

    // Flip first card
    await user.click(screen.getByTestId('flashcard'));
    // Rate easy
    await user.click(screen.getByText('Easy'));

    expect(mockRateFlashcardAction).toHaveBeenCalledWith({ cardId: 'card-1', rating: 'easy' });
    // Should advance to second card
    expect(screen.getByText('What is JSX?')).toBeInTheDocument();
  });

  it('should call onComplete after last card', async () => {
    const user = userEvent.setup();
    render(<FlashcardViewer cards={[mockCards[0]]} onComplete={onComplete} />);

    await user.click(screen.getByTestId('flashcard'));
    await user.click(screen.getByText('Easy'));

    expect(onComplete).toHaveBeenCalled();
  });

  it('should show toast on rate error', async () => {
    mockRateFlashcardAction.mockResolvedValueOnce({ success: false, message: 'Rate failed' });
    const user = userEvent.setup();
    render(<FlashcardViewer cards={mockCards} onComplete={onComplete} />);

    await user.click(screen.getByTestId('flashcard'));
    await user.click(screen.getByText('Easy'));

    expect(mockAddToast).toHaveBeenCalledWith({ variant: 'error', title: 'Rate failed' });
  });
});
