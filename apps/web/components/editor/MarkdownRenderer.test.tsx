import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock react-markdown since it's an ESM module that can cause issues in jsdom
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => (
    <div data-testid="react-markdown">{children}</div>
  ),
}));

vi.mock('remark-gfm', () => ({
  default: {},
}));

import { MarkdownRenderer } from './MarkdownRenderer';

describe('MarkdownRenderer', () => {
  it('should render markdown content', () => {
    render(<MarkdownRenderer content="Hello, world!" />);

    expect(screen.getByText('Hello, world!')).toBeInTheDocument();
  });

  it('should apply default prose CSS classes', () => {
    const { container } = render(
      <MarkdownRenderer content="Some content" />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('prose');
    expect(wrapper.className).toContain('prose-sm');
    expect(wrapper.className).toContain('dark:prose-invert');
    expect(wrapper.className).toContain('max-w-none');
  });

  it('should merge custom className with default classes', () => {
    const { container } = render(
      <MarkdownRenderer content="Some content" className="custom-class mt-4" />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('prose');
    expect(wrapper.className).toContain('custom-class');
    expect(wrapper.className).toContain('mt-4');
  });

  it('should handle empty content', () => {
    const { container } = render(<MarkdownRenderer content="" />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toBeInTheDocument();
    // The react-markdown mock renders children, empty string results in empty div
    expect(wrapper.textContent).toBe('');
  });

  it('should pass content to ReactMarkdown as children', () => {
    const markdownContent = '# Heading\n\nSome **bold** text with `code`';
    render(<MarkdownRenderer content={markdownContent} />);

    // Since we mock ReactMarkdown, it renders the raw string as children.
    // Use getByTestId to avoid multiline text matching issues with getByText.
    const markdownEl = screen.getByTestId('react-markdown');
    expect(markdownEl.textContent).toContain('# Heading');
    expect(markdownEl.textContent).toContain('Some **bold** text with `code`');
  });
});
