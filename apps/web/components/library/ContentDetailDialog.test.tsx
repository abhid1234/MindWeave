import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContentDetailDialog, type ContentDetailDialogProps } from './ContentDetailDialog';

// Mock dynamic imports for sub-dialogs
vi.mock('./DeleteConfirmDialog', () => ({
  DeleteConfirmDialog: ({
    open,
    contentTitle,
  }: {
    open: boolean;
    contentTitle: string;
  }) =>
    open ? (
      <div data-testid="delete-dialog">Delete dialog for: {contentTitle}</div>
    ) : null,
}));

vi.mock('./ContentEditDialog', () => ({
  ContentEditDialog: ({
    open,
    content,
  }: {
    open: boolean;
    content: { title: string };
  }) =>
    open ? (
      <div data-testid="edit-dialog">Edit dialog for: {content.title}</div>
    ) : null,
}));

vi.mock('./ShareDialog', () => ({
  ShareDialog: ({
    open,
    contentTitle,
  }: {
    open: boolean;
    contentTitle: string;
  }) =>
    open ? (
      <div data-testid="share-dialog">Share dialog for: {contentTitle}</div>
    ) : null,
}));

vi.mock('@/components/editor/MarkdownRenderer', () => ({
  MarkdownRenderer: ({ content }: { content: string }) => (
    <div data-testid="markdown-renderer">{content}</div>
  ),
}));

vi.mock('./VersionHistoryPanel', () => ({
  VersionHistoryPanel: () => (
    <div data-testid="version-history">Version History</div>
  ),
}));

vi.mock('@/app/actions/search', () => ({
  getRecommendationsAction: vi.fn().mockResolvedValue({ success: true, recommendations: [] }),
}));

const mockGenerateSummaryAction = vi.fn();
vi.mock('@/app/actions/content', () => ({
  generateSummaryAction: (...args: unknown[]) => mockGenerateSummaryAction(...args),
}));

const mockTrackContentViewAction = vi.fn().mockResolvedValue({ success: true });
vi.mock('@/app/actions/views', () => ({
  trackContentViewAction: (...args: unknown[]) => mockTrackContentViewAction(...args),
}));

vi.mock('@/components/reminders/ReminderButton', () => ({
  ReminderButton: ({ contentId }: { contentId: string }) => (
    <button data-testid="reminder-button">Remind Me</button>
  ),
}));

const baseContent: ContentDetailDialogProps['content'] = {
  id: '1',
  type: 'note',
  title: 'Test Note Title',
  body: 'This is the full body content of the note.',
  url: null,
  tags: ['tag1', 'tag2'],
  autoTags: ['ai-tag'],
  createdAt: new Date('2024-01-15T10:00:00Z'),
  isFavorite: false,
  isShared: false,
  shareId: null,
  metadata: null,
};

