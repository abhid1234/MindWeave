import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmbedCodeGenerator } from './EmbedCodeGenerator';

// Mock clipboard API
const mockWriteText = vi.fn().mockResolvedValue(undefined);
Object.assign(navigator, {
  clipboard: { writeText: mockWriteText },
});

describe('EmbedCodeGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render three tabs', () => {
    render(<EmbedCodeGenerator shareId="abc123" contentTitle="Test Note" />);
    expect(screen.getByText('iFrame')).toBeInTheDocument();
    expect(screen.getByText('Markdown')).toBeInTheDocument();
    expect(screen.getByText('HTML')).toBeInTheDocument();
  });

  it('should show iframe code by default', () => {
    render(<EmbedCodeGenerator shareId="abc123" contentTitle="Test Note" />);
    const pre = screen.getByText(/\/embed\/abc123/);
    expect(pre).toBeInTheDocument();
    expect(pre.textContent).toContain('iframe');
  });

  it('should switch to markdown tab', () => {
    render(<EmbedCodeGenerator shareId="abc123" contentTitle="Test Note" />);
    fireEvent.click(screen.getByText('Markdown'));
    const pre = screen.getByText(/\[!\[Test Note\]/);
    expect(pre).toBeInTheDocument();
  });

  it('should switch to HTML tab', () => {
    render(<EmbedCodeGenerator shareId="abc123" contentTitle="Test Note" />);
    fireEvent.click(screen.getByText('HTML'));
    const pre = screen.getByText(/<a href=/);
    expect(pre).toBeInTheDocument();
  });

  it('should copy code to clipboard', async () => {
    render(<EmbedCodeGenerator shareId="abc123" contentTitle="Test Note" />);
    const copyButtons = screen.getAllByRole('button');
    // The copy button is the last one (inside the code block)
    const copyButton = copyButtons[copyButtons.length - 1];
    fireEvent.click(copyButton);
    expect(mockWriteText).toHaveBeenCalledWith(expect.stringContaining('/embed/abc123'));
  });

  it('should include content title in generated codes', () => {
    render(<EmbedCodeGenerator shareId="xyz" contentTitle="My Article" />);
    // Default iframe tab should include title attribute
    expect(screen.getByText(/title="My Article"/)).toBeInTheDocument();
  });
});
