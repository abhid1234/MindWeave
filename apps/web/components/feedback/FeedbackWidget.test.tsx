import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedbackWidget } from './FeedbackWidget';

// Mock the server action
vi.mock('@/app/actions/feedback', () => ({
  submitFeedbackAction: vi.fn().mockResolvedValue({ success: true, feedbackId: 'test-id' }),
}));

// Mock the toast hook
const mockAddToast = vi.fn();
vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({ addToast: mockAddToast, toasts: [], removeToast: vi.fn() }),
}));

describe('FeedbackWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the trigger button', () => {
    render(<FeedbackWidget />);

    expect(screen.getByRole('button', { name: /send feedback/i })).toBeInTheDocument();
  });

  it('opens modal when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<FeedbackWidget />);

    await user.click(screen.getByRole('button', { name: /send feedback/i }));

    expect(screen.getByText('Send Feedback')).toBeInTheDocument();
  });

  it('shows feedback type options', async () => {
    const user = userEvent.setup();
    render(<FeedbackWidget />);

    await user.click(screen.getByRole('button', { name: /send feedback/i }));

    expect(screen.getByText('Bug Report')).toBeInTheDocument();
    expect(screen.getByText('Feature Request')).toBeInTheDocument();
    expect(screen.getByText('Improvement')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('advances to form step when type is selected', async () => {
    const user = userEvent.setup();
    render(<FeedbackWidget />);

    await user.click(screen.getByRole('button', { name: /send feedback/i }));
    await user.click(screen.getByText('Bug Report'));

    expect(screen.getByLabelText(/your feedback/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('can go back to type selection', async () => {
    const user = userEvent.setup();
    render(<FeedbackWidget />);

    await user.click(screen.getByRole('button', { name: /send feedback/i }));
    await user.click(screen.getByText('Feature Request'));
    // Use getByText for the Back button since it's more specific
    await user.click(screen.getByText('Back'));

    expect(screen.getByText('Send Feedback')).toBeInTheDocument();
  });

  it('closes modal when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<FeedbackWidget />);

    await user.click(screen.getByRole('button', { name: /send feedback/i }));
    await user.click(screen.getByRole('button', { name: /^close$/i }));

    expect(screen.queryByText('Send Feedback')).not.toBeInTheDocument();
  });

  it('closes modal when backdrop is clicked', async () => {
    const user = userEvent.setup();
    render(<FeedbackWidget />);

    await user.click(screen.getByRole('button', { name: /send feedback/i }));

    // Click the backdrop (the div with bg-black/50)
    const backdrop = document.querySelector('.bg-black\\/50');
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop!);

    expect(screen.queryByText('Send Feedback')).not.toBeInTheDocument();
  });

  it('shows validation error for short message', async () => {
    const user = userEvent.setup();
    render(<FeedbackWidget />);

    await user.click(screen.getByRole('button', { name: /send feedback/i }));
    await user.click(screen.getByText('Bug Report'));

    const textarea = screen.getByLabelText(/your feedback/i);
    await user.type(textarea, 'short');

    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Message too short',
        variant: 'error',
      })
    );
  });

  it('submits feedback successfully', async () => {
    const user = userEvent.setup();
    const { submitFeedbackAction } = await import('@/app/actions/feedback');

    render(<FeedbackWidget />);

    await user.click(screen.getByRole('button', { name: /send feedback/i }));
    await user.click(screen.getByText('Improvement'));

    const textarea = screen.getByLabelText(/your feedback/i);
    await user.type(textarea, 'This is a great suggestion for improving the app!');

    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(submitFeedbackAction).toHaveBeenCalled();
    });

    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Thank you!',
      })
    );
  });

  it('handles submission error', async () => {
    const user = userEvent.setup();
    const { submitFeedbackAction } = await import('@/app/actions/feedback');
    vi.mocked(submitFeedbackAction).mockResolvedValueOnce({
      success: false,
      error: 'Server error',
    });

    render(<FeedbackWidget />);

    await user.click(screen.getByRole('button', { name: /send feedback/i }));
    await user.click(screen.getByText('Other'));

    const textarea = screen.getByLabelText(/your feedback/i);
    await user.type(textarea, 'This feedback should trigger an error response.');

    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          variant: 'error',
        })
      );
    });
  });

  it('shows character count', async () => {
    const user = userEvent.setup();
    render(<FeedbackWidget />);

    await user.click(screen.getByRole('button', { name: /send feedback/i }));
    await user.click(screen.getByText('Bug Report'));

    expect(screen.getByText('0/2000 characters')).toBeInTheDocument();

    const textarea = screen.getByLabelText(/your feedback/i);
    await user.type(textarea, 'Hello');

    expect(screen.getByText('5/2000 characters')).toBeInTheDocument();
  });

  it('includes optional email field', async () => {
    const user = userEvent.setup();
    const { submitFeedbackAction } = await import('@/app/actions/feedback');

    render(<FeedbackWidget />);

    await user.click(screen.getByRole('button', { name: /send feedback/i }));
    await user.click(screen.getByText('Feature Request'));

    const textarea = screen.getByLabelText(/your feedback/i);
    await user.type(textarea, 'Please add this amazing feature to the app!');

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'user@example.com');

    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(submitFeedbackAction).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'user@example.com',
        }),
        expect.any(String)
      );
    });
  });
});
