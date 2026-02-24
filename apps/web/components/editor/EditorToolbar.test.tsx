import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditorToolbar } from './EditorToolbar';

// Create a mock editor with chaining API
function createMockEditor(activeMarks: string[] = []) {
  const chainObj: any = {};
  const methods = [
    'focus',
    'toggleBold',
    'toggleItalic',
    'toggleStrike',
    'toggleCode',
    'toggleHeading',
    'toggleBulletList',
    'toggleOrderedList',
    'toggleTaskList',
    'toggleBlockquote',
    'toggleCodeBlock',
    'setLink',
    'unsetLink',
    'extendMarkRange',
    'run',
  ];
  methods.forEach((m) => {
    chainObj[m] = vi.fn(() => chainObj);
  });

  return {
    chain: vi.fn(() => chainObj),
    isActive: vi.fn((mark: string, _attrs?: any) => activeMarks.includes(mark)),
    getAttributes: vi.fn(() => ({ href: '' })),
    _chainObj: chainObj, // for assertions
  } as any;
}

describe('EditorToolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all toolbar buttons', () => {
      const editor = createMockEditor();
      render(<EditorToolbar editor={editor} />);

      expect(screen.getByTitle('Bold')).toBeInTheDocument();
      expect(screen.getByTitle('Italic')).toBeInTheDocument();
      expect(screen.getByTitle('Strikethrough')).toBeInTheDocument();
      expect(screen.getByTitle('Inline Code')).toBeInTheDocument();
      expect(screen.getByTitle('Heading 1')).toBeInTheDocument();
      expect(screen.getByTitle('Heading 2')).toBeInTheDocument();
      expect(screen.getByTitle('Heading 3')).toBeInTheDocument();
      expect(screen.getByTitle('Bullet List')).toBeInTheDocument();
      expect(screen.getByTitle('Ordered List')).toBeInTheDocument();
      expect(screen.getByTitle('Task List')).toBeInTheDocument();
      expect(screen.getByTitle('Blockquote')).toBeInTheDocument();
      expect(screen.getByTitle('Code Block')).toBeInTheDocument();
      expect(screen.getByTitle('Link')).toBeInTheDocument();
      expect(screen.getByTitle('Unlink')).toBeInTheDocument();
    });

    it('should render screen reader labels for all buttons', () => {
      const editor = createMockEditor();
      render(<EditorToolbar editor={editor} />);

      expect(screen.getByText('Bold')).toBeInTheDocument();
      expect(screen.getByText('Italic')).toBeInTheDocument();
      expect(screen.getByText('Strikethrough')).toBeInTheDocument();
    });

    it('should render dividers between button groups', () => {
      const editor = createMockEditor();
      const { container } = render(<EditorToolbar editor={editor} />);

      // Dividers have specific classes
      const dividers = container.querySelectorAll('.bg-border.w-px');
      expect(dividers.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Bold button', () => {
    it('should call chain().focus().toggleBold().run() when clicked', () => {
      const editor = createMockEditor();
      render(<EditorToolbar editor={editor} />);

      fireEvent.click(screen.getByTitle('Bold'));

      expect(editor.chain).toHaveBeenCalled();
      expect(editor._chainObj.focus).toHaveBeenCalled();
      expect(editor._chainObj.toggleBold).toHaveBeenCalled();
      expect(editor._chainObj.run).toHaveBeenCalled();
    });
  });

  describe('Italic button', () => {
    it('should call chain().focus().toggleItalic().run() when clicked', () => {
      const editor = createMockEditor();
      render(<EditorToolbar editor={editor} />);

      fireEvent.click(screen.getByTitle('Italic'));

      expect(editor.chain).toHaveBeenCalled();
      expect(editor._chainObj.focus).toHaveBeenCalled();
      expect(editor._chainObj.toggleItalic).toHaveBeenCalled();
      expect(editor._chainObj.run).toHaveBeenCalled();
    });
  });

  describe('Strikethrough button', () => {
    it('should call chain().focus().toggleStrike().run() when clicked', () => {
      const editor = createMockEditor();
      render(<EditorToolbar editor={editor} />);

      fireEvent.click(screen.getByTitle('Strikethrough'));

      expect(editor._chainObj.toggleStrike).toHaveBeenCalled();
      expect(editor._chainObj.run).toHaveBeenCalled();
    });
  });

  describe('Active mark styling', () => {
    it('should apply active class when bold is active', () => {
      const editor = createMockEditor(['bold']);
      render(<EditorToolbar editor={editor} />);

      const boldButton = screen.getByTitle('Bold');
      expect(boldButton.className).toContain('bg-accent');
      expect(boldButton.className).toContain('text-accent-foreground');
    });

    it('should not apply active class when bold is not active', () => {
      const editor = createMockEditor([]);
      render(<EditorToolbar editor={editor} />);

      const boldButton = screen.getByTitle('Bold');
      // The button's ghost variant has "hover:bg-accent" which contains "bg-accent" as substring.
      // Check that the class list does NOT contain a standalone "bg-accent" token.
      const classes = boldButton.className.split(/\s+/);
      expect(classes).not.toContain('bg-accent');
      expect(classes).not.toContain('text-accent-foreground');
    });

    it('should apply active class to multiple active marks', () => {
      const editor = createMockEditor(['bold', 'italic']);
      render(<EditorToolbar editor={editor} />);

      const boldButton = screen.getByTitle('Bold');
      const italicButton = screen.getByTitle('Italic');
      expect(boldButton.className).toContain('bg-accent');
      expect(italicButton.className).toContain('bg-accent');
    });
  });

  describe('Link button', () => {
    it('should prompt for URL and set link when URL is provided', () => {
      const editor = createMockEditor();
      vi.spyOn(window, 'prompt').mockReturnValue('https://example.com');

      render(<EditorToolbar editor={editor} />);
      fireEvent.click(screen.getByTitle('Link'));

      expect(window.prompt).toHaveBeenCalledWith('URL', '');
      expect(editor._chainObj.focus).toHaveBeenCalled();
      expect(editor._chainObj.extendMarkRange).toHaveBeenCalledWith('link');
      expect(editor._chainObj.setLink).toHaveBeenCalledWith({
        href: 'https://example.com',
      });
      expect(editor._chainObj.run).toHaveBeenCalled();
    });

    it('should unset link when prompt returns empty string', () => {
      const editor = createMockEditor();
      vi.spyOn(window, 'prompt').mockReturnValue('');

      render(<EditorToolbar editor={editor} />);
      fireEvent.click(screen.getByTitle('Link'));

      expect(editor._chainObj.unsetLink).toHaveBeenCalled();
      expect(editor._chainObj.run).toHaveBeenCalled();
    });

    it('should do nothing when prompt is cancelled (returns null)', () => {
      const editor = createMockEditor();
      vi.spyOn(window, 'prompt').mockReturnValue(null);

      render(<EditorToolbar editor={editor} />);
      fireEvent.click(screen.getByTitle('Link'));

      expect(editor._chainObj.setLink).not.toHaveBeenCalled();
      expect(editor._chainObj.unsetLink).not.toHaveBeenCalled();
    });
  });

  describe('Unlink button', () => {
    it('should be disabled when link is not active', () => {
      const editor = createMockEditor([]);
      render(<EditorToolbar editor={editor} />);

      const unlinkButton = screen.getByTitle('Unlink');
      expect(unlinkButton).toBeDisabled();
    });

    it('should be enabled when link is active', () => {
      const editor = createMockEditor(['link']);
      render(<EditorToolbar editor={editor} />);

      const unlinkButton = screen.getByTitle('Unlink');
      expect(unlinkButton).not.toBeDisabled();
    });
  });
});
