import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { mockGetDailyHighlight, mockDismissHighlight } = vi.hoisted(() => ({
  mockGetDailyHighlight: vi.fn(),
  mockDismissHighlight: vi.fn(),
}));

vi.mock('@/app/actions/highlights', () => ({
  getDailyHighlightAction: (...args: unknown[]) => mockGetDailyHighlight(...args),
  dismissHighlightAction: (...args: unknown[]) => mockDismissHighlight(...args),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

import { DailyHighlight } from './DailyHighlight';

const sampleHighlight = {
  contentId: 'c1',
  title: 'Understanding React Server Components',
  type: 'note',
  insight: 'Server components reduce client-side JavaScript and improve performance.',
  tags: ['react', 'performance'],
};

describe('DailyHighlight', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDailyHighlight.mockResolvedValue({
      success: true,
      highlight: sampleHighlight,
    });
    mockDismissHighlight.mockResolvedValue({ success: true });
  });

  it('shows loading skeleton initially', () => {
    // Never resolve so the component stays in loading state
    mockGetDailyHighlight.mockReturnValue(new Promise(() => {}));

    const { container } = render(<DailyHighlight />);

    const skeleton = container.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('renders highlight card with title and insight when data loads', async () => {
    render(<DailyHighlight />);

    await waitFor(() => {
      expect(screen.getByText('Understanding React Server Components')).toBeInTheDocument();
    });

    expect(
      screen.getByText('Server components reduce client-side JavaScript and improve performance.')
    ).toBeInTheDocument();
    expect(screen.getByText('Worth Revisiting')).toBeInTheDocument();
    expect(screen.getByText('note')).toBeInTheDocument();
    expect(screen.getByText('View')).toBeInTheDocument();
  });

  it('hides when no highlight available (returns null)', async () => {
    mockGetDailyHighlight.mockResolvedValue({
      success: true,
      highlight: null,
    });

    const { container } = render(<DailyHighlight />);

    await waitFor(() => {
      // After loading, the component should render nothing
      expect(container.innerHTML).toBe('');
    });
  });

  it('dismiss button calls dismissHighlightAction', async () => {
    const user = userEvent.setup();
    render(<DailyHighlight />);

    await waitFor(() => {
      expect(screen.getByText('Understanding React Server Components')).toBeInTheDocument();
    });

    const dismissButton = screen.getByRole('button', { name: /dismiss highlight/i });
    await user.click(dismissButton);

    expect(mockDismissHighlight).toHaveBeenCalledWith('c1');
  });

  it('hides after dismissal', async () => {
    const user = userEvent.setup();
    const { container } = render(<DailyHighlight />);

    await waitFor(() => {
      expect(screen.getByText('Understanding React Server Components')).toBeInTheDocument();
    });

    const dismissButton = screen.getByRole('button', { name: /dismiss highlight/i });
    await user.click(dismissButton);

    await waitFor(() => {
      expect(container.innerHTML).toBe('');
    });
  });
});
