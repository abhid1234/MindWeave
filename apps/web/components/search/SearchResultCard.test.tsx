import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SearchResultCard } from './SearchResultCard';

vi.mock('@/lib/highlight', () => ({
  highlightText: (text: string) => text,
}));

vi.mock('../library/ContentDetailDialog', () => ({
  ContentDetailDialog: ({
    open,
    content,
  }: {
    open: boolean;
    content: { title: string };
  }) =>
    open ? (
      <div data-testid="detail-dialog">Detail dialog for: {content.title}</div>
    ) : null,
}));

const baseItem = {
  id: '1',
  title: 'Search Result',
  body: 'This is some body text for the search result card test.',
  type: 'note' as const,
  url: null,
  tags: ['tag1'],
  autoTags: [],
  createdAt: new Date('2024-01-15T10:00:00Z'),
};

describe('SearchResultCard', () => {
  it('shows reading time when body is present', () => {
    render(<SearchResultCard item={baseItem} query="test" />);
    expect(screen.getByText('1 min read')).toBeInTheDocument();
  });

  it('does not show reading time when body is null', () => {
    render(<SearchResultCard item={{ ...baseItem, body: null }} query="test" />);
    expect(screen.queryByText(/min read/)).not.toBeInTheDocument();
  });
});
