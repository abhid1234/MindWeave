import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportSourceSelector } from './ImportSourceSelector';

// Mock @/lib/import/types
vi.mock('@/lib/import/types', () => ({
  IMPORT_SOURCES: [
    {
      id: 'bookmarks',
      name: 'Browser Bookmarks',
      description: 'Import bookmarks from Chrome, Firefox, Safari, or Edge',
      acceptedExtensions: ['.html', '.htm'],
      acceptedMimeTypes: ['text/html'],
      maxFileSize: 50 * 1024 * 1024,
      icon: 'Bookmark',
    },
    {
      id: 'pocket',
      name: 'Pocket',
      description: 'Import saved articles from Pocket (HTML export)',
      acceptedExtensions: ['.html', '.htm', '.csv'],
      acceptedMimeTypes: ['text/html', 'text/csv'],
      maxFileSize: 50 * 1024 * 1024,
      icon: 'BookmarkCheck',
    },
    {
      id: 'notion',
      name: 'Notion',
      description: 'Import pages from Notion (ZIP export with HTML/Markdown)',
      acceptedExtensions: ['.zip'],
      acceptedMimeTypes: ['application/zip'],
      maxFileSize: 100 * 1024 * 1024,
      icon: 'FileText',
    },
  ],
}));

// Mock @/lib/utils
vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

describe('ImportSourceSelector', () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all available import sources', () => {
    render(<ImportSourceSelector selected={null} onSelect={mockOnSelect} />);

    expect(screen.getByText('Browser Bookmarks')).toBeInTheDocument();
    expect(screen.getByText('Pocket')).toBeInTheDocument();
    expect(screen.getByText('Notion')).toBeInTheDocument();
  });

  it('should call onSelect with source id when clicking a source', async () => {
    const user = userEvent.setup();
    render(<ImportSourceSelector selected={null} onSelect={mockOnSelect} />);

    const pocketButton = screen.getByText('Pocket').closest('button')!;
    await user.click(pocketButton);

    expect(mockOnSelect).toHaveBeenCalledWith('pocket');
  });

  it('should show highlight/active state on selected source', () => {
    render(<ImportSourceSelector selected={'bookmarks'} onSelect={mockOnSelect} />);

    const bookmarksButton = screen.getByText('Browser Bookmarks').closest('button')!;
    expect(bookmarksButton).toHaveClass('border-primary');
    expect(bookmarksButton).toHaveClass('ring-2');

    // Non-selected sources should not have active classes
    const pocketButton = screen.getByText('Pocket').closest('button')!;
    expect(pocketButton).not.toHaveClass('border-primary');
  });

  it('should display source descriptions', () => {
    render(<ImportSourceSelector selected={null} onSelect={mockOnSelect} />);

    expect(screen.getByText('Import bookmarks from Chrome, Firefox, Safari, or Edge')).toBeInTheDocument();
    expect(screen.getByText('Import saved articles from Pocket (HTML export)')).toBeInTheDocument();
    expect(screen.getByText('Import pages from Notion (ZIP export with HTML/Markdown)')).toBeInTheDocument();
  });

  it('should display accepted file extensions for each source', () => {
    render(<ImportSourceSelector selected={null} onSelect={mockOnSelect} />);

    expect(screen.getByText(/Accepts: \.html, \.htm$/)).toBeInTheDocument();
    expect(screen.getByText(/Accepts: \.html, \.htm, \.csv/)).toBeInTheDocument();
    expect(screen.getByText(/Accepts: \.zip/)).toBeInTheDocument();
  });
});
