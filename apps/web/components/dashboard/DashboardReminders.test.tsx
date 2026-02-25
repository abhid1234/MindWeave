import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { mockGetActiveReminders, mockDismissReminder, mockSnoozeReminder } = vi.hoisted(() => ({
  mockGetActiveReminders: vi.fn(),
  mockDismissReminder: vi.fn(),
  mockSnoozeReminder: vi.fn(),
}));

vi.mock('@/app/actions/reminders', () => ({
  getActiveRemindersAction: (...args: unknown[]) => mockGetActiveReminders(...args),
  dismissReminderAction: (...args: unknown[]) => mockDismissReminder(...args),
  snoozeReminderAction: (...args: unknown[]) => mockSnoozeReminder(...args),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({
    addToast: vi.fn(),
    toasts: [],
    removeToast: vi.fn(),
  }),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div data-testid="dropdown-trigger">{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => (
    <button data-testid="dropdown-item" onClick={onClick}>
      {children}
    </button>
  ),
}));

import { DashboardReminders } from './DashboardReminders';

const pastDate = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days from now

const sampleReminders = [
  {
    id: 'r1',
    contentId: 'c1',
    title: 'React Hooks Deep Dive',
    type: 'note',
    interval: '1d',
    nextRemindAt: pastDate,
  },
  {
    id: 'r2',
    contentId: 'c2',
    title: 'TypeScript Patterns',
    type: 'link',
    interval: '7d',
    nextRemindAt: futureDate,
  },
];

describe('DashboardReminders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetActiveReminders.mockResolvedValue({
      success: true,
      reminders: sampleReminders,
    });
    mockDismissReminder.mockResolvedValue({ success: true, message: 'Dismissed' });
    mockSnoozeReminder.mockResolvedValue({ success: true, message: 'Snoozed' });
  });

  it('shows loading skeletons initially', () => {
    // Never resolve to stay in loading state
    mockGetActiveReminders.mockReturnValue(new Promise(() => {}));

    const { container } = render(<DashboardReminders />);

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThanOrEqual(2);
  });

  it('renders reminder list with titles when data loads', async () => {
    render(<DashboardReminders />);

    await waitFor(() => {
      expect(screen.getByText('React Hooks Deep Dive')).toBeInTheDocument();
    });

    expect(screen.getByText('TypeScript Patterns')).toBeInTheDocument();
    expect(screen.getByText('Reminders')).toBeInTheDocument();
  });

  it('hides when no reminders (returns null)', async () => {
    mockGetActiveReminders.mockResolvedValue({
      success: true,
      reminders: [],
    });

    const { container } = render(<DashboardReminders />);

    await waitFor(() => {
      expect(container.innerHTML).toBe('');
    });
  });

  it('shows "Due now" badge for overdue reminders', async () => {
    render(<DashboardReminders />);

    await waitFor(() => {
      expect(screen.getByText('Due now')).toBeInTheDocument();
    });
  });

  it('renders snooze and dismiss options', async () => {
    render(<DashboardReminders />);

    await waitFor(() => {
      expect(screen.getByText('React Hooks Deep Dive')).toBeInTheDocument();
    });

    // With our mock, all dropdown items are rendered as buttons
    const snooze1Day = screen.getAllByText('Snooze 1 day');
    const snooze3Days = screen.getAllByText('Snooze 3 days');
    const snooze1Week = screen.getAllByText('Snooze 1 week');
    const dismissButtons = screen.getAllByText('Dismiss');

    // We have 2 reminders, so 2 of each option
    expect(snooze1Day).toHaveLength(2);
    expect(snooze3Days).toHaveLength(2);
    expect(snooze1Week).toHaveLength(2);
    expect(dismissButtons).toHaveLength(2);
  });
});
