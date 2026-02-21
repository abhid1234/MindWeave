import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContentBoardView } from './ContentBoardView';

// Mock dnd-kit
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div data-testid="dnd-context">{children}</div>,
  DragOverlay: ({ children }: { children: React.ReactNode }) => <div data-testid="drag-overlay">{children}</div>,
  PointerSensor: vi.fn(),
  KeyboardSensor: vi.fn(),
  useSensor: vi.fn().mockReturnValue({}),
  useSensors: vi.fn().mockReturnValue([]),
  pointerWithin: vi.fn(),
  closestCenter: vi.fn(),
  useDroppable: vi.fn().mockReturnValue({ setNodeRef: vi.fn() }),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <div data-testid="sortable-context">{children}</div>,
  verticalListSortingStrategy: {},
  sortableKeyboardCoordinates: vi.fn(),
  useSortable: vi.fn().mockReturnValue({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: () => undefined,
    },
  },
}));

// Mock SortableContentCard to render like original SelectableContentCard mock
vi.mock('./SortableContentCard', () => ({
  SortableContentCard: ({ item, disabled }: { item: { title: string; type: string }; disabled: boolean }) => (
    <div data-testid={`card-${item.type}`} data-disabled={disabled}>
      <span data-testid="card-title">{item.title}</span>
    </div>
  ),
}));

// Mock CollectionDropZones
vi.mock('./CollectionDropZones', () => ({
  CollectionDropZones: ({ isDragging }: { isDragging: boolean }) => (
    isDragging ? <div data-testid="collection-drop-zones" /> : null
  ),
}));

// Mock ContentCard (used in DragOverlay)
vi.mock('./ContentCard', () => ({
  ContentCard: ({ title }: { title: string }) => (
    <div data-testid="overlay-card">{title}</div>
  ),
}));

// Mock BulkSelectionContext
const mockUseBulkSelection = vi.fn().mockReturnValue({ isSelectionMode: false });
vi.mock('./BulkSelectionContext', () => ({
  useBulkSelection: () => mockUseBulkSelection(),
}));

// Mock useBoardSortOrder
vi.mock('@/hooks/useBoardSortOrder', () => ({
  useBoardSortOrder: () => ({
    getOrderedItems: (_type: string, items: unknown[]) => items,
    handleReorder: vi.fn(),
    resetOrder: vi.fn(),
  }),
}));

// Mock useToast
vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

// Mock addToCollectionAction
vi.mock('@/app/actions/collections', () => ({
  addToCollectionAction: vi.fn(),
  getCollectionsAction: vi.fn().mockResolvedValue({ success: true, collections: [] }),
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
    mockUseBulkSelection.mockReturnValue({ isSelectionMode: false });
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

    const counts = screen.getAllByText(/^[0-3]$/);
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
    render(<ContentBoardView items={[]} allTags={[]} />);

    const dndContext = screen.getByTestId('dnd-context');
    const scrollContainer = dndContext.querySelector('.overflow-x-auto');
    expect(scrollContainer).toBeInTheDocument();
    expect(scrollContainer?.className).toContain('flex');
  });

  it('should use SortableContentCard for items', () => {
    const items = [
      createItem({ id: '1', type: 'note', title: 'Test Note' }),
    ];

    render(<ContentBoardView items={items} allTags={[]} />);

    expect(screen.getByTestId('card-note')).toBeInTheDocument();
  });

  it('should wrap content in DndContext', () => {
    render(<ContentBoardView items={[]} allTags={[]} />);

    expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
  });

  it('should include DragOverlay', () => {
    render(<ContentBoardView items={[]} allTags={[]} />);

    expect(screen.getByTestId('drag-overlay')).toBeInTheDocument();
  });

  it('should include SortableContext for each column', () => {
    render(<ContentBoardView items={[]} allTags={[]} />);

    const sortableContexts = screen.getAllByTestId('sortable-context');
    expect(sortableContexts).toHaveLength(3);
  });

  it('should pass disabled=true to SortableContentCard when in selection mode', () => {
    mockUseBulkSelection.mockReturnValue({ isSelectionMode: true });
    const items = [
      createItem({ id: '1', type: 'note', title: 'Note' }),
    ];

    render(<ContentBoardView items={items} allTags={[]} />);

    const card = screen.getByTestId('card-note');
    expect(card.getAttribute('data-disabled')).toBe('true');
  });

  it('should pass disabled=false to SortableContentCard when not in selection mode', () => {
    mockUseBulkSelection.mockReturnValue({ isSelectionMode: false });
    const items = [
      createItem({ id: '1', type: 'note', title: 'Note' }),
    ];

    render(<ContentBoardView items={items} allTags={[]} />);

    const card = screen.getByTestId('card-note');
    expect(card.getAttribute('data-disabled')).toBe('false');
  });

  it('should not show collection drop zones when not dragging', () => {
    render(<ContentBoardView items={[]} allTags={[]} />);

    expect(screen.queryByTestId('collection-drop-zones')).not.toBeInTheDocument();
  });
});
