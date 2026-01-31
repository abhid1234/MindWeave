import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { TaskItem } from '@/app/actions/tasks';

// Mock useToast
vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({ addToast: vi.fn(), toasts: [], removeToast: vi.fn() }),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn().mockReturnValue({ push: vi.fn() }),
  useSearchParams: vi.fn().mockReturnValue(new URLSearchParams()),
}));

// Mock server actions
vi.mock('@/app/actions/tasks', () => ({
  toggleTaskDoneAction: vi.fn().mockResolvedValue({ success: true, message: 'Done' }),
  deleteTaskAction: vi.fn().mockResolvedValue({ success: true, message: 'Deleted' }),
  createTaskAction: vi.fn().mockResolvedValue({ success: true, message: 'Created', data: { id: '1' } }),
  updateTaskAction: vi.fn().mockResolvedValue({ success: true, message: 'Updated', data: { id: '1' } }),
}));

// Mock TaskDialog and DeleteTaskDialog to avoid Radix dialog complexities
vi.mock('./TaskDialog', () => ({
  TaskDialog: ({ trigger }: { trigger: React.ReactNode }) => <>{trigger}</>,
}));

vi.mock('./DeleteTaskDialog', () => ({
  DeleteTaskDialog: ({ trigger }: { trigger: React.ReactNode }) => <>{trigger}</>,
}));

// Mock radix dropdown menu
vi.mock('@radix-ui/react-dropdown-menu', () => ({
  Root: ({ children }: any) => <div>{children}</div>,
  Trigger: ({ children, asChild }: any) => asChild ? children : <button>{children}</button>,
  Portal: ({ children }: any) => <div>{children}</div>,
  Content: React.forwardRef(({ children, ...props }: any, ref: any) => <div ref={ref} {...props}>{children}</div>),
  Item: React.forwardRef(({ children, onSelect, ...props }: any, ref: any) => (
    <div ref={ref} role="menuitem" onClick={onSelect} {...props}>{children}</div>
  )),
  Separator: () => <hr />,
  Sub: ({ children }: any) => <div>{children}</div>,
  SubTrigger: ({ children }: any) => <div>{children}</div>,
  SubContent: ({ children }: any) => <div>{children}</div>,
  Group: ({ children }: any) => <div>{children}</div>,
  Label: ({ children }: any) => <div>{children}</div>,
  CheckboxItem: ({ children }: any) => <div>{children}</div>,
  RadioGroup: ({ children }: any) => <div>{children}</div>,
  RadioItem: ({ children }: any) => <div>{children}</div>,
  ItemIndicator: ({ children }: any) => <div>{children}</div>,
}));

import { TaskList } from './TaskList';

const mockTask: TaskItem = {
  id: 'task-1',
  title: 'Test Task',
  description: 'A test description',
  status: 'todo',
  priority: 'medium',
  dueDate: null,
  completedAt: null,
  createdAt: new Date('2026-01-20'),
  updatedAt: new Date('2026-01-20'),
};

describe('TaskList', () => {
  describe('Empty state', () => {
    it('should show empty state when no tasks', () => {
      render(<TaskList items={[]} />);
      expect(screen.getByText('No tasks yet')).toBeInTheDocument();
      expect(screen.getByText('Create your first task to get started.')).toBeInTheDocument();
    });

    it('should show Add Task button in empty state', () => {
      render(<TaskList items={[]} />);
      const buttons = screen.getAllByRole('button');
      const addTaskButtons = buttons.filter((btn) => btn.textContent?.includes('Add Task'));
      expect(addTaskButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('should show 0 tasks count', () => {
      render(<TaskList items={[]} />);
      expect(screen.getByText('0 tasks')).toBeInTheDocument();
    });
  });

  describe('With tasks', () => {
    it('should render task items', () => {
      render(<TaskList items={[mockTask]} />);
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    it('should show correct count for single task', () => {
      render(<TaskList items={[mockTask]} />);
      expect(screen.getByText('1 task')).toBeInTheDocument();
    });

    it('should show correct count for multiple tasks', () => {
      const tasks = [
        mockTask,
        { ...mockTask, id: 'task-2', title: 'Task 2' },
        { ...mockTask, id: 'task-3', title: 'Task 3' },
      ];
      render(<TaskList items={tasks} />);
      expect(screen.getByText('3 tasks')).toBeInTheDocument();
    });

    it('should render all tasks', () => {
      const tasks = [
        mockTask,
        { ...mockTask, id: 'task-2', title: 'Second Task' },
      ];
      render(<TaskList items={tasks} />);
      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(screen.getByText('Second Task')).toBeInTheDocument();
    });

    it('should show Add Task button in header', () => {
      render(<TaskList items={[mockTask]} />);
      const buttons = screen.getAllByRole('button');
      const addTaskButtons = buttons.filter((btn) => btn.textContent?.includes('Add Task'));
      expect(addTaskButtons.length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('TaskItem rendering', () => {
  it('should show task description', () => {
    render(<TaskList items={[mockTask]} />);
    expect(screen.getByText('A test description')).toBeInTheDocument();
  });

  it('should show priority badge', () => {
    render(<TaskList items={[mockTask]} />);
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('should show status badge', () => {
    render(<TaskList items={[mockTask]} />);
    expect(screen.getByText('Todo')).toBeInTheDocument();
  });

  it('should show high priority badge for high priority task', () => {
    const highTask = { ...mockTask, priority: 'high' };
    render(<TaskList items={[highTask]} />);
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('should show checkbox', () => {
    render(<TaskList items={[mockTask]} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('should show checked checkbox for done task', () => {
    const doneTask = { ...mockTask, status: 'done' };
    render(<TaskList items={[doneTask]} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('should show due date when present', () => {
    const taskWithDue = { ...mockTask, dueDate: new Date('2026-03-15') };
    render(<TaskList items={[taskWithDue]} />);
    expect(screen.getByText(/Due:/)).toBeInTheDocument();
  });

  it('should show overdue indicator for past due date', () => {
    const overdueTask = { ...mockTask, dueDate: new Date('2020-01-01') };
    render(<TaskList items={[overdueTask]} />);
    expect(screen.getByText(/overdue/)).toBeInTheDocument();
  });

  it('should not show overdue for done tasks with past due date', () => {
    const doneOverdue = { ...mockTask, status: 'done', dueDate: new Date('2020-01-01') };
    render(<TaskList items={[doneOverdue]} />);
    expect(screen.queryByText(/overdue/)).not.toBeInTheDocument();
  });

  it('should apply strikethrough to done task title', () => {
    const doneTask = { ...mockTask, status: 'done' };
    render(<TaskList items={[doneTask]} />);
    const title = screen.getByText('Test Task');
    expect(title).toHaveClass('line-through');
  });

  it('should not apply strikethrough to todo task title', () => {
    render(<TaskList items={[mockTask]} />);
    const title = screen.getByText('Test Task');
    expect(title).not.toHaveClass('line-through');
  });

  it('should not show description when null', () => {
    const noDescTask = { ...mockTask, description: null };
    render(<TaskList items={[noDescTask]} />);
    expect(screen.queryByText('A test description')).not.toBeInTheDocument();
  });
});
