import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContentPickerDialog } from './ContentPickerDialog';

vi.mock('@/app/actions/learning-paths', () => ({
  getPathContentPickerAction: vi.fn().mockResolvedValue({
    success: true,
    data: [
      { id: 'c1', title: 'React Basics', type: 'note' },
      { id: 'c2', title: 'CSS Guide', type: 'link' },
    ],
  }),
  addItemToPathAction: vi.fn().mockResolvedValue({ success: true }),
}));

const { getPathContentPickerAction, addItemToPathAction } = await import(
  '@/app/actions/learning-paths'
);

describe('ContentPickerDialog', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    pathId: 'path-1',
    onItemAdded: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when closed', () => {
    render(<ContentPickerDialog {...defaultProps} open={false} />);
    expect(screen.queryByText('Add Content')).not.toBeInTheDocument();
  });

  it('should render dialog with search input', () => {
    render(<ContentPickerDialog {...defaultProps} />);
    expect(screen.getByText('Add Content')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search your content...')).toBeInTheDocument();
  });

  it('should search content on typing', async () => {
    const user = userEvent.setup();
    render(<ContentPickerDialog {...defaultProps} />);

    await user.type(screen.getByPlaceholderText('Search your content...'), 'React');

    await waitFor(() => {
      expect(getPathContentPickerAction).toHaveBeenCalledWith('path-1', 'React');
    });
  });

  it('should display search results', async () => {
    const user = userEvent.setup();
    render(<ContentPickerDialog {...defaultProps} />);

    await user.type(screen.getByPlaceholderText('Search your content...'), 'test');

    await waitFor(() => {
      expect(screen.getByText('React Basics')).toBeInTheDocument();
      expect(screen.getByText('CSS Guide')).toBeInTheDocument();
    });
  });

  it('should add item when plus button is clicked', async () => {
    const user = userEvent.setup();
    render(<ContentPickerDialog {...defaultProps} />);

    await user.type(screen.getByPlaceholderText('Search your content...'), 'test');

    await waitFor(() => {
      expect(screen.getByText('React Basics')).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('Add React Basics'));

    await waitFor(() => {
      expect(addItemToPathAction).toHaveBeenCalledWith({
        pathId: 'path-1',
        contentId: 'c1',
        isOptional: false,
      });
      expect(defaultProps.onItemAdded).toHaveBeenCalled();
    });
  });

  it('should close dialog on close button click', async () => {
    const user = userEvent.setup();
    render(<ContentPickerDialog {...defaultProps} />);
    await user.click(screen.getByLabelText('Close dialog'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should show no results message', async () => {
    // Mock returns empty for all calls in this test
    vi.mocked(getPathContentPickerAction).mockResolvedValue({
      success: true,
      message: 'Success',
      data: [],
    });

    const user = userEvent.setup();
    render(<ContentPickerDialog {...defaultProps} />);

    await user.type(screen.getByPlaceholderText('Search your content...'), 'xyz');

    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });
  });
});
