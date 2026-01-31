import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock auth
const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

// Mock db with chainable methods
const mockReturning = vi.fn();
const mockDeleteWhere = vi.fn();
const mockUpdateWhere = vi.fn();
const mockSetFn = vi.fn();
const mockLimit = vi.fn();
const mockSelectWhere = vi.fn();
const mockOrderBy = vi.fn();

vi.mock('@/lib/db/client', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: (...args: unknown[]) => mockSelectWhere(...args),
        orderBy: (...args: unknown[]) => mockOrderBy(...args),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: mockReturning,
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: (...args: unknown[]) => mockSetFn(...args),
    }),
    delete: vi.fn().mockReturnValue({
      where: (...args: unknown[]) => mockDeleteWhere(...args),
    }),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  tasks: {
    id: 'id',
    userId: 'userId',
    title: 'title',
    description: 'description',
    status: 'status',
    priority: 'priority',
    dueDate: 'dueDate',
    completedAt: 'completedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: unknown[]) => args),
  desc: vi.fn(),
  and: vi.fn((...args: unknown[]) => args),
}));

describe('Task Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    // Default: selectWhere returns chainable limit
    mockSelectWhere.mockReturnValue({ limit: mockLimit, orderBy: mockOrderBy });
    mockLimit.mockResolvedValue([]);
    mockSetFn.mockReturnValue({ where: mockUpdateWhere });
    mockUpdateWhere.mockResolvedValue(undefined);
    mockDeleteWhere.mockResolvedValue(undefined);
  });

  describe('getTasksAction', () => {
    it('should return empty when not authenticated', async () => {
      mockAuth.mockResolvedValue(null);
      const { getTasksAction } = await import('./tasks');
      const result = await getTasksAction();
      expect(result.success).toBe(false);
      expect(result.items).toEqual([]);
    });

    it('should fetch tasks successfully', async () => {
      const mockTasks = [
        { id: '1', title: 'Task 1', status: 'todo', priority: 'medium', createdAt: new Date() },
      ];
      mockOrderBy.mockResolvedValue(mockTasks);

      const { getTasksAction } = await import('./tasks');
      const result = await getTasksAction();
      expect(result.success).toBe(true);
      expect(result.items).toEqual(mockTasks);
    });

    it('should pass status filter', async () => {
      mockOrderBy.mockResolvedValue([]);
      const { getTasksAction } = await import('./tasks');
      await getTasksAction({ status: 'done' });
      expect(mockOrderBy).toHaveBeenCalled();
    });

    it('should pass priority filter', async () => {
      mockOrderBy.mockResolvedValue([]);
      const { getTasksAction } = await import('./tasks');
      await getTasksAction({ priority: 'high' });
      expect(mockOrderBy).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockOrderBy.mockRejectedValue(new Error('DB error'));
      const { getTasksAction } = await import('./tasks');
      const result = await getTasksAction();
      expect(result.success).toBe(false);
      expect(result.items).toEqual([]);
    });
  });

  describe('createTaskAction', () => {
    it('should return unauthorized when not logged in', async () => {
      mockAuth.mockResolvedValue(null);
      const { createTaskAction } = await import('./tasks');
      const result = await createTaskAction({ title: 'Test' });
      expect(result.success).toBe(false);
      expect(result.message).toContain('Unauthorized');
    });

    it('should create task successfully', async () => {
      mockReturning.mockResolvedValue([{ id: 'new-task-id' }]);
      const { createTaskAction } = await import('./tasks');
      const result = await createTaskAction({ title: 'New Task', priority: 'high' });
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('new-task-id');
    });

    it('should return validation error for empty title', async () => {
      const { createTaskAction } = await import('./tasks');
      const result = await createTaskAction({ title: '' });
      expect(result.success).toBe(false);
      expect(result.message).toContain('Validation');
    });

    it('should return validation error for title too long', async () => {
      const { createTaskAction } = await import('./tasks');
      const result = await createTaskAction({ title: 'a'.repeat(501) });
      expect(result.success).toBe(false);
      expect(result.message).toContain('Validation');
    });

    it('should return validation error for invalid status', async () => {
      const { createTaskAction } = await import('./tasks');
      const result = await createTaskAction({ title: 'Test', status: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('should return validation error for invalid priority', async () => {
      const { createTaskAction } = await import('./tasks');
      const result = await createTaskAction({ title: 'Test', priority: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('should handle database errors', async () => {
      mockReturning.mockRejectedValue(new Error('DB error'));
      const { createTaskAction } = await import('./tasks');
      const result = await createTaskAction({ title: 'Test' });
      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed');
    });

    it('should accept optional dueDate', async () => {
      mockReturning.mockResolvedValue([{ id: 'new-id' }]);
      const { createTaskAction } = await import('./tasks');
      const result = await createTaskAction({ title: 'Test', dueDate: '2026-03-01' });
      expect(result.success).toBe(true);
    });
  });

  describe('updateTaskAction', () => {
    it('should return unauthorized when not logged in', async () => {
      mockAuth.mockResolvedValue(null);
      const { updateTaskAction } = await import('./tasks');
      const result = await updateTaskAction('task-1', { title: 'Updated' });
      expect(result.success).toBe(false);
      expect(result.message).toContain('Unauthorized');
    });

    it('should return not found when task does not exist', async () => {
      mockLimit.mockResolvedValue([]);
      const { updateTaskAction } = await import('./tasks');
      const result = await updateTaskAction('nonexistent', { title: 'Updated' });
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should update task successfully', async () => {
      mockLimit.mockResolvedValue([{ id: 'task-1' }]);

      const { updateTaskAction } = await import('./tasks');
      const result = await updateTaskAction('task-1', { title: 'Updated Title' });
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('task-1');
    });

    it('should set completedAt when status changes to done', async () => {
      mockLimit.mockResolvedValue([{ id: 'task-1' }]);

      const { updateTaskAction } = await import('./tasks');
      await updateTaskAction('task-1', { status: 'done' });

      const setArg = mockSetFn.mock.calls[0][0];
      expect(setArg.status).toBe('done');
      expect(setArg.completedAt).toBeInstanceOf(Date);
    });

    it('should clear completedAt when status changes from done', async () => {
      mockLimit.mockResolvedValue([{ id: 'task-1' }]);

      const { updateTaskAction } = await import('./tasks');
      await updateTaskAction('task-1', { status: 'todo' });

      const setArg = mockSetFn.mock.calls[0][0];
      expect(setArg.status).toBe('todo');
      expect(setArg.completedAt).toBeNull();
    });

    it('should handle database errors', async () => {
      mockLimit.mockRejectedValue(new Error('DB error'));
      const { updateTaskAction } = await import('./tasks');
      const result = await updateTaskAction('task-1', { title: 'Updated' });
      expect(result.success).toBe(false);
    });
  });

  describe('deleteTaskAction', () => {
    it('should return unauthorized when not logged in', async () => {
      mockAuth.mockResolvedValue(null);
      const { deleteTaskAction } = await import('./tasks');
      const result = await deleteTaskAction('task-1');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Unauthorized');
    });

    it('should return not found when task does not exist', async () => {
      mockLimit.mockResolvedValue([]);
      const { deleteTaskAction } = await import('./tasks');
      const result = await deleteTaskAction('nonexistent');
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should delete task successfully', async () => {
      mockLimit.mockResolvedValue([{ id: 'task-1' }]);

      const { deleteTaskAction } = await import('./tasks');
      const result = await deleteTaskAction('task-1');
      expect(result.success).toBe(true);
    });

    it('should handle database errors', async () => {
      mockLimit.mockRejectedValue(new Error('DB error'));
      const { deleteTaskAction } = await import('./tasks');
      const result = await deleteTaskAction('task-1');
      expect(result.success).toBe(false);
    });
  });

  describe('toggleTaskDoneAction', () => {
    it('should return unauthorized when not logged in', async () => {
      mockAuth.mockResolvedValue(null);
      const { toggleTaskDoneAction } = await import('./tasks');
      const result = await toggleTaskDoneAction('task-1');
      expect(result.success).toBe(false);
    });

    it('should return not found when task does not exist', async () => {
      mockSelectWhere.mockResolvedValue([]);
      const { toggleTaskDoneAction } = await import('./tasks');
      const result = await toggleTaskDoneAction('nonexistent');
      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should toggle from todo to done', async () => {
      mockSelectWhere.mockResolvedValue([{ id: 'task-1', status: 'todo' }]);

      const { toggleTaskDoneAction } = await import('./tasks');
      const result = await toggleTaskDoneAction('task-1');
      expect(result.success).toBe(true);
      expect(result.message).toContain('completed');

      const setArg = mockSetFn.mock.calls[0][0];
      expect(setArg.status).toBe('done');
      expect(setArg.completedAt).toBeInstanceOf(Date);
    });

    it('should toggle from done to todo', async () => {
      mockSelectWhere.mockResolvedValue([{ id: 'task-1', status: 'done' }]);

      const { toggleTaskDoneAction } = await import('./tasks');
      const result = await toggleTaskDoneAction('task-1');
      expect(result.success).toBe(true);
      expect(result.message).toContain('reopened');

      const setArg = mockSetFn.mock.calls[0][0];
      expect(setArg.status).toBe('todo');
      expect(setArg.completedAt).toBeNull();
    });

    it('should handle database errors', async () => {
      mockSelectWhere.mockRejectedValue(new Error('DB error'));
      const { toggleTaskDoneAction } = await import('./tasks');
      const result = await toggleTaskDoneAction('task-1');
      expect(result.success).toBe(false);
    });
  });
});
