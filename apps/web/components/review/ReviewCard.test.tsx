import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReviewCard } from './ReviewCard';
import type { ReviewQueueItem } from '@/app/actions/review';

const flashcardItem: ReviewQueueItem = {
  id: 'flashcard-fc1',
  type: 'flashcard',
  source: 'flashcard',
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

const reminderItem: ReviewQueueItem = {
  id: 'reminder-rem1',
  type: 'reminder',
  source: 'reminder',
  label: 'Due Reminder',
  title: 'Review TypeScript',
  body: 'Review advanced TS patterns',
  contentType: 'note',
  tags: ['typescript'],
  reminderId: 'rem1',
  contentId: 'c2',
};

const contentItem: ReviewQueueItem = {
  id: 'stale-c3',
  type: 'content',
  source: 'stale',
  label: 'Forgotten Gem',
  title: 'Old CSS Tricks',
  body: 'Some CSS techniques',
  contentType: 'link',
  tags: ['css'],
  contentId: 'c3',
};

describe('ReviewCard', () => {
  describe('Flashcard rendering', () => {
    it('should show question initially', () => {
      render(<ReviewCard item={flashcardItem} />);
      expect(screen.getByText('What is useState?')).toBeInTheDocument();
      expect(screen.getByText('Click to flip')).toBeInTheDocument();
    });

    it('should show answer when flipped', async () => {
      const user = userEvent.setup();
      render(<ReviewCard item={flashcardItem} />);

      await user.click(screen.getByRole('button', { name: /flip to see answer/i }));
      expect(screen.getByText('A hook for state management')).toBeInTheDocument();
    });

    it('should show rating buttons after flip', async () => {
      const user = userEvent.setup();
      render(<ReviewCard item={flashcardItem} />);

      await user.click(screen.getByRole('button', { name: /flip to see answer/i }));
      expect(screen.getByText('Again')).toBeInTheDocument();
      expect(screen.getByText('Hard')).toBeInTheDocument();
      expect(screen.getByText('Easy')).toBeInTheDocument();
    });

    it('should call onRate when rating button clicked', async () => {
      const onRate = vi.fn();
      const user = userEvent.setup();
      render(<ReviewCard item={flashcardItem} onRate={onRate} />);

      await user.click(screen.getByRole('button', { name: /flip to see answer/i }));
      await user.click(screen.getByText('Easy'));
      expect(onRate).toHaveBeenCalledWith('easy');
    });

    it('should call onRate with again', async () => {
      const onRate = vi.fn();
      const user = userEvent.setup();
      render(<ReviewCard item={flashcardItem} onRate={onRate} />);

      await user.click(screen.getByRole('button', { name: /flip to see answer/i }));
      await user.click(screen.getByText('Again'));
      expect(onRate).toHaveBeenCalledWith('again');
    });
  });

  describe('Reminder rendering', () => {
    it('should show reminder title and body', () => {
      render(<ReviewCard item={reminderItem} />);
      expect(screen.getByText('Review TypeScript')).toBeInTheDocument();
      expect(screen.getByText('Review advanced TS patterns')).toBeInTheDocument();
    });

    it('should show source label', () => {
      render(<ReviewCard item={reminderItem} />);
      expect(screen.getByText('Due Reminder')).toBeInTheDocument();
    });

    it('should call onDismissReminder when Reviewed clicked', async () => {
      const onDismiss = vi.fn();
      const user = userEvent.setup();
      render(<ReviewCard item={reminderItem} onDismissReminder={onDismiss} />);

      await user.click(screen.getByText('Reviewed'));
      expect(onDismiss).toHaveBeenCalled();
    });

    it('should call onSnoozeReminder with duration', async () => {
      const onSnooze = vi.fn();
      const user = userEvent.setup();
      render(<ReviewCard item={reminderItem} onSnoozeReminder={onSnooze} />);

      await user.click(screen.getByText('Snooze 3d'));
      expect(onSnooze).toHaveBeenCalledWith('3d');
    });
  });

  describe('Content rendering', () => {
    it('should show content title and body', () => {
      render(<ReviewCard item={contentItem} />);
      expect(screen.getByText('Old CSS Tricks')).toBeInTheDocument();
      expect(screen.getByText('Some CSS techniques')).toBeInTheDocument();
    });

    it('should show source label', () => {
      render(<ReviewCard item={contentItem} />);
      expect(screen.getByText('Forgotten Gem')).toBeInTheDocument();
    });

    it('should show tags', () => {
      render(<ReviewCard item={contentItem} />);
      expect(screen.getByText('css')).toBeInTheDocument();
    });

    it('should call onMarkReviewed', async () => {
      const onMark = vi.fn();
      const user = userEvent.setup();
      render(<ReviewCard item={contentItem} onMarkReviewed={onMark} />);

      await user.click(screen.getByText('Mark Reviewed'));
      expect(onMark).toHaveBeenCalled();
    });

    it('should call onSkip', async () => {
      const onSkip = vi.fn();
      const user = userEvent.setup();
      render(<ReviewCard item={contentItem} onSkip={onSkip} />);

      await user.click(screen.getByText('Skip'));
      expect(onSkip).toHaveBeenCalled();
    });

    it('should have Open link to library', () => {
      render(<ReviewCard item={contentItem} />);
      const openLink = screen.getByText('Open').closest('a');
      expect(openLink).toHaveAttribute('href', '/dashboard/library?highlight=c3');
    });
  });
});
