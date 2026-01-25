import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { EditableTags } from './EditableTags';
import { updateContentTagsAction } from '@/app/actions/content';
import userEvent from '@testing-library/user-event';

vi.mock('@/app/actions/content', () => ({
  updateContentTagsAction: vi.fn(),
}));

// Mock TagInput component to simplify testing
vi.mock('@/components/ui/tag-input', () => ({
  TagInput: ({ tags, onChange, placeholder }: any) => (
    <div data-testid="tag-input">
      <input
        type="text"
        placeholder={placeholder}
        data-testid="tag-input-field"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.target as HTMLInputElement).value) {
            onChange([...tags, (e.target as HTMLInputElement).value]);
            (e.target as HTMLInputElement).value = '';
          }
        }}
      />
      {tags.map((tag: string) => (
        <span key={tag} data-testid={`tag-${tag}`}>
          {tag}
          <button
            aria-label="Remove"
            onClick={() => onChange(tags.filter((t: string) => t !== tag))}
          >
            X
          </button>
        </span>
      ))}
    </div>
  ),
}));

describe('EditableTags', () => {
  const defaultProps = {
    contentId: 'content-123',
    initialTags: ['tag1', 'tag2'],
    autoTags: ['auto1', 'auto2'],
    allTags: ['tag1', 'tag2', 'tag3', 'javascript', 'python'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Display mode', () => {
    it('should render user tags', () => {
      render(<EditableTags {...defaultProps} />);
      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
    });

    it('should render auto tags', () => {
      render(<EditableTags {...defaultProps} />);
      expect(screen.getByText('auto1')).toBeInTheDocument();
      expect(screen.getByText('auto2')).toBeInTheDocument();
    });

    it('should limit auto tags to 3', () => {
      render(
        <EditableTags
          {...defaultProps}
          autoTags={['auto1', 'auto2', 'auto3', 'auto4']}
        />
      );
      expect(screen.getByText('auto1')).toBeInTheDocument();
      expect(screen.getByText('auto2')).toBeInTheDocument();
      expect(screen.getByText('auto3')).toBeInTheDocument();
      expect(screen.queryByText('auto4')).not.toBeInTheDocument();
    });

    it('should show "No tags" when no user tags exist', () => {
      render(<EditableTags {...defaultProps} initialTags={[]} />);
      expect(screen.getByText('No tags')).toBeInTheDocument();
    });

    it('should show "Edit tags" button', () => {
      render(<EditableTags {...defaultProps} />);
      expect(screen.getByText('Edit tags')).toBeInTheDocument();
    });
  });

  describe('Edit mode', () => {
    it('should enter edit mode when "Edit tags" is clicked', async () => {
      const user = userEvent.setup();
      render(<EditableTags {...defaultProps} />);

      await user.click(screen.getByText('Edit tags'));

      expect(screen.getByTestId('tag-input')).toBeInTheDocument();
    });

    it('should show Save and Cancel buttons in edit mode', async () => {
      const user = userEvent.setup();
      render(<EditableTags {...defaultProps} />);

      await user.click(screen.getByText('Edit tags'));

      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should exit edit mode on Cancel', async () => {
      const user = userEvent.setup();
      render(<EditableTags {...defaultProps} />);

      await user.click(screen.getByText('Edit tags'));
      await user.click(screen.getByText('Cancel'));

      expect(screen.queryByTestId('tag-input')).not.toBeInTheDocument();
      expect(screen.getByText('Edit tags')).toBeInTheDocument();
    });

    it('should revert changes on Cancel', async () => {
      const user = userEvent.setup();
      render(<EditableTags {...defaultProps} />);

      await user.click(screen.getByText('Edit tags'));

      // Remove a tag (click the remove button on the first tag badge)
      const removeButtons = screen.getAllByLabelText('Remove');
      await user.click(removeButtons[0]);

      await user.click(screen.getByText('Cancel'));

      // Original tags should be restored
      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
    });
  });

  describe('Saving changes', () => {
    it('should call updateContentTagsAction on Save', async () => {
      const user = userEvent.setup();
      vi.mocked(updateContentTagsAction).mockResolvedValue({
        success: true,
        message: 'Tags updated successfully!',
      });

      render(<EditableTags {...defaultProps} />);

      await user.click(screen.getByText('Edit tags'));

      // Add a new tag
      const input = screen.getByTestId('tag-input-field');
      await user.type(input, 'newtag{Enter}');

      await user.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(updateContentTagsAction).toHaveBeenCalledWith({
          contentId: 'content-123',
          tags: ['tag1', 'tag2', 'newtag'],
        });
      });
    });

    it('should exit edit mode after successful save', async () => {
      const user = userEvent.setup();
      vi.mocked(updateContentTagsAction).mockResolvedValue({
        success: true,
        message: 'Tags updated successfully!',
      });

      render(<EditableTags {...defaultProps} />);

      await user.click(screen.getByText('Edit tags'));
      await user.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(screen.queryByTestId('tag-input')).not.toBeInTheDocument();
      });
    });

    it('should show error message on save failure', async () => {
      const user = userEvent.setup();
      vi.mocked(updateContentTagsAction).mockResolvedValue({
        success: false,
        message: 'Failed to save',
      });

      render(<EditableTags {...defaultProps} />);

      await user.click(screen.getByText('Edit tags'));
      await user.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(screen.getByText('Failed to save')).toBeInTheDocument();
      });
    });

    it('should revert changes on save failure', async () => {
      const user = userEvent.setup();
      vi.mocked(updateContentTagsAction).mockResolvedValue({
        success: false,
        message: 'Failed to save',
      });

      render(<EditableTags {...defaultProps} />);

      await user.click(screen.getByText('Edit tags'));

      // Remove a tag
      const removeButtons = screen.getAllByLabelText('Remove');
      await user.click(removeButtons[0]);

      await user.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(screen.getByText('tag1')).toBeInTheDocument();
        expect(screen.getByText('tag2')).toBeInTheDocument();
      });
    });

    it('should show "Saving..." while saving', async () => {
      const user = userEvent.setup();
      let resolveSave: (value: any) => void;
      const savePromise = new Promise((resolve) => {
        resolveSave = resolve;
      });

      vi.mocked(updateContentTagsAction).mockReturnValue(savePromise as any);

      render(<EditableTags {...defaultProps} />);

      await user.click(screen.getByText('Edit tags'));
      await user.click(screen.getByText('Save'));

      expect(screen.getByText('Saving...')).toBeInTheDocument();

      resolveSave!({ success: true, message: 'Saved' });
    });

    it('should disable buttons while saving', async () => {
      const user = userEvent.setup();
      let resolveSave: (value: any) => void;
      const savePromise = new Promise((resolve) => {
        resolveSave = resolve;
      });

      vi.mocked(updateContentTagsAction).mockReturnValue(savePromise as any);

      render(<EditableTags {...defaultProps} />);

      await user.click(screen.getByText('Edit tags'));
      await user.click(screen.getByText('Save'));

      expect(screen.getByText('Saving...')).toBeDisabled();
      expect(screen.getByText('Cancel')).toBeDisabled();

      resolveSave!({ success: true, message: 'Saved' });
    });
  });

  describe('Auto-save', () => {
    it('should auto-save after 1 second of inactivity', async () => {
      vi.mocked(updateContentTagsAction).mockResolvedValue({
        success: true,
        message: 'Tags updated successfully!',
      });

      render(<EditableTags {...defaultProps} />);

      await userEvent.click(screen.getByText('Edit tags'));

      const input = screen.getByTestId('tag-input-field');
      await userEvent.type(input, 'newtag{Enter}');

      // Wait for auto-save (1 second + buffer)
      await waitFor(
        () => {
          expect(updateContentTagsAction).toHaveBeenCalledWith({
            contentId: 'content-123',
            tags: ['tag1', 'tag2', 'newtag'],
          });
        },
        { timeout: 2000 }
      );
    });

    it('should not auto-save if tags unchanged', async () => {
      vi.mocked(updateContentTagsAction).mockResolvedValue({
        success: true,
        message: 'Tags updated successfully!',
      });

      render(<EditableTags {...defaultProps} />);

      await userEvent.click(screen.getByText('Edit tags'));

      // Wait a bit to ensure no auto-save happens
      await new Promise((resolve) => setTimeout(resolve, 1100));

      expect(updateContentTagsAction).not.toHaveBeenCalled();
    });
  });

  describe('Props', () => {
    it('should merge custom className', () => {
      const { container } = render(
        <EditableTags {...defaultProps} className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
