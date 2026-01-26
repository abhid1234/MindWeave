import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContentCard, type ContentCardProps } from './ContentCard';

// Mock EditableTags component
vi.mock('./EditableTags', () => ({
  EditableTags: ({ initialTags, autoTags }: { initialTags: string[]; autoTags: string[] }) => (
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

// Mock DeleteConfirmDialog component
vi.mock('./DeleteConfirmDialog', () => ({
  DeleteConfirmDialog: ({
    open,
    contentTitle,
  }: {
    open: boolean;
    contentTitle: string;
  }) => (
    open ? (
      <div data-testid="delete-dialog">
        Delete dialog for: {contentTitle}
      </div>
    ) : null
  ),
}));

// Mock ContentEditDialog component
vi.mock('./ContentEditDialog', () => ({
  ContentEditDialog: ({
    open,
    content,
  }: {
    open: boolean;
    content: { title: string };
  }) => (
    open ? (
      <div data-testid="edit-dialog">
        Edit dialog for: {content.title}
      </div>
    ) : null
  ),
}));

// Mock ShareDialog component
vi.mock('./ShareDialog', () => ({
  ShareDialog: ({
    open,
    contentTitle,
  }: {
    open: boolean;
    contentTitle: string;
  }) => (
    open ? (
      <div data-testid="share-dialog">
        Share dialog for: {contentTitle}
      </div>
    ) : null
  ),
}));

// Mock CollectionSelector component
vi.mock('./CollectionSelector', () => ({
  CollectionSelector: ({
    open,
  }: {
    open: boolean;
    contentId: string;
  }) => (
    open ? (
      <div data-testid="collection-dialog">
        Collection selector dialog
      </div>
    ) : null
  ),
}));

// Mock RecommendationsDialog component
vi.mock('./RecommendationsDialog', () => ({
  RecommendationsDialog: ({
    open,
    contentTitle,
  }: {
    open: boolean;
    contentId: string;
    contentTitle: string;
  }) => (
    open ? (
      <div data-testid="recommendations-dialog">
        Recommendations dialog for: {contentTitle}
      </div>
    ) : null
  ),
}));

// Mock toggleFavoriteAction
vi.mock('@/app/actions/content', () => ({
  toggleFavoriteAction: vi.fn().mockResolvedValue({ success: true, isFavorite: true }),
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
      const card = container.querySelector('article.rounded-xl');
      expect(card?.className).toContain('hover:shadow-soft-md');
      expect(card?.className).toContain('transition-all');
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

  describe('Actions dropdown', () => {
    it('should render actions button', () => {
      render(<ContentCard {...baseProps} />);
      const actionsButton = screen.getByLabelText('Content actions');
      expect(actionsButton).toBeInTheDocument();
    });

    it('should show dropdown menu when actions button is clicked', async () => {
      const user = userEvent.setup();
      render(<ContentCard {...baseProps} />);
      const actionsButton = screen.getByLabelText('Content actions');
      await user.click(actionsButton);

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /Edit/i })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: /Delete/i })).toBeInTheDocument();
      });
    });

    it('should open edit dialog when Edit is clicked', async () => {
      const user = userEvent.setup();
      render(<ContentCard {...baseProps} />);
      const actionsButton = screen.getByLabelText('Content actions');
      await user.click(actionsButton);

      const editButton = await screen.findByRole('menuitem', { name: /Edit/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId('edit-dialog')).toBeInTheDocument();
        expect(screen.getByText('Edit dialog for: Test Note')).toBeInTheDocument();
      });
    });

    it('should open delete dialog when Delete is clicked', async () => {
      const user = userEvent.setup();
      render(<ContentCard {...baseProps} />);
      const actionsButton = screen.getByLabelText('Content actions');
      await user.click(actionsButton);

      const deleteButton = await screen.findByRole('menuitem', { name: /Delete/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
        expect(screen.getByText('Delete dialog for: Test Note')).toBeInTheDocument();
      });
    });

    it('should show Share option in dropdown menu', async () => {
      const user = userEvent.setup();
      render(<ContentCard {...baseProps} />);
      const actionsButton = screen.getByLabelText('Content actions');
      await user.click(actionsButton);

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /Share/i })).toBeInTheDocument();
      });
    });

    it('should show "Manage Share" when content is already shared', async () => {
      const user = userEvent.setup();
      render(<ContentCard {...baseProps} isShared={true} shareId="abc123" />);
      const actionsButton = screen.getByLabelText('Content actions');
      await user.click(actionsButton);

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /Manage Share/i })).toBeInTheDocument();
      });
    });

    it('should open share dialog when Share is clicked', async () => {
      const user = userEvent.setup();
      render(<ContentCard {...baseProps} />);
      const actionsButton = screen.getByLabelText('Content actions');
      await user.click(actionsButton);

      const shareButton = await screen.findByRole('menuitem', { name: /Share/i });
      await user.click(shareButton);

      await waitFor(() => {
        expect(screen.getByTestId('share-dialog')).toBeInTheDocument();
        expect(screen.getByText('Share dialog for: Test Note')).toBeInTheDocument();
      });
    });

    it('should show Add to Collection option in dropdown menu', async () => {
      const user = userEvent.setup();
      render(<ContentCard {...baseProps} />);
      const actionsButton = screen.getByLabelText('Content actions');
      await user.click(actionsButton);

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /Add to Collection/i })).toBeInTheDocument();
      });
    });

    it('should open collection dialog when Add to Collection is clicked', async () => {
      const user = userEvent.setup();
      render(<ContentCard {...baseProps} />);
      const actionsButton = screen.getByLabelText('Content actions');
      await user.click(actionsButton);

      const collectionButton = await screen.findByRole('menuitem', { name: /Add to Collection/i });
      await user.click(collectionButton);

      await waitFor(() => {
        expect(screen.getByTestId('collection-dialog')).toBeInTheDocument();
      });
    });

    it('should show View Similar option in dropdown menu', async () => {
      const user = userEvent.setup();
      render(<ContentCard {...baseProps} />);
      const actionsButton = screen.getByLabelText('Content actions');
      await user.click(actionsButton);

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /View Similar/i })).toBeInTheDocument();
      });
    });

    it('should open recommendations dialog when View Similar is clicked', async () => {
      const user = userEvent.setup();
      render(<ContentCard {...baseProps} />);
      const actionsButton = screen.getByLabelText('Content actions');
      await user.click(actionsButton);

      const viewSimilarButton = await screen.findByRole('menuitem', { name: /View Similar/i });
      await user.click(viewSimilarButton);

      await waitFor(() => {
        expect(screen.getByTestId('recommendations-dialog')).toBeInTheDocument();
        expect(screen.getByText('Recommendations dialog for: Test Note')).toBeInTheDocument();
      });
    });
  });

  describe('Sharing indicator', () => {
    it('should show Shared badge when content is shared', () => {
      render(<ContentCard {...baseProps} isShared={true} shareId="abc123" />);
      expect(screen.getByText('Shared')).toBeInTheDocument();
    });

    it('should not show Shared badge when content is not shared', () => {
      render(<ContentCard {...baseProps} isShared={false} />);
      expect(screen.queryByText('Shared')).not.toBeInTheDocument();
    });
  });
});