describe('ContentDetailDialog', () => {
  it('renders content title and body when open', () => {
    render(
      <ContentDetailDialog content={baseContent} open={true} onOpenChange={() => {}} />
    );

    expect(screen.getByText('Test Note Title')).toBeInTheDocument();
    expect(screen.getByText('This is the full body content of the note.')).toBeInTheDocument();
  });

  it('renders type badge', () => {
    render(
      <ContentDetailDialog content={baseContent} open={true} onOpenChange={() => {}} />
    );

    expect(screen.getByText('note')).toBeInTheDocument();
  });

  it('renders tags and auto tags', () => {
    render(
      <ContentDetailDialog content={baseContent} open={true} onOpenChange={() => {}} />
    );

    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();
    expect(screen.getByText('ai-tag (AI)')).toBeInTheDocument();
  });

  it('renders URL for link type content', () => {
    const linkContent = {
      ...baseContent,
      type: 'link' as const,
      url: 'https://example.com',
    };

    render(
      <ContentDetailDialog content={linkContent} open={true} onOpenChange={() => {}} />
    );

    const link = screen.getByRole('link', { name: /example\.com/ });
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('shows favorite indicator when favorited', () => {
    const favContent = { ...baseContent, isFavorite: true };

    render(
      <ContentDetailDialog content={favContent} open={true} onOpenChange={() => {}} />
    );

    expect(screen.getByLabelText('Favorited')).toBeInTheDocument();
  });

  it('shows shared badge when shared', () => {
    const sharedContent = { ...baseContent, isShared: true, shareId: 'abc' };

    render(
      <ContentDetailDialog content={sharedContent} open={true} onOpenChange={() => {}} />
    );

    expect(screen.getByText('Shared')).toBeInTheDocument();
  });

  it('does not render body section when body is null', () => {
    const noBodyContent = { ...baseContent, body: null };

    render(
      <ContentDetailDialog content={noBodyContent} open={true} onOpenChange={() => {}} />
    );

    expect(screen.queryByText('This is the full body content of the note.')).not.toBeInTheDocument();
  });

  it('opens edit dialog when Edit button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <ContentDetailDialog content={baseContent} open={true} onOpenChange={() => {}} />
    );

    const editButton = screen.getByRole('button', { name: /Edit/i });
    await user.click(editButton);

    expect(screen.getByTestId('edit-dialog')).toBeInTheDocument();
    expect(screen.getByText('Edit dialog for: Test Note Title')).toBeInTheDocument();
  });

  it('opens share dialog when Share button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <ContentDetailDialog content={baseContent} open={true} onOpenChange={() => {}} />
    );

    const shareButton = screen.getByRole('button', { name: /Share/i });
    await user.click(shareButton);

    expect(screen.getByTestId('share-dialog')).toBeInTheDocument();
  });

  it('opens delete dialog when Delete button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <ContentDetailDialog content={baseContent} open={true} onOpenChange={() => {}} />
    );

    const deleteButton = screen.getByRole('button', { name: /Delete/i });
    await user.click(deleteButton);

    expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
  });

  it('shows "Manage Share" when content is already shared', () => {
    const sharedContent = { ...baseContent, isShared: true, shareId: 'abc' };

    render(
      <ContentDetailDialog content={sharedContent} open={true} onOpenChange={() => {}} />
    );

    expect(screen.getByRole('button', { name: /Manage Share/i })).toBeInTheDocument();
  });

  it('tracks content view when dialog opens', () => {
    mockTrackContentViewAction.mockClear();

    render(
      <ContentDetailDialog content={baseContent} open={true} onOpenChange={() => {}} />
    );

    expect(mockTrackContentViewAction).toHaveBeenCalledWith('1');
  });

  it('does not render when not open', () => {
    render(
      <ContentDetailDialog content={baseContent} open={false} onOpenChange={() => {}} />
    );

    expect(screen.queryByText('Test Note Title')).not.toBeInTheDocument();
  });

  it('renders summary when provided', () => {
    const contentWithSummary = { ...baseContent, summary: 'This is an AI-generated summary.' };

    render(
      <ContentDetailDialog content={contentWithSummary} open={true} onOpenChange={() => {}} />
    );

    expect(screen.getByText('This is an AI-generated summary.')).toBeInTheDocument();
  });

  it('shows Generate Summary button when summary is null', () => {
    const contentNoSummary = { ...baseContent, summary: null };

    render(
      <ContentDetailDialog content={contentNoSummary} open={true} onOpenChange={() => {}} />
    );

    expect(screen.getByTestId('generate-summary-btn')).toBeInTheDocument();
    expect(screen.getByText('Generate Summary')).toBeInTheDocument();
  });

  it('calls generateSummaryAction when Generate Summary button is clicked', async () => {
    mockGenerateSummaryAction.mockResolvedValue({ success: true, summary: 'Generated summary' });
    const user = userEvent.setup();

    render(
      <ContentDetailDialog content={{ ...baseContent, summary: null }} open={true} onOpenChange={() => {}} />
    );

    const btn = screen.getByTestId('generate-summary-btn');
    await user.click(btn);

    expect(mockGenerateSummaryAction).toHaveBeenCalledWith('1');
  });

  it('renders file info for file type content', () => {
    const fileContent = {
      ...baseContent,
      type: 'file' as const,
      metadata: {
        fileType: 'application/pdf',
        fileSize: 1048576,
        filePath: '/api/files/doc.pdf',
        fileName: 'Document.pdf',
      },
    };

    render(
      <ContentDetailDialog content={fileContent} open={true} onOpenChange={() => {}} />
    );

    expect(screen.getByText('Document.pdf')).toBeInTheDocument();
    expect(screen.getByText('1.0 MB')).toBeInTheDocument();
    expect(screen.getByLabelText('Download file')).toBeInTheDocument();
  });
});
