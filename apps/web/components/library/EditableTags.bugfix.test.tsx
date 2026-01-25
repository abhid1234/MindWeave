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

describe('EditableTags - Bug Fixes', () => {
  const defaultProps = {
    contentId: 'content-123',
    initialTags: ['tag1', 'tag2'],
    autoTags: ['auto1', 'auto2'],
    allTags: ['tag1', 'tag2', 'tag3', 'javascript', 'python'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Bug Fix: Infinite Loop in Auto-Save', () => {
    it('should not trigger infinite re-renders when tags change', async () => {
      const user = userEvent.setup();
      const mockUpdate = vi.fn().mockResolvedValue({
        success: true,
        message: 'Tags updated successfully!',
      });
      vi.mocked(updateContentTagsAction).mockImplementation(mockUpdate);

      render(<EditableTags {...defaultProps} />);

      // Enter edit mode
      await user.click(screen.getByText('Edit tags'));

      // Add a new tag
      const input = screen.getByTestId('tag-input-field');
      await user.type(input, 'newtag{Enter}');

      // Wait for auto-save (1 second + buffer)
      await waitFor(
        () => {
          expect(mockUpdate).toHaveBeenCalledTimes(1);
        },
        { timeout: 2000 }
      );

      // Verify it was called only once, not multiple times (no infinite loop)
      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledWith({
        contentId: 'content-123',
        tags: ['tag1', 'tag2', 'newtag'],
      });
    });

    it('should not call auto-save multiple times for same tag change', async () => {
      const user = userEvent.setup();
      const mockUpdate = vi.fn().mockResolvedValue({
        success: true,
        message: 'Tags updated successfully!',
      });
      vi.mocked(updateContentTagsAction).mockImplementation(mockUpdate);

      render(<EditableTags {...defaultProps} />);

      await user.click(screen.getByText('Edit tags'));

      // Add tag
      const input = screen.getByTestId('tag-input-field');
      await user.type(input, 'testtag{Enter}');

      // Wait 2 seconds to ensure auto-save completes
      await waitFor(
        () => {
          expect(mockUpdate).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );

      // Should be called exactly once
      expect(mockUpdate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Bug Fix: Stale State After Save', () => {
    it('should update local state when initialTags prop changes', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({
        success: true,
        message: 'Tags updated successfully!',
      });
      vi.mocked(updateContentTagsAction).mockImplementation(mockUpdate);

      const { rerender } = render(<EditableTags {...defaultProps} />);

      // Verify initial tags are displayed
      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();

      // Simulate server updating tags (like after revalidatePath)
      rerender(
        <EditableTags
          {...defaultProps}
          initialTags={['tag1', 'tag2', 'newtag']}
        />
      );

      // New tag should be visible
      expect(screen.getByText('newtag')).toBeInTheDocument();
    });

    it('should show updated tags when re-entering edit mode after prop change', async () => {
      const user = userEvent.setup();

      const { rerender } = render(<EditableTags {...defaultProps} />);

      // Enter edit mode
      await user.click(screen.getByText('Edit tags'));

      // Exit edit mode
      await user.click(screen.getByText('Cancel'));

      // Simulate server updating tags
      rerender(
        <EditableTags
          {...defaultProps}
          initialTags={['tag1', 'tag2', 'updated']}
        />
      );

      // Re-enter edit mode
      await user.click(screen.getByText('Edit tags'));

      // Should show updated tags
      expect(screen.getByTestId('tag-updated')).toBeInTheDocument();
    });

    it('should reflect server changes after successful save', async () => {
      const user = userEvent.setup();
      const mockUpdate = vi.fn().mockResolvedValue({
        success: true,
        message: 'Tags updated successfully!',
      });
      vi.mocked(updateContentTagsAction).mockImplementation(mockUpdate);

      const { rerender } = render(<EditableTags {...defaultProps} />);

      // Enter edit mode and add tag
      await user.click(screen.getByText('Edit tags'));
      const input = screen.getByTestId('tag-input-field');
      await user.type(input, 'saved{Enter}');

      // Save manually
      await user.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalled();
      });

      // Simulate Next.js revalidation updating the props
      rerender(
        <EditableTags
          {...defaultProps}
          initialTags={['tag1', 'tag2', 'saved']}
        />
      );

      // Component should show the saved tag
      expect(screen.getByText('saved')).toBeInTheDocument();

      // Re-enter edit mode
      await user.click(screen.getByText('Edit tags'));

      // Should still show the saved tag (not stale data)
      expect(screen.getByTestId('tag-saved')).toBeInTheDocument();
    });
  });

  describe('Bug Fix: Edit Mode State Management', () => {
    it('should maintain correct state after multiple edit/save cycles', async () => {
      const user = userEvent.setup();
      const mockUpdate = vi.fn().mockResolvedValue({
        success: true,
        message: 'Tags updated successfully!',
      });
      vi.mocked(updateContentTagsAction).mockImplementation(mockUpdate);

      const { rerender } = render(<EditableTags {...defaultProps} />);

      // First edit cycle
      await user.click(screen.getByText('Edit tags'));
      let input = screen.getByTestId('tag-input-field');
      await user.type(input, 'first{Enter}');
      await user.click(screen.getByText('Save'));

      await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1));

      // Simulate server update
      rerender(
        <EditableTags
          {...defaultProps}
          initialTags={['tag1', 'tag2', 'first']}
        />
      );

      // Second edit cycle - need to get fresh input reference after rerender
      await user.click(screen.getByText('Edit tags'));
      input = screen.getByTestId('tag-input-field');
      await user.type(input, 'second{Enter}');
      await user.click(screen.getByText('Save'));

      await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(2));

      // Should have called with correct tags both times
      expect(mockUpdate).toHaveBeenNthCalledWith(1, {
        contentId: 'content-123',
        tags: ['tag1', 'tag2', 'first'],
      });
      expect(mockUpdate).toHaveBeenNthCalledWith(2, {
        contentId: 'content-123',
        tags: ['tag1', 'tag2', 'first', 'second'],
      });
    });

    it('should cancel correctly and revert to latest initialTags', async () => {
      const user = userEvent.setup();

      const { rerender } = render(<EditableTags {...defaultProps} />);

      // Simulate server having updated tags
      rerender(
        <EditableTags
          {...defaultProps}
          initialTags={['tag1', 'tag2', 'server-tag']}
        />
      );

      // Enter edit mode
      await user.click(screen.getByText('Edit tags'));

      // Add a tag locally
      const input = screen.getByTestId('tag-input-field');
      await user.type(input, 'local{Enter}');

      // Cancel
      await user.click(screen.getByText('Cancel'));

      // Should revert to server tags, not show local tag
      expect(screen.getByText('server-tag')).toBeInTheDocument();
      expect(screen.queryByText('local')).not.toBeInTheDocument();
    });
  });

  describe('Bug Fix: Auto-Save Timing', () => {
    it('should debounce auto-save correctly without multiple calls', async () => {
      const user = userEvent.setup();
      const mockUpdate = vi.fn().mockResolvedValue({
        success: true,
        message: 'Tags updated successfully!',
      });
      vi.mocked(updateContentTagsAction).mockImplementation(mockUpdate);

      render(<EditableTags {...defaultProps} />);

      await user.click(screen.getByText('Edit tags'));

      const input = screen.getByTestId('tag-input-field');

      // Add multiple tags quickly
      await user.type(input, 'tag3{Enter}');
      await user.type(input, 'tag4{Enter}');
      await user.type(input, 'tag5{Enter}');

      // Wait for auto-save (should only happen once after last change)
      await waitFor(
        () => {
          expect(mockUpdate).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );

      // Should be called only once with all tags
      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledWith({
        contentId: 'content-123',
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
      });
    });
  });
});
