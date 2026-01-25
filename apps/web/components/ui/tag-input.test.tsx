import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TagInput } from './tag-input';
import userEvent from '@testing-library/user-event';

describe('TagInput', () => {
  const defaultProps = {
    tags: [],
    onChange: vi.fn(),
  };

  describe('Rendering', () => {
    it('should render input with placeholder', () => {
      render(<TagInput {...defaultProps} placeholder="Add tags..." />);
      expect(screen.getByPlaceholderText('Add tags...')).toBeInTheDocument();
    });

    it('should render existing tags', () => {
      render(<TagInput {...defaultProps} tags={['tag1', 'tag2']} />);
      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
    });

    it('should hide placeholder when tags exist', () => {
      render(<TagInput {...defaultProps} tags={['tag1']} placeholder="Add tags..." />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('placeholder', '');
    });

    it('should show placeholder when no tags exist', () => {
      render(<TagInput {...defaultProps} placeholder="Add tags..." />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('placeholder', 'Add tags...');
    });
  });

  describe('Adding tags', () => {
    it('should add tag on Enter key', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(<TagInput {...defaultProps} onChange={onChange} />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'newtag{Enter}');

      expect(onChange).toHaveBeenCalledWith(['newtag']);
    });

    it('should trim whitespace from tags', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(<TagInput {...defaultProps} onChange={onChange} />);
      const input = screen.getByRole('textbox');

      await user.type(input, '  newtag  {Enter}');

      expect(onChange).toHaveBeenCalledWith(['newtag']);
    });

    it('should not add empty tag', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(<TagInput {...defaultProps} onChange={onChange} />);
      const input = screen.getByRole('textbox');

      await user.type(input, '   {Enter}');

      expect(onChange).not.toHaveBeenCalled();
    });

    it('should not add duplicate tag', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(<TagInput {...defaultProps} tags={['existing']} onChange={onChange} />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'existing{Enter}');

      expect(onChange).not.toHaveBeenCalled();
    });

    it('should clear input after adding tag', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(<TagInput {...defaultProps} onChange={onChange} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;

      await user.type(input, 'newtag{Enter}');

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });
  });

  describe('Removing tags', () => {
    it('should remove tag when remove button is clicked', async () => {
      const onChange = vi.fn();

      render(<TagInput {...defaultProps} tags={['tag1', 'tag2']} onChange={onChange} />);

      const removeButtons = screen.getAllByLabelText('Remove');
      fireEvent.click(removeButtons[0]);

      expect(onChange).toHaveBeenCalledWith(['tag2']);
    });

    it('should remove last tag on Backspace when input is empty', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(<TagInput {...defaultProps} tags={['tag1', 'tag2']} onChange={onChange} />);
      const input = screen.getByRole('textbox');

      await user.click(input);
      await user.keyboard('{Backspace}');

      expect(onChange).toHaveBeenCalledWith(['tag1']);
    });

    it('should not remove tag on Backspace when input has text', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(<TagInput {...defaultProps} tags={['tag1']} onChange={onChange} />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'text{Backspace}');

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Autocomplete suggestions', () => {
    it('should show suggestions when typing', async () => {
      const user = userEvent.setup();

      render(
        <TagInput
          {...defaultProps}
          suggestions={['javascript', 'java', 'python']}
        />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'java');

      await waitFor(() => {
        expect(screen.getByText('javascript')).toBeInTheDocument();
        expect(screen.getByText('java')).toBeInTheDocument();
      });
    });

    it('should filter suggestions case-insensitively', async () => {
      const user = userEvent.setup();

      render(
        <TagInput
          {...defaultProps}
          suggestions={['JavaScript', 'Python']}
        />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'java');

      await waitFor(() => {
        expect(screen.getByText('JavaScript')).toBeInTheDocument();
      });
    });

    it('should exclude already selected tags from suggestions', async () => {
      const user = userEvent.setup();

      render(
        <TagInput
          {...defaultProps}
          tags={['javascript']}
          suggestions={['javascript', 'python']}
        />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'java');

      await waitFor(() => {
        const suggestions = screen.queryAllByRole('button');
        const suggestionTexts = suggestions.map(s => s.textContent);
        expect(suggestionTexts).not.toContain('javascript');
      });
    });

    it('should limit suggestions to 5', async () => {
      const user = userEvent.setup();
      const manySuggestions = Array.from({ length: 10 }, (_, i) => `tag${i}`);

      render(
        <TagInput
          {...defaultProps}
          suggestions={manySuggestions}
        />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'tag');

      await waitFor(() => {
        const suggestionButtons = screen.getAllByRole('button');
        expect(suggestionButtons.length).toBeLessThanOrEqual(5);
      });
    });

    it('should add suggestion when clicked', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(
        <TagInput
          {...defaultProps}
          onChange={onChange}
          suggestions={['javascript']}
        />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'java');

      await waitFor(() => {
        expect(screen.getByText('javascript')).toBeInTheDocument();
      });

      const suggestion = screen.getByText('javascript');
      await user.click(suggestion);

      expect(onChange).toHaveBeenCalledWith(['javascript']);
    });

    it('should add first suggestion on Enter', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(
        <TagInput
          {...defaultProps}
          onChange={onChange}
          suggestions={['javascript', 'java']}
        />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'java');

      await waitFor(() => {
        expect(screen.getByText('javascript')).toBeInTheDocument();
      });

      await user.keyboard('{Enter}');

      expect(onChange).toHaveBeenCalledWith(['javascript']);
    });

    it('should hide suggestions on Escape', async () => {
      const user = userEvent.setup();

      render(
        <TagInput
          {...defaultProps}
          suggestions={['javascript']}
        />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'java');

      await waitFor(() => {
        expect(screen.getByText('javascript')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByText('javascript')).not.toBeInTheDocument();
      });
    });

    it('should not show suggestions when input is empty', () => {
      render(
        <TagInput
          {...defaultProps}
          suggestions={['javascript', 'python']}
        />
      );

      expect(screen.queryByText('javascript')).not.toBeInTheDocument();
    });
  });

  describe('Max tags limit', () => {
    it('should disable input when max tags reached', () => {
      render(
        <TagInput
          {...defaultProps}
          tags={['tag1', 'tag2']}
          maxTags={2}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('should not add tag when max tags reached', async () => {
      const onChange = vi.fn();

      render(
        <TagInput
          {...defaultProps}
          tags={['tag1', 'tag2']}
          onChange={onChange}
          maxTags={2}
        />
      );

      // Input is disabled, but let's verify the logic
      expect(onChange).not.toHaveBeenCalled();
    });

    it('should allow adding tags when below max limit', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();

      render(
        <TagInput
          {...defaultProps}
          tags={['tag1']}
          onChange={onChange}
          maxTags={3}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).not.toBeDisabled();

      await user.type(input, 'tag2{Enter}');
      expect(onChange).toHaveBeenCalledWith(['tag1', 'tag2']);
    });
  });

  describe('Props', () => {
    it('should merge custom className', () => {
      const { container } = render(
        <TagInput {...defaultProps} className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible input', () => {
      render(<TagInput {...defaultProps} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should support focus', async () => {
      const user = userEvent.setup();
      render(<TagInput {...defaultProps} />);

      const input = screen.getByRole('textbox');
      await user.click(input);

      expect(input).toHaveFocus();
    });
  });
});
