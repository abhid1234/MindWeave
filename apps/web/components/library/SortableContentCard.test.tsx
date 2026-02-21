import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SortableContentCard } from './SortableContentCard';

// Mock dnd-kit
const mockUseSortable = vi.fn().mockReturnValue({
  attributes: { role: 'button', tabIndex: 0 },
  listeners: {},
  setNodeRef: vi.fn(),
  transform: null,
  transition: null,
  isDragging: false,
});

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: (...args: unknown[]) => mockUseSortable(...args),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: (transform: unknown) =>
        transform ? `translate3d(${(transform as { x: number }).x}px, ${(transform as { y: number }).y}px, 0)` : undefined,
    },
  },
}));

// Mock SelectableContentCard
vi.mock('./SelectableContentCard', () => ({
  SelectableContentCard: ({ title }: { title: string }) => (
    <div data-testid="selectable-card">{title}</div>
  ),
}));

const createItem = (overrides: Partial<{ id: string; title: string }> = {}) => ({
  id: overrides.id || 'item-1',
  type: 'note' as const,
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

describe('SortableContentCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSortable.mockReturnValue({
      attributes: { role: 'button', tabIndex: 0 },
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      transition: null,
      isDragging: false,
    });
  });

  it('should render the underlying SelectableContentCard', () => {
    const item = createItem({ title: 'My Note' });
    render(<SortableContentCard item={item} allTags={[]} disabled={false} />);

    expect(screen.getByTestId('selectable-card')).toBeInTheDocument();
    expect(screen.getByText('My Note')).toBeInTheDocument();
  });

  it('should pass disabled to useSortable', () => {
    const item = createItem();
    render(<SortableContentCard item={item} allTags={[]} disabled={true} />);

    expect(mockUseSortable).toHaveBeenCalledWith(
      expect.objectContaining({ disabled: true }),
    );
  });

  it('should apply cursor-grab class when not disabled', () => {
    const item = createItem();
    const { container } = render(
      <SortableContentCard item={item} allTags={[]} disabled={false} />,
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('cursor-grab');
    expect(wrapper.className).toContain('touch-none');
  });

  it('should not apply cursor-grab class when disabled', () => {
    const item = createItem();
    const { container } = render(
      <SortableContentCard item={item} allTags={[]} disabled={true} />,
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).not.toContain('cursor-grab');
  });

  it('should apply 0.5 opacity when dragging', () => {
    mockUseSortable.mockReturnValue({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      transition: null,
      isDragging: true,
    });

    const item = createItem();
    const { container } = render(
      <SortableContentCard item={item} allTags={[]} disabled={false} />,
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.opacity).toBe('0.5');
  });

  it('should apply transform style when transform is provided', () => {
    mockUseSortable.mockReturnValue({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: { x: 10, y: 20, scaleX: 1, scaleY: 1 },
      transition: 'transform 200ms',
      isDragging: false,
    });

    const item = createItem();
    const { container } = render(
      <SortableContentCard item={item} allTags={[]} disabled={false} />,
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.transform).toBe('translate3d(10px, 20px, 0)');
    expect(wrapper.style.transition).toBe('transform 200ms');
  });

  it('should pass item data to useSortable', () => {
    const item = createItem({ id: 'test-id' });
    render(<SortableContentCard item={item} allTags={[]} disabled={false} />);

    expect(mockUseSortable).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'test-id',
        data: { type: 'content-card', item },
      }),
    );
  });
});
