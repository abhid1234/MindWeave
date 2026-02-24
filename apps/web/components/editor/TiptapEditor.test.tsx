import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock ALL tiptap packages heavily since they don't work in jsdom
vi.mock('@tiptap/react', () => {
  const EditorContent = ({ editor }: any) =>
    editor ? (
      <div data-testid="editor-content">{editor.getHTML?.() || ''}</div>
    ) : null;
  return {
    useEditor: vi.fn(),
    EditorContent,
  };
});
vi.mock('@tiptap/starter-kit', () => ({
  default: { configure: () => ({}) },
}));
vi.mock('@tiptap/extension-placeholder', () => ({
  default: { configure: () => ({}) },
}));
vi.mock('@tiptap/extension-link', () => ({
  default: { configure: () => ({}) },
}));
vi.mock('@tiptap/extension-task-list', () => ({ default: {} }));
vi.mock('@tiptap/extension-task-item', () => ({
  default: { configure: () => ({}) },
}));
vi.mock('@tiptap/extension-code-block-lowlight', () => ({
  default: { configure: () => ({}) },
}));
vi.mock('tiptap-markdown', () => ({ Markdown: { configure: () => ({}) } }));
vi.mock('lowlight', () => ({
  common: {},
  createLowlight: () => ({}),
}));
vi.mock('./EditorToolbar', () => ({
  EditorToolbar: ({ editor }: any) =>
    editor ? <div data-testid="editor-toolbar">toolbar</div> : null,
}));

import { useEditor } from '@tiptap/react';
import { TiptapEditor } from './TiptapEditor';

const mockUseEditor = useEditor as ReturnType<typeof vi.fn>;

function createMockEditor(overrides: Record<string, any> = {}) {
  return {
    getHTML: vi.fn(() => '<p>test</p>'),
    commands: {
      setContent: vi.fn(),
    },
    setEditable: vi.fn(),
    storage: {
      markdown: {
        getMarkdown: vi.fn(() => 'test markdown'),
      },
    },
    ...overrides,
  };
}

describe('TiptapEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading state', () => {
    it('should show loading skeleton when editor is null', () => {
      mockUseEditor.mockReturnValue(null);

      render(<TiptapEditor />);

      expect(screen.getByText('Loading editor...')).toBeInTheDocument();
      expect(screen.queryByTestId('editor-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('editor-toolbar')).not.toBeInTheDocument();
    });

    it('should apply minHeight to loading skeleton container', () => {
      mockUseEditor.mockReturnValue(null);

      const { container } = render(<TiptapEditor minHeight="400px" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.style.minHeight).toBe('400px');
    });
  });

  describe('Editor rendered', () => {
    it('should render EditorContent and EditorToolbar when editor exists', () => {
      const mockEditor = createMockEditor();
      mockUseEditor.mockReturnValue(mockEditor);

      render(<TiptapEditor />);

      expect(screen.getByTestId('editor-content')).toBeInTheDocument();
      expect(screen.getByTestId('editor-toolbar')).toBeInTheDocument();
      expect(screen.queryByText('Loading editor...')).not.toBeInTheDocument();
    });

    it('should apply minHeight to the editor content wrapper', () => {
      const mockEditor = createMockEditor();
      mockUseEditor.mockReturnValue(mockEditor);

      const { container } = render(<TiptapEditor minHeight="300px" />);

      // The editor content is inside a div with minHeight style
      const contentWrapper = container.querySelector(
        '[style*="min-height"]'
      ) as HTMLElement;
      expect(contentWrapper).not.toBeNull();
      expect(contentWrapper.style.minHeight).toBe('300px');
    });

    it('should use default minHeight of 200px', () => {
      const mockEditor = createMockEditor();
      mockUseEditor.mockReturnValue(mockEditor);

      const { container } = render(<TiptapEditor />);

      const contentWrapper = container.querySelector(
        '[style*="min-height"]'
      ) as HTMLElement;
      expect(contentWrapper).not.toBeNull();
      expect(contentWrapper.style.minHeight).toBe('200px');
    });
  });

  describe('disabled prop', () => {
    it('should pass editable: false in useEditor config when disabled is true', () => {
      const mockEditor = createMockEditor();
      mockUseEditor.mockReturnValue(mockEditor);

      render(<TiptapEditor disabled={true} />);

      // useEditor is called with editable: false when disabled is true
      const callArg = mockUseEditor.mock.calls[0][0];
      expect(callArg.editable).toBe(false);
    });

    it('should pass editable: true in useEditor config when disabled is false', () => {
      const mockEditor = createMockEditor();
      mockUseEditor.mockReturnValue(mockEditor);

      render(<TiptapEditor disabled={false} />);

      const callArg = mockUseEditor.mock.calls[0][0];
      expect(callArg.editable).toBe(true);
    });

    it('should apply disabled styles when disabled is true', () => {
      const mockEditor = createMockEditor();
      mockUseEditor.mockReturnValue(mockEditor);

      const { container } = render(<TiptapEditor disabled={true} />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('cursor-not-allowed');
      expect(wrapper.className).toContain('opacity-50');
    });

    it('should not apply disabled styles when disabled is false', () => {
      const mockEditor = createMockEditor();
      mockUseEditor.mockReturnValue(mockEditor);

      const { container } = render(<TiptapEditor disabled={false} />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).not.toContain('cursor-not-allowed');
      expect(wrapper.className).not.toContain('opacity-50');
    });
  });

  describe('content and onChange', () => {
    it('should pass content to useEditor config', () => {
      const mockEditor = createMockEditor();
      mockUseEditor.mockReturnValue(mockEditor);

      render(<TiptapEditor content="# Hello World" />);

      const callArg = mockUseEditor.mock.calls[0][0];
      expect(callArg.content).toBe('# Hello World');
    });

    it('should pass default empty string content when not provided', () => {
      const mockEditor = createMockEditor();
      mockUseEditor.mockReturnValue(mockEditor);

      render(<TiptapEditor />);

      const callArg = mockUseEditor.mock.calls[0][0];
      expect(callArg.content).toBe('');
    });
  });
});
