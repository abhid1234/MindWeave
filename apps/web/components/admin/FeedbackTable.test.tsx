import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FeedbackTable } from './FeedbackTable';

// Mock the server action
vi.mock('@/app/actions/feedback', () => ({
  updateFeedbackStatusAction: vi.fn().mockResolvedValue({ success: true }),
}));

const mockItems = [
  {
    id: 'fb-1',
    type: 'bug',
    message: 'Something is broken in the dashboard',
    status: 'new',
    email: 'user@example.com',
    page: '/dashboard',
    createdAt: new Date('2026-01-15'),
  },
  {
    id: 'fb-2',
    type: 'feature',
    message: 'Please add dark mode support',
    status: 'reviewed',
    email: null,
    page: null,
    createdAt: new Date('2026-01-16'),
  },
];

describe('FeedbackTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no items', () => {
    render(<FeedbackTable initialItems={[]} />);

    expect(screen.getByText('No feedback yet.')).toBeInTheDocument();
  });

  it('renders table with items', () => {
    render(<FeedbackTable initialItems={mockItems} />);

    expect(screen.getByText('Something is broken in the dashboard')).toBeInTheDocument();
    expect(screen.getByText('Please add dark mode support')).toBeInTheDocument();
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
  });

  it('status dropdown changes call updateFeedbackStatusAction', async () => {
    const { updateFeedbackStatusAction } = await import('@/app/actions/feedback');

    render(<FeedbackTable initialItems={mockItems} />);

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'resolved' } });

    await waitFor(() => {
      expect(updateFeedbackStatusAction).toHaveBeenCalledWith('fb-1', 'resolved');
    });
  });

  it('successful status update updates UI', async () => {
    render(<FeedbackTable initialItems={mockItems} />);

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'resolved' } });

    await waitFor(() => {
      expect(selects[0]).toHaveValue('resolved');
    });
  });

  it('shows all table columns', () => {
    render(<FeedbackTable initialItems={mockItems} />);

    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Message')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
  });
});
