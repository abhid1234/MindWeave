import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FilterBar } from './FilterBar';
import { useSearchParams } from 'next/navigation';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
}));

describe('FilterBar', () => {
  const mockSearchParams = new URLSearchParams();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete('type');
    mockSearchParams.delete('tag');
    mockSearchParams.delete('sortBy');
    mockSearchParams.delete('sortOrder');
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as any);
  });

  describe('Type Filter', () => {
    it('should render all content type options', () => {
      render(<FilterBar allTags={[]} />);

      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('Notes')).toBeInTheDocument();
      expect(screen.getByText('Links')).toBeInTheDocument();
      expect(screen.getByText('Files')).toBeInTheDocument();
    });

    it('should highlight All filter by default', () => {
      render(<FilterBar allTags={[]} />);

      const allButton = screen.getByText('All');
      expect(allButton.className).toContain('bg-primary');
      expect(allButton.className).toContain('text-primary-foreground');
    });

    it('should highlight selected type filter', () => {
      mockSearchParams.set('type', 'note');

      render(<FilterBar allTags={[]} />);

      const notesButton = screen.getByText('Notes');
      expect(notesButton.className).toContain('bg-primary');
    });

    it('should generate correct URLs for type filters', () => {
      render(<FilterBar allTags={[]} />);

      const notesLink = screen.getByText('Notes').closest('a');
      expect(notesLink).toHaveAttribute('href', '/dashboard/library?type=note&sortBy=createdAt&sortOrder=desc');

      const linksLink = screen.getByText('Links').closest('a');
      expect(linksLink).toHaveAttribute('href', '/dashboard/library?type=link&sortBy=createdAt&sortOrder=desc');
    });

    it('should preserve other params when changing type', () => {
      mockSearchParams.set('sortBy', 'title');
      mockSearchParams.set('sortOrder', 'asc');

      render(<FilterBar allTags={[]} />);

      const notesLink = screen.getByText('Notes').closest('a');
      const href = notesLink?.getAttribute('href') || '';
      expect(href).toContain('type=note');
      expect(href).toContain('sortBy=title');
      expect(href).toContain('sortOrder=asc');
    });
  });

  describe('Sort Options', () => {
    it('should render all sort options', () => {
      render(<FilterBar allTags={[]} />);

      expect(screen.getByText('Newest First')).toBeInTheDocument();
      expect(screen.getByText('Oldest First')).toBeInTheDocument();
      expect(screen.getByText('Title A-Z')).toBeInTheDocument();
      expect(screen.getByText('Title Z-A')).toBeInTheDocument();
    });

    it('should highlight Newest First by default', () => {
      render(<FilterBar allTags={[]} />);

      const newestButton = screen.getByText('Newest First');
      expect(newestButton.className).toContain('bg-primary');
    });

    it('should highlight selected sort option', () => {
      mockSearchParams.set('sortBy', 'title');
      mockSearchParams.set('sortOrder', 'asc');

      render(<FilterBar allTags={[]} />);

      const titleAscButton = screen.getByText('Title A-Z');
      expect(titleAscButton.className).toContain('bg-primary');
    });

    it('should generate correct URLs for sort options', () => {
      render(<FilterBar allTags={[]} />);

      const titleAscLink = screen.getByText('Title A-Z').closest('a');
      expect(titleAscLink).toHaveAttribute('href', '/dashboard/library?sortBy=title&sortOrder=asc');

      const oldestLink = screen.getByText('Oldest First').closest('a');
      expect(oldestLink).toHaveAttribute('href', '/dashboard/library?sortBy=createdAt&sortOrder=asc');
    });
  });

  describe('Tag Filter', () => {
    it('should not render tags section when no tags', () => {
      render(<FilterBar allTags={[]} />);

      expect(screen.queryByText('Filter by Tag')).not.toBeInTheDocument();
    });

    it('should render tag filter section when tags exist', () => {
      render(<FilterBar allTags={['tag1', 'tag2']} />);

      expect(screen.getByText('Filter by Tag')).toBeInTheDocument();
      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
    });

    it('should limit tags to 10', () => {
      const manyTags = Array.from({ length: 15 }, (_, i) => `tag${i + 1}`);
      render(<FilterBar allTags={manyTags} />);

      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag10')).toBeInTheDocument();
      expect(screen.queryByText('tag11')).not.toBeInTheDocument();
      expect(screen.getByText('+5 more')).toBeInTheDocument();
    });

    it('should highlight selected tag', () => {
      mockSearchParams.set('tag', 'tag1');

      render(<FilterBar allTags={['tag1', 'tag2']} />);

      const tag1Button = screen.getByText('tag1');
      expect(tag1Button.className).toContain('bg-primary');
    });

    it('should show clear tag filter button when tag is selected', () => {
      mockSearchParams.set('tag', 'tag1');

      render(<FilterBar allTags={['tag1', 'tag2']} />);

      expect(screen.getByText(/Clear tag filter/)).toBeInTheDocument();
    });

    it('should not show clear button when no tag is selected', () => {
      render(<FilterBar allTags={['tag1', 'tag2']} />);

      expect(screen.queryByText(/Clear tag filter/)).not.toBeInTheDocument();
    });

    it('should generate correct URL for tag selection', () => {
      render(<FilterBar allTags={['tag1']} />);

      const tagLink = screen.getByText('tag1').closest('a');
      expect(tagLink).toHaveAttribute('href', '/dashboard/library?tag=tag1&sortBy=createdAt&sortOrder=desc');
    });

    it('should generate URL without tag when clearing', () => {
      mockSearchParams.set('tag', 'tag1');
      mockSearchParams.set('type', 'note');

      render(<FilterBar allTags={['tag1']} />);

      const clearLink = screen.getByText(/Clear tag filter/).closest('a');
      const href = clearLink?.getAttribute('href') || '';
      expect(href).not.toContain('tag=');
      expect(href).toContain('type=note');
    });
  });

  describe('Combined Filters', () => {
    it('should preserve all params when changing one filter', () => {
      mockSearchParams.set('type', 'note');
      mockSearchParams.set('tag', 'tag1');
      mockSearchParams.set('sortBy', 'title');
      mockSearchParams.set('sortOrder', 'asc');

      render(<FilterBar allTags={['tag1', 'tag2']} />);

      const linksLink = screen.getByText('Links').closest('a');
      const href = linksLink?.getAttribute('href') || '';
      expect(href).toContain('type=link');
      expect(href).toContain('tag=tag1');
      expect(href).toContain('sortBy=title');
      expect(href).toContain('sortOrder=asc');
    });

    it('should update type while preserving sort', () => {
      mockSearchParams.set('sortBy', 'title');
      mockSearchParams.set('sortOrder', 'desc');

      render(<FilterBar allTags={[]} />);

      const notesLink = screen.getByText('Notes').closest('a');
      const href = notesLink?.getAttribute('href') || '';
      expect(href).toContain('type=note');
      expect(href).toContain('sortBy=title');
      expect(href).toContain('sortOrder=desc');
    });

    it('should update sort while preserving type and tag', () => {
      mockSearchParams.set('type', 'link');
      mockSearchParams.set('tag', 'tag1');

      render(<FilterBar allTags={['tag1']} />);

      const titleAscLink = screen.getByText('Title A-Z').closest('a');
      const href = titleAscLink?.getAttribute('href') || '';
      expect(href).toContain('type=link');
      expect(href).toContain('tag=tag1');
      expect(href).toContain('sortBy=title');
      expect(href).toContain('sortOrder=asc');
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels', () => {
      render(<FilterBar allTags={['tag1']} />);

      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Sort By')).toBeInTheDocument();
      expect(screen.getByText('Filter by Tag')).toBeInTheDocument();
    });

    it('should render all filters as links', () => {
      render(<FilterBar allTags={['tag1']} />);

      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });
  });
});
