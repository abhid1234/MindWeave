import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SuggestItemsPanel } from './SuggestItemsPanel';

vi.mock('@/app/actions/learning-paths', () => ({
  suggestPathItemsAction: vi.fn().mockResolvedValue({
    success: true,
    message: 'Success',
    data: [
      { id: 's1', title: 'Suggested Note 1', type: 'note' },
      { id: 's2', title: 'Suggested Link 1', type: 'link' },
    ],
  }),
  addItemToPathAction: vi.fn().mockResolvedValue({ success: true }),
}));

const { suggestPathItemsAction, addItemToPathAction } = await import(
  '@/app/actions/learning-paths'
);

describe('SuggestItemsPanel', () => {
  const defaultProps = {
    pathId: 'path-1',
    onItemAdded: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render suggest button', () => {
    render(<SuggestItemsPanel {...defaultProps} />);
    expect(screen.getByText('Get Suggestions')).toBeInTheDocument();
    expect(screen.getByText('AI Suggestions')).toBeInTheDocument();
  });

  it('should call suggestPathItemsAction on click', async () => {
    const user = userEvent.setup();
    render(<SuggestItemsPanel {...defaultProps} />);

    await user.click(screen.getByText('Get Suggestions'));

    await waitFor(() => {
      expect(suggestPathItemsAction).toHaveBeenCalledWith('path-1');
    });
  });

  it('should display suggestions after loading', async () => {
    const user = userEvent.setup();
    render(<SuggestItemsPanel {...defaultProps} />);

    await user.click(screen.getByText('Get Suggestions'));

    await waitFor(() => {
      expect(screen.getByText('Suggested Note 1')).toBeInTheDocument();
      expect(screen.getByText('Suggested Link 1')).toBeInTheDocument();
    });
  });

  it('should add suggested item when plus button is clicked', async () => {
    const user = userEvent.setup();
    render(<SuggestItemsPanel {...defaultProps} />);

    await user.click(screen.getByText('Get Suggestions'));

    await waitFor(() => {
      expect(screen.getByText('Suggested Note 1')).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('Add Suggested Note 1'));

    await waitFor(() => {
      expect(addItemToPathAction).toHaveBeenCalledWith({
        pathId: 'path-1',
        contentId: 's1',
        isOptional: false,
      });
      expect(defaultProps.onItemAdded).toHaveBeenCalled();
    });
  });

  it('should show message when no suggestions', async () => {
    vi.mocked(suggestPathItemsAction).mockResolvedValueOnce({
      success: true,
      message: 'Add some items first to get suggestions',
      data: [],
    });

    const user = userEvent.setup();
    render(<SuggestItemsPanel {...defaultProps} />);

    await user.click(screen.getByText('Get Suggestions'));

    await waitFor(() => {
      expect(screen.getByText('Add some items first to get suggestions')).toBeInTheDocument();
    });
  });

  it('should show error message on failure', async () => {
    vi.mocked(suggestPathItemsAction).mockResolvedValueOnce({
      success: false,
      message: 'Failed to get suggestions',
    });

    const user = userEvent.setup();
    render(<SuggestItemsPanel {...defaultProps} />);

    await user.click(screen.getByText('Get Suggestions'));

    await waitFor(() => {
      expect(screen.getByText('Failed to get suggestions')).toBeInTheDocument();
    });
  });
});
