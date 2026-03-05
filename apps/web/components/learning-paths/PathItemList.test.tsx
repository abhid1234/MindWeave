import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PathItemList } from './PathItemList';
import type { LearningPathDetailItem } from '@/app/actions/learning-paths';

vi.mock('@/app/actions/learning-paths', () => ({
  toggleItemProgressAction: vi.fn().mockResolvedValue({ success: true, completed: true }),
  removeItemFromPathAction: vi.fn().mockResolvedValue({ success: true }),
  reorderPathItemsAction: vi.fn().mockResolvedValue({ success: true }),
}));

const { toggleItemProgressAction, removeItemFromPathAction, reorderPathItemsAction } =
  await import('@/app/actions/learning-paths');

describe('PathItemList', () => {
  const baseItems: LearningPathDetailItem[] = [
    {
      id: 'item-1',
      contentId: 'content-1',
      position: 0,
      isOptional: false,
      contentTitle: 'Introduction to React',
      contentType: 'note',
      contentBody: null,
      isCompleted: false,
    },
    {
      id: 'item-2',
      contentId: 'content-2',
      position: 1,
      isOptional: true,
      contentTitle: 'React Hooks Reference',
      contentType: 'link',
      contentBody: null,
      isCompleted: true,
    },
  ];

  const onUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render empty state when no items', () => {
    render(<PathItemList pathId="p1" items={[]} onUpdate={onUpdate} />);
    expect(screen.getByText('No items yet. Add content to get started.')).toBeInTheDocument();
  });

  it('should render item titles', () => {
    render(<PathItemList pathId="p1" items={baseItems} onUpdate={onUpdate} />);
    expect(screen.getByText('Introduction to React')).toBeInTheDocument();
    expect(screen.getByText('React Hooks Reference')).toBeInTheDocument();
  });

  it('should show optional badge for optional items', () => {
    render(<PathItemList pathId="p1" items={baseItems} onUpdate={onUpdate} />);
    expect(screen.getByText('optional')).toBeInTheDocument();
  });

  it('should show position numbers', () => {
    render(<PathItemList pathId="p1" items={baseItems} onUpdate={onUpdate} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should toggle completion on checkbox click', async () => {
    const user = userEvent.setup();
    render(<PathItemList pathId="p1" items={baseItems} onUpdate={onUpdate} />);

    const checkboxes = screen.getAllByLabelText(/Mark as/);
    await user.click(checkboxes[0]);

    await waitFor(() => {
      expect(toggleItemProgressAction).toHaveBeenCalledWith({
        pathId: 'p1',
        contentId: 'content-1',
      });
      expect(onUpdate).toHaveBeenCalled();
    });
  });

  it('should remove item on delete click', async () => {
    const user = userEvent.setup();
    render(<PathItemList pathId="p1" items={baseItems} onUpdate={onUpdate} />);

    const removeButtons = screen.getAllByLabelText('Remove item');
    await user.click(removeButtons[0]);

    await waitFor(() => {
      expect(removeItemFromPathAction).toHaveBeenCalledWith('item-1', 'p1');
      expect(onUpdate).toHaveBeenCalled();
    });
  });

  it('should disable move up for first item', () => {
    render(<PathItemList pathId="p1" items={baseItems} onUpdate={onUpdate} />);
    const moveUpButtons = screen.getAllByLabelText('Move up');
    expect(moveUpButtons[0]).toBeDisabled();
  });

  it('should disable move down for last item', () => {
    render(<PathItemList pathId="p1" items={baseItems} onUpdate={onUpdate} />);
    const moveDownButtons = screen.getAllByLabelText('Move down');
    expect(moveDownButtons[moveDownButtons.length - 1]).toBeDisabled();
  });

  it('should reorder items on move down click', async () => {
    const user = userEvent.setup();
    render(<PathItemList pathId="p1" items={baseItems} onUpdate={onUpdate} />);

    const moveDownButtons = screen.getAllByLabelText('Move down');
    await user.click(moveDownButtons[0]);

    await waitFor(() => {
      expect(reorderPathItemsAction).toHaveBeenCalledWith({
        pathId: 'p1',
        itemIds: ['item-2', 'item-1'],
      });
      expect(onUpdate).toHaveBeenCalled();
    });
  });

  it('should apply line-through styling for completed items', () => {
    render(<PathItemList pathId="p1" items={baseItems} onUpdate={onUpdate} />);
    const completedTitle = screen.getByText('React Hooks Reference');
    expect(completedTitle).toHaveClass('line-through');
  });
});
