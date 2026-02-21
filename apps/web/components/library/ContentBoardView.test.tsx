import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContentBoardView } from './ContentBoardView';

// Mock SelectableContentCard
vi.mock('./SelectableContentCard', () => ({
  SelectableContentCard: ({ title, type }: { title: string; type: string }) => (
    <div data-testid={`card-${type}`}>
      <span data-testid="card-title">{title}</span>
    </div>
  ),
}));

const createItem = (overrides: Partial<{
  id: string;
  type: 'note' | 'link' | 'file';
  title: string;
}> = {}) => ({
  id: overrides.id || 'item-1',
  type: overrides.type || 'note' as const,
  title: overrides.title || 'Test Item',
  body: null,
  url: null,
  tags: [],
  autoTags: [],
  createdAt: new Date('2024-01-01'),
  metadata: null,
  isShared: false,
  shareId: null,
  isFavorite: false,
});

describe('ContentBoardView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render three columns', () => {
    render(<ContentBoardView items={[]} allTags={[]} />);

    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(screen.getByText('Links')).toBeInTheDocument();
    expect(screen.getByText('Files')).toBeInTheDocument();
  });

  it('should display counts for each column', () => {
    const items = [
      createItem({ id: '1', type: 'note', title: 'Note 1' }),
      createItem({ id: '2', type: 'note', title: 'Note 2' }),
      createItem({ id: '3', type: 'link', title: 'Link 1' }),
    ];

    render(<ContentBoardView items={items} allTags={[]} />);

    // Counts are rendered as text nodes next to the column label
    const counts = screen.getAllByText(/^[0-3]$/);
    // Note: 2 notes, 1 link, 0 files
    expect(counts).toHaveLength(3);
  });

  it('should place notes in the Notes column', () => {
    const items = [
      createItem({ id: '1', type: 'note', title: 'My Note' }),
    ];

    render(<ContentBoardView items={items} allTags={[]} />);

    expect(screen.getByText('My Note')).toBeInTheDocument();
    expect(screen.getAllByTestId('card-note')).toHaveLength(1);
  });

  it('should place links in the Links column', () => {
    const items = [
      createItem({ id: '1', type: 'link', title: 'My Link' }),
    ];

    render(<ContentBoardView items={items} allTags={[]} />);

    expect(screen.getByText('My Link')).toBeInTheDocument();
    expect(screen.getAllByTestId('card-link')).toHaveLength(1);
  });

  it('should place files in the Files column', () => {
    const items = [
      createItem({ id: '1', type: 'file', title: 'My File' }),
    ];

    render(<ContentBoardView items={items} allTags={[]} />);

    expect(screen.getByText('My File')).toBeInTheDocument();
    expect(screen.getAllByTestId('card-file')).toHaveLength(1);
  });

  it('should show empty state for columns with no items', () => {
    render(<ContentBoardView items={[]} allTags={[]} />);

    expect(screen.getByText('No notes')).toBeInTheDocument();
    expect(screen.getByText('No links')).toBeInTheDocument();
    expect(screen.getByText('No files')).toBeInTheDocument();
  });

  it('should group items correctly across all columns', () => {
    const items = [
      createItem({ id: '1', type: 'note', title: 'Note A' }),
      createItem({ id: '2', type: 'link', title: 'Link A' }),
      createItem({ id: '3', type: 'file', title: 'File A' }),
      createItem({ id: '4', type: 'note', title: 'Note B' }),
    ];

    render(<ContentBoardView items={items} allTags={[]} />);

    expect(screen.getAllByTestId('card-note')).toHaveLength(2);
    expect(screen.getAllByTestId('card-link')).toHaveLength(1);
    expect(screen.getAllByTestId('card-file')).toHaveLength(1);
  });

  it('should render with horizontal scroll container', () => {
    const { container } = render(<ContentBoardView items={[]} allTags={[]} />);

    const scrollContainer = container.firstChild as HTMLElement;
    expect(scrollContainer.className).toContain('overflow-x-auto');
    expect(scrollContainer.className).toContain('flex');
  });

  it('should use SelectableContentCard for items', () => {
    const items = [
      createItem({ id: '1', type: 'note', title: 'Test Note' }),
    ];

    render(<ContentBoardView items={items} allTags={[]} />);

    // The mocked SelectableContentCard renders with data-testid
    expect(screen.getByTestId('card-note')).toBeInTheDocument();
  });
});
