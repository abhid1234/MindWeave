import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContentRefineDialog, type ContentRefineDialogProps } from './ContentRefineDialog';

const mockRefineContentAction = vi.fn();
const mockUpdateContentAction = vi.fn();
const mockToast = vi.fn();

vi.mock('@/app/actions/refine', () => ({
  refineContentAction: (...args: unknown[]) => mockRefineContentAction(...args),
}));

vi.mock('@/app/actions/content', () => ({
  updateContentAction: (...args: unknown[]) => mockUpdateContentAction(...args),
}));

vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({ addToast: mockToast }),
}));

const defaultProps: ContentRefineDialogProps = {
  contentId: 'test-content-id',
  contentBody: 'This is messy original text that needs refining.',
  open: true,
  onOpenChange: vi.fn(),
  onRefined: vi.fn(),
};

describe('ContentRefineDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dialog when open', () => {
    render(<ContentRefineDialog {...defaultProps} />);

    expect(screen.getByText('Refine with AI')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ContentRefineDialog {...defaultProps} open={false} />);

    expect(screen.queryByText('Refine with AI')).not.toBeInTheDocument();
  });

  it('renders all four tone options', () => {
    render(<ContentRefineDialog {...defaultProps} />);

    expect(screen.getByText('Professional')).toBeInTheDocument();
    expect(screen.getByText('Casual')).toBeInTheDocument();
    expect(screen.getByText('Academic')).toBeInTheDocument();
    expect(screen.getByText('Concise')).toBeInTheDocument();
  });

  it('renders tone descriptions', () => {
    render(<ContentRefineDialog {...defaultProps} />);

    expect(screen.getByText('Clear & polished')).toBeInTheDocument();
    expect(screen.getByText('Friendly & conversational')).toBeInTheDocument();
    expect(screen.getByText('Formal & precise')).toBeInTheDocument();
    expect(screen.getByText('Brief & direct')).toBeInTheDocument();
  });

  it('renders custom instruction input', () => {
    render(<ContentRefineDialog {...defaultProps} />);

    expect(screen.getByLabelText(/custom instruction/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/bullet points/i)).toBeInTheDocument();
  });

  it('shows original text preview', () => {
    render(<ContentRefineDialog {...defaultProps} />);

    expect(screen.getByText(/messy original text/i)).toBeInTheDocument();
  });

  it('truncates long original text preview at 500 chars', () => {
    const longBody = 'a'.repeat(600);
    render(<ContentRefineDialog {...defaultProps} contentBody={longBody} />);

    expect(screen.getByText(/\.\.\.$/)).toBeInTheDocument();
  });

  it('shows refine button', () => {
    render(<ContentRefineDialog {...defaultProps} />);

    expect(screen.getByTestId('refine-button')).toBeInTheDocument();
    expect(screen.getByText('Refine')).toBeInTheDocument();
  });

  it('allows selecting different tones', async () => {
    const user = userEvent.setup();
    render(<ContentRefineDialog {...defaultProps} />);

    const casualButton = screen.getByTestId('tone-casual');
    await user.click(casualButton);

    // Casual should be selected (active styling applied via classes)
    expect(casualButton.className).toContain('border-primary');
  });

  it('calls refineContentAction with correct params on refine click', async () => {
    mockRefineContentAction.mockResolvedValueOnce({
      success: true,
      refined: 'Polished text',
      original: 'This is messy original text that needs refining.',
    });

    const user = userEvent.setup();
    render(<ContentRefineDialog {...defaultProps} />);

    await user.click(screen.getByTestId('refine-button'));

    expect(mockRefineContentAction).toHaveBeenCalledWith({
      contentId: 'test-content-id',
      tone: 'professional',
      customInstruction: undefined,
    });
  });

  it('passes custom instruction to refine action', async () => {
    mockRefineContentAction.mockResolvedValueOnce({
      success: true,
      refined: 'Refined with bullets',
    });

    const user = userEvent.setup();
    render(<ContentRefineDialog {...defaultProps} />);

    await user.type(screen.getByLabelText(/custom instruction/i), 'Use bullet points');
    await user.click(screen.getByTestId('refine-button'));

    expect(mockRefineContentAction).toHaveBeenCalledWith({
      contentId: 'test-content-id',
      tone: 'professional',
      customInstruction: 'Use bullet points',
    });
  });

  it('shows refined text after successful refinement', async () => {
    mockRefineContentAction.mockResolvedValueOnce({
      success: true,
      refined: 'This is beautifully refined text.',
    });

    const user = userEvent.setup();
    render(<ContentRefineDialog {...defaultProps} />);

    await user.click(screen.getByTestId('refine-button'));

    await waitFor(() => {
      expect(screen.getByText('This is beautifully refined text.')).toBeInTheDocument();
    });
  });

  it('shows preview phase with Apply, Try Again, and Discard buttons', async () => {
    mockRefineContentAction.mockResolvedValueOnce({
      success: true,
      refined: 'Refined text here.',
    });

    const user = userEvent.setup();
    render(<ContentRefineDialog {...defaultProps} />);

    await user.click(screen.getByTestId('refine-button'));

    await waitFor(() => {
      expect(screen.getByTestId('apply-button')).toBeInTheDocument();
      expect(screen.getByTestId('try-again-button')).toBeInTheDocument();
      expect(screen.getByTestId('discard-button')).toBeInTheDocument();
    });
  });

  it('shows Refined and Original tabs in preview phase', async () => {
    mockRefineContentAction.mockResolvedValueOnce({
      success: true,
      refined: 'Refined version.',
    });

    const user = userEvent.setup();
    render(<ContentRefineDialog {...defaultProps} />);

    await user.click(screen.getByTestId('refine-button'));

    await waitFor(() => {
      expect(screen.getByTestId('show-refined-tab')).toBeInTheDocument();
      expect(screen.getByTestId('show-original-tab')).toBeInTheDocument();
    });
  });

  it('toggles between refined and original text', async () => {
    mockRefineContentAction.mockResolvedValueOnce({
      success: true,
      refined: 'Refined version of the text.',
    });

    const user = userEvent.setup();
    render(<ContentRefineDialog {...defaultProps} />);

    await user.click(screen.getByTestId('refine-button'));

    await waitFor(() => {
      expect(screen.getByText('Refined version of the text.')).toBeInTheDocument();
    });

    // Switch to original
    await user.click(screen.getByTestId('show-original-tab'));
    expect(screen.getByText(defaultProps.contentBody)).toBeInTheDocument();

    // Switch back to refined
    await user.click(screen.getByTestId('show-refined-tab'));
    expect(screen.getByText('Refined version of the text.')).toBeInTheDocument();
  });

  it('calls updateContentAction on Apply click', async () => {
    mockRefineContentAction.mockResolvedValueOnce({
      success: true,
      refined: 'Applied refined text.',
    });
    mockUpdateContentAction.mockResolvedValueOnce({ success: true });

    const user = userEvent.setup();
    render(<ContentRefineDialog {...defaultProps} />);

    await user.click(screen.getByTestId('refine-button'));

    await waitFor(() => {
      expect(screen.getByTestId('apply-button')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('apply-button'));

    await waitFor(() => {
      expect(mockUpdateContentAction).toHaveBeenCalledWith({
        contentId: 'test-content-id',
        body: 'Applied refined text.',
      });
    });
  });

  it('calls onRefined and shows success toast after apply', async () => {
    mockRefineContentAction.mockResolvedValueOnce({
      success: true,
      refined: 'Applied text.',
    });
    mockUpdateContentAction.mockResolvedValueOnce({ success: true });

    const user = userEvent.setup();
    const onRefined = vi.fn();
    render(<ContentRefineDialog {...defaultProps} onRefined={onRefined} />);

    await user.click(screen.getByTestId('refine-button'));

    await waitFor(() => {
      expect(screen.getByTestId('apply-button')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('apply-button'));

    await waitFor(() => {
      expect(onRefined).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Content refined' })
      );
    });
  });

  it('goes back to options phase on Discard click', async () => {
    mockRefineContentAction.mockResolvedValueOnce({
      success: true,
      refined: 'Refined text.',
    });

    const user = userEvent.setup();
    render(<ContentRefineDialog {...defaultProps} />);

    await user.click(screen.getByTestId('refine-button'));

    await waitFor(() => {
      expect(screen.getByTestId('discard-button')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('discard-button'));

    // Should show the options phase again
    expect(screen.getByTestId('refine-button')).toBeInTheDocument();
    expect(screen.getByText('Professional')).toBeInTheDocument();
  });

  it('shows error toast when refinement fails', async () => {
    mockRefineContentAction.mockResolvedValueOnce({
      success: false,
      message: 'Rate limit exceeded',
    });

    const user = userEvent.setup();
    render(<ContentRefineDialog {...defaultProps} />);

    await user.click(screen.getByTestId('refine-button'));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Refinement failed',
          variant: 'error',
        })
      );
    });
  });

  it('shows error toast when apply fails', async () => {
    mockRefineContentAction.mockResolvedValueOnce({
      success: true,
      refined: 'Text.',
    });
    mockUpdateContentAction.mockResolvedValueOnce({
      success: false,
      message: 'Update failed',
    });

    const user = userEvent.setup();
    render(<ContentRefineDialog {...defaultProps} />);

    await user.click(screen.getByTestId('refine-button'));

    await waitFor(() => {
      expect(screen.getByTestId('apply-button')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('apply-button'));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Failed to apply',
          variant: 'error',
        })
      );
    });
  });

  it('shows character count for custom instruction', () => {
    render(<ContentRefineDialog {...defaultProps} />);

    expect(screen.getByText('0/200')).toBeInTheDocument();
  });

  it('updates character count as user types', async () => {
    const user = userEvent.setup();
    render(<ContentRefineDialog {...defaultProps} />);

    await user.type(screen.getByLabelText(/custom instruction/i), 'Hello');

    expect(screen.getByText('5/200')).toBeInTheDocument();
  });
});
