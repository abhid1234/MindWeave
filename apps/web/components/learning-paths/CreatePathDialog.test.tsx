import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreatePathDialog } from './CreatePathDialog';

vi.mock('@/app/actions/learning-paths', () => ({
  createLearningPathAction: vi.fn().mockResolvedValue({ success: true, pathId: 'new-id' }),
  updateLearningPathAction: vi.fn().mockResolvedValue({ success: true, message: 'Updated' }),
}));

const { createLearningPathAction, updateLearningPathAction } = await import(
  '@/app/actions/learning-paths'
);

describe('CreatePathDialog', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when closed', () => {
    render(<CreatePathDialog {...defaultProps} open={false} />);
    expect(screen.queryByText('Create Learning Path')).not.toBeInTheDocument();
  });

  it('should render create dialog title', () => {
    render(<CreatePathDialog {...defaultProps} />);
    expect(screen.getByText('Create Learning Path')).toBeInTheDocument();
  });

  it('should render edit dialog title when editPath is provided', () => {
    render(
      <CreatePathDialog
        {...defaultProps}
        editPath={{
          id: 'p1',
          title: 'Existing',
          description: null,
          estimatedMinutes: null,
          difficulty: null,
          isPublic: false,
        }}
      />
    );
    expect(screen.getByText('Edit Path')).toBeInTheDocument();
  });

  it('should render form fields', () => {
    render(<CreatePathDialog {...defaultProps} />);
    expect(screen.getByLabelText('Title *')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Difficulty')).toBeInTheDocument();
    expect(screen.getByLabelText('Est. Minutes')).toBeInTheDocument();
  });

  it('should call createLearningPathAction on submit', async () => {
    const user = userEvent.setup();
    render(<CreatePathDialog {...defaultProps} />);

    await user.type(screen.getByLabelText('Title *'), 'My Path');
    await user.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(createLearningPathAction).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'My Path' })
      );
    });
  });

  it('should call onSuccess and onClose after successful creation', async () => {
    const user = userEvent.setup();
    render(<CreatePathDialog {...defaultProps} />);

    await user.type(screen.getByLabelText('Title *'), 'My Path');
    await user.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it('should display error on failure', async () => {
    vi.mocked(createLearningPathAction).mockResolvedValueOnce({
      success: false,
      message: 'Title is required',
    });

    const user = userEvent.setup();
    render(<CreatePathDialog {...defaultProps} />);

    await user.type(screen.getByLabelText('Title *'), 'X');
    await user.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });
  });

  it('should call updateLearningPathAction when editing', async () => {
    const user = userEvent.setup();
    render(
      <CreatePathDialog
        {...defaultProps}
        editPath={{
          id: 'p1',
          title: 'Old Title',
          description: null,
          estimatedMinutes: null,
          difficulty: null,
          isPublic: false,
        }}
      />
    );

    const titleInput = screen.getByLabelText('Title *');
    await user.clear(titleInput);
    await user.type(titleInput, 'New Title');
    await user.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(updateLearningPathAction).toHaveBeenCalledWith(
        'p1',
        expect.objectContaining({ title: 'New Title' })
      );
    });
  });

  it('should close dialog when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<CreatePathDialog {...defaultProps} />);
    await user.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should disable Create button when title is empty', () => {
    render(<CreatePathDialog {...defaultProps} />);
    expect(screen.getByText('Create')).toBeDisabled();
  });
});
