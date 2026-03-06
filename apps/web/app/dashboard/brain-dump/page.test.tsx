import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BrainDumpPage from './page';

// Mock server actions
const mockProcessAction = vi.fn();
const mockSaveAction = vi.fn();

vi.mock('@/app/actions/brain-dump', () => ({
  processBrainDumpAction: (...args: unknown[]) => mockProcessAction(...args),
  saveBrainDumpNotesAction: (...args: unknown[]) => mockSaveAction(...args),
}));

const mockBrainDumpResult = {
  notes: [
    { title: 'Note 1', body: 'Body 1', tags: ['react'], actionItems: ['Do thing'] },
    { title: 'Note 2', body: 'Body 2', tags: ['typescript'], actionItems: [] },
  ],
  summary: 'Extracted 2 notes from your brain dump',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockProcessAction.mockResolvedValue({
    success: true,
    message: 'Extracted 2 notes',
    data: mockBrainDumpResult,
  });
  mockSaveAction.mockResolvedValue({
    success: true,
    message: 'Saved 2 notes from your brain dump!',
    data: { ids: ['id-1', 'id-2'] },
  });
});

describe('BrainDumpPage', () => {
  it('renders page title and description', () => {
    render(<BrainDumpPage />);
    expect(screen.getByText('Brain Dump')).toBeInTheDocument();
    expect(screen.getByText(/Paste your messy thoughts/)).toBeInTheDocument();
  });

  it('renders input phase by default', () => {
    render(<BrainDumpPage />);
    expect(screen.getByLabelText('Brain dump text')).toBeInTheDocument();
    expect(screen.getByText('Process with AI')).toBeInTheDocument();
  });

  it('shows processing state after submitting', async () => {
    // Make processing hang
    mockProcessAction.mockReturnValue(new Promise(() => {}));

    const user = userEvent.setup();
    render(<BrainDumpPage />);

    const textarea = screen.getByLabelText('Brain dump text');
    await user.type(textarea, 'a'.repeat(60));
    await user.click(screen.getByText('Process with AI'));

    expect(screen.getByTestId('processing-state')).toBeInTheDocument();
  });

  it('shows review phase after successful processing', async () => {
    const user = userEvent.setup();
    render(<BrainDumpPage />);

    const textarea = screen.getByLabelText('Brain dump text');
    await user.type(textarea, 'a'.repeat(60));
    await user.click(screen.getByText('Process with AI'));

    await waitFor(() => {
      expect(screen.getByText('Note 1')).toBeInTheDocument();
      expect(screen.getByText('Note 2')).toBeInTheDocument();
    });
  });

  it('shows note count in review phase', async () => {
    const user = userEvent.setup();
    render(<BrainDumpPage />);

    const textarea = screen.getByLabelText('Brain dump text');
    await user.type(textarea, 'a'.repeat(60));
    await user.click(screen.getByText('Process with AI'));

    await waitFor(() => {
      expect(screen.getByText(/notes from your brain dump/i)).toBeInTheDocument();
    });
  });

  it('shows error when processing fails', async () => {
    mockProcessAction.mockResolvedValue({
      success: false,
      message: 'AI is unavailable',
    });

    const user = userEvent.setup();
    render(<BrainDumpPage />);

    const textarea = screen.getByLabelText('Brain dump text');
    await user.type(textarea, 'a'.repeat(60));
    await user.click(screen.getByText('Process with AI'));

    await waitFor(() => {
      expect(screen.getByText('AI is unavailable')).toBeInTheDocument();
    });
  });

  it('toggles before/after view', async () => {
    const user = userEvent.setup();
    render(<BrainDumpPage />);

    const textarea = screen.getByLabelText('Brain dump text');
    await user.type(textarea, 'a'.repeat(60));
    await user.click(screen.getByText('Process with AI'));

    await waitFor(() => {
      expect(screen.getByText('Show Before/After')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Show Before/After'));
    expect(screen.getByTestId('before-after-view')).toBeInTheDocument();

    await user.click(screen.getByText('Hide Before/After'));
    expect(screen.queryByTestId('before-after-view')).not.toBeInTheDocument();
  });

  it('removes a note from review', async () => {
    const user = userEvent.setup();
    render(<BrainDumpPage />);

    const textarea = screen.getByLabelText('Brain dump text');
    await user.type(textarea, 'a'.repeat(60));
    await user.click(screen.getByText('Process with AI'));

    await waitFor(() => {
      expect(screen.getByText('Note 1')).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByLabelText('Remove note');
    await user.click(removeButtons[0]);

    expect(screen.queryByText('Note 1')).not.toBeInTheDocument();
    expect(screen.getByText('Note 2')).toBeInTheDocument();
  });

  it('saves notes and shows success message', async () => {
    const user = userEvent.setup();
    render(<BrainDumpPage />);

    const textarea = screen.getByLabelText('Brain dump text');
    await user.type(textarea, 'a'.repeat(60));
    await user.click(screen.getByText('Process with AI'));

    await waitFor(() => {
      expect(screen.getByText(/Save All/)).toBeInTheDocument();
    });

    await user.click(screen.getByText(/Save All/));

    await waitFor(() => {
      expect(screen.getByText(/Saved 2 notes/)).toBeInTheDocument();
    });
  });

  it('shows save error when save fails', async () => {
    mockSaveAction.mockResolvedValue({
      success: false,
      message: 'Database error',
    });

    const user = userEvent.setup();
    render(<BrainDumpPage />);

    const textarea = screen.getByLabelText('Brain dump text');
    await user.type(textarea, 'a'.repeat(60));
    await user.click(screen.getByText('Process with AI'));

    await waitFor(() => {
      expect(screen.getByText(/Save All/)).toBeInTheDocument();
    });

    await user.click(screen.getByText(/Save All/));

    await waitFor(() => {
      expect(screen.getByText('Database error')).toBeInTheDocument();
    });
  });

  it('allows starting over from review phase', async () => {
    const user = userEvent.setup();
    render(<BrainDumpPage />);

    const textarea = screen.getByLabelText('Brain dump text');
    await user.type(textarea, 'a'.repeat(60));
    await user.click(screen.getByText('Process with AI'));

    await waitFor(() => {
      expect(screen.getByText('Start Over')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Start Over'));

    expect(screen.getByLabelText('Brain dump text')).toBeInTheDocument();
  });

  it('shows Start Over button after successful save', async () => {
    const user = userEvent.setup();
    render(<BrainDumpPage />);

    const textarea = screen.getByLabelText('Brain dump text');
    await user.type(textarea, 'a'.repeat(60));
    await user.click(screen.getByText('Process with AI'));

    await waitFor(() => {
      expect(screen.getByText(/Save All/)).toBeInTheDocument();
    });

    await user.click(screen.getByText(/Save All/));

    await waitFor(() => {
      expect(screen.getByText('Process Another Brain Dump')).toBeInTheDocument();
    });
  });
});
