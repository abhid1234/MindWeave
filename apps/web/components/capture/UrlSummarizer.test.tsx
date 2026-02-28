import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UrlSummarizer } from './UrlSummarizer';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('UrlSummarizer', () => {
  it('renders nothing when URL is empty', () => {
    const { container } = render(
      <UrlSummarizer url="" onSummaryReady={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing for invalid URL', () => {
    const { container } = render(
      <UrlSummarizer url="not-a-url" onSummaryReady={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows "Summarize Video" for YouTube URLs', () => {
    render(
      <UrlSummarizer
        url="https://youtube.com/watch?v=dQw4w9WgXcQ"
        onSummaryReady={vi.fn()}
      />,
    );
    expect(screen.getByText('Summarize Video')).toBeInTheDocument();
  });

  it('shows "Summarize Article" for non-YouTube URLs', () => {
    render(
      <UrlSummarizer url="https://example.com/article" onSummaryReady={vi.fn()} />,
    );
    expect(screen.getByText('Summarize Article')).toBeInTheDocument();
  });

  it('calls onSummaryReady on successful summarization', async () => {
    const mockCallback = vi.fn();
    const user = userEvent.setup();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            formattedBody: '## Summary\n\nGreat article.',
            metadata: { sourceType: 'article', domain: 'example.com' },
          },
        }),
    });

    render(
      <UrlSummarizer url="https://example.com/post" onSummaryReady={mockCallback} />,
    );

    await user.click(screen.getByText('Summarize Article'));

    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalledWith(
        '## Summary\n\nGreat article.',
        { sourceType: 'article', domain: 'example.com' },
      );
    });
  });

  it('shows error on failure', async () => {
    const user = userEvent.setup();

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () =>
        Promise.resolve({ success: false, message: 'Transcript not available' }),
    });

    render(
      <UrlSummarizer
        url="https://youtube.com/watch?v=dQw4w9WgXcQ"
        onSummaryReady={vi.fn()}
      />,
    );

    await user.click(screen.getByText('Summarize Video'));

    await waitFor(() => {
      expect(screen.getByText('Transcript not available')).toBeInTheDocument();
    });
  });
});
