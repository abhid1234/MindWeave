import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GenerateFlashcardsDialog } from './GenerateFlashcardsDialog';

// Mock server action
const mockGenerateFlashcardsAction = vi.fn();
vi.mock('@/app/actions/flashcards', () => ({
  generateFlashcardsAction: (...args: unknown[]) => mockGenerateFlashcardsAction(...args),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('GenerateFlashcardsDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    contentId: 'content-1',
    contentTitle: 'Test Content',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dialog with title and description', () => {
    render(<GenerateFlashcardsDialog {...defaultProps} />);
    expect(screen.getByText('Generate Flashcards')).toBeInTheDocument();
    expect(screen.getByText(/Test Content/)).toBeInTheDocument();
  });

  it('should show success state after generation', async () => {
    mockGenerateFlashcardsAction.mockResolvedValue({ success: true, count: 3, message: 'Generated 3 flashcards' });
    const user = userEvent.setup();
    render(<GenerateFlashcardsDialog {...defaultProps} />);

    await user.click(screen.getByText('Generate'));
    expect(await screen.findByText(/Generated 3 flashcards/)).toBeInTheDocument();
    expect(screen.getByText('Go to Study')).toBeInTheDocument();
  });

  it('should show error on failure', async () => {
    mockGenerateFlashcardsAction.mockResolvedValue({ success: false, message: 'AI failed' });
    const user = userEvent.setup();
    render(<GenerateFlashcardsDialog {...defaultProps} />);

    await user.click(screen.getByText('Generate'));
    expect(await screen.findByText('AI failed')).toBeInTheDocument();
  });
});
