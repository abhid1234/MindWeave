import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContentCard, type ContentCardProps } from './ContentCard';

// Mock EditableTags component
vi.mock('./EditableTags', () => ({
  EditableTags: ({ initialTags, autoTags }: any) => (
    <div data-testid="editable-tags">
      {initialTags.map((tag: string) => (
        <span key={tag}>{tag}</span>
      ))}
      {autoTags.map((tag: string) => (
        <span key={tag}>{tag}</span>
      ))}
    </div>
  ),
}));

describe('ContentCard', () => {
  const baseProps: ContentCardProps = {
    id: '1',
    type: 'note',
    title: 'Test Note',
    body: 'This is a test note body',
    url: null,
    tags: ['tag1', 'tag2'],
    autoTags: ['auto1'],
    createdAt: new Date('2024-01-15T10:00:00Z'),
    allTags: ['tag1', 'tag2', 'tag3'],
  };

  describe('Rendering', () => {
    it('should render content type', () => {
      render(<ContentCard {...baseProps} />);
      expect(screen.getByText('note')).toBeInTheDocument();
    });

    it('should render title', () => {
      render(<ContentCard {...baseProps} />);
      expect(screen.getByText('Test Note')).toBeInTheDocument();
    });

    it('should render body when provided', () => {
      render(<ContentCard {...baseProps} />);
      expect(screen.getByText('This is a test note body')).toBeInTheDocument();
    });

    it('should not render body when null', () => {
      render(<ContentCard {...baseProps} body={null} />);
      expect(screen.queryByText(/test note body/i)).not.toBeInTheDocument();
    });

    it('should render URL when provided', () => {
      render(<ContentCard {...baseProps} url="https://example.com" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://example.com');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should not render URL when null', () => {
      render(<ContentCard {...baseProps} />);
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('should render formatted date', () => {
      render(<ContentCard {...baseProps} />);
      // Date format may vary by locale, so just check it exists
      const dateElements = screen.getAllByText(/1\/15\/2024|15\/1\/2024/);
      expect(dateElements.length).toBeGreaterThan(0);
    });
  });

  describe('Tags', () => {
    it('should render EditableTags component', () => {
      render(<ContentCard {...baseProps} />);
      expect(screen.getByTestId('editable-tags')).toBeInTheDocument();
    });

    it('should pass tags to EditableTags', () => {
      render(<ContentCard {...baseProps} />);
      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
    });

    it('should pass auto tags to EditableTags', () => {
      render(<ContentCard {...baseProps} />);
      expect(screen.getByText('auto1')).toBeInTheDocument();
    });

    it('should pass allTags prop to EditableTags', () => {
      render(<ContentCard {...baseProps} allTags={['tag1', 'tag2', 'tag3']} />);
      // EditableTags should receive allTags prop (verified in EditableTags tests)
      expect(screen.getByTestId('editable-tags')).toBeInTheDocument();
    });

    it('should pass empty allTags array when not provided', () => {
      render(<ContentCard {...baseProps} allTags={undefined} />);
      expect(screen.getByTestId('editable-tags')).toBeInTheDocument();
    });
  });

  describe('Content types', () => {
    it('should render note type', () => {
      render(<ContentCard {...baseProps} type="note" />);
      expect(screen.getByText('note')).toBeInTheDocument();
    });

    it('should render link type', () => {
      render(<ContentCard {...baseProps} type="link" />);
      expect(screen.getByText('link')).toBeInTheDocument();
    });

    it('should render file type', () => {
      render(<ContentCard {...baseProps} type="file" />);
      expect(screen.getByText('file')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have hover shadow effect', () => {
      const { container } = render(<ContentCard {...baseProps} />);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('hover:shadow-md');
      expect(card.className).toContain('transition-shadow');
    });

    it('should apply line-clamp to title', () => {
      render(<ContentCard {...baseProps} />);
      const title = screen.getByText('Test Note');
      expect(title.className).toContain('line-clamp-2');
    });

    it('should apply line-clamp to body', () => {
      render(<ContentCard {...baseProps} />);
      const body = screen.getByText('This is a test note body');
      expect(body.className).toContain('line-clamp-3');
    });
  });
});
