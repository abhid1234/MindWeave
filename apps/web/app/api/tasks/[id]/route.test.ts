import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH, DELETE } from './route';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock database
const mockReturning = vi.fn();
const mockQueryFindFirst = vi.fn();

vi.mock('@/lib/db/client', () => ({
  db: {
    query: {
      tasks: {
        findFirst: (...args: any[]) => mockQueryFindFirst(...args),
      },
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: mockReturning,
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: mockReturning,
      })),
    })),
  },
}));

// Mock drizzle-orm
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: any[]) => ({ type: 'eq', args })),
  and: vi.fn((...args: any[]) => ({ type: 'and', args })),
  relations: vi.fn(() => ({})),
}));

function createRequest(url: string, options?: RequestInit): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, options as never);
}

const mockParams = (id: string) => ({ params: Promise.resolve({ id }) });

describe('Tasks [id] API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/tasks/[id]', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as any);

      const request = createRequest('/api/tasks/task-1');
      const response = await GET(request, mockParams('task-1'));

      expect(response.status).toBe(401);
    });

    it('should return 404 when task not found', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
      mockQueryFindFirst.mockResolvedValue(null);

      const request = createRequest('/api/tasks/nonexistent');
      const response = await GET(request, mockParams('nonexistent'));

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Task not found');
    });

    it('should return task when found', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
      const mockTask = { id: 'task-1', title: 'Test', status: 'todo', userId: 'user-1' };
      mockQueryFindFirst.mockResolvedValue(mockTask);

      const request = createRequest('/api/tasks/task-1');
      const response = await GET(request, mockParams('task-1'));

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('task-1');
    });

    it('should return 500 on database error', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
      mockQueryFindFirst.mockRejectedValue(new Error('DB error'));

      const request = createRequest('/api/tasks/task-1');
      const response = await GET(request, mockParams('task-1'));

      expect(response.status).toBe(500);
    });
  });

  describe('PATCH /api/tasks/[id]', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as any);

      const request = createRequest('/api/tasks/task-1', {
        method: 'PATCH',
        body: JSON.stringify({ title: 'Updated' }),
      });
      const response = await PATCH(request, mockParams('task-1'));

      expect(response.status).toBe(401);
    });

    it('should return 400 for invalid input', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);

      const request = createRequest('/api/tasks/task-1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'invalid' }),
      });
      const response = await PATCH(request, mockParams('task-1'));

      expect(response.status).toBe(400);
    });

    it('should return 404 when task not found', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
      mockReturning.mockResolvedValue([]);

      const request = createRequest('/api/tasks/nonexistent', {
        method: 'PATCH',
        body: JSON.stringify({ title: 'Updated' }),
      });
      const response = await PATCH(request, mockParams('nonexistent'));

      expect(response.status).toBe(404);
    });

    it('should update task successfully', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
      const updatedTask = { id: 'task-1', title: 'Updated', status: 'todo' };
      mockReturning.mockResolvedValue([updatedTask]);

      const request = createRequest('/api/tasks/task-1', {
        method: 'PATCH',
        body: JSON.stringify({ title: 'Updated' }),
      });
      const response = await PATCH(request, mockParams('task-1'));

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.title).toBe('Updated');
    });

    it('should set completedAt when status changes to done', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
      const updatedTask = { id: 'task-1', status: 'done', completedAt: new Date().toISOString() };
      mockReturning.mockResolvedValue([updatedTask]);

      const request = createRequest('/api/tasks/task-1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'done' }),
      });
      const response = await PATCH(request, mockParams('task-1'));

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data.status).toBe('done');
    });

    it('should return 500 on database error', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
      mockReturning.mockRejectedValue(new Error('DB error'));

      const request = createRequest('/api/tasks/task-1', {
        method: 'PATCH',
        body: JSON.stringify({ title: 'Updated' }),
      });
      const response = await PATCH(request, mockParams('task-1'));

      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /api/tasks/[id]', () => {
    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as any);

      const request = createRequest('/api/tasks/task-1', { method: 'DELETE' });
      const response = await DELETE(request, mockParams('task-1'));

      expect(response.status).toBe(401);
    });

    it('should return 404 when task not found', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
      mockReturning.mockResolvedValue([]);

      const request = createRequest('/api/tasks/nonexistent', { method: 'DELETE' });
      const response = await DELETE(request, mockParams('nonexistent'));

      expect(response.status).toBe(404);
    });

    it('should delete task successfully', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
      mockReturning.mockResolvedValue([{ id: 'task-1' }]);

      const request = createRequest('/api/tasks/task-1', { method: 'DELETE' });
      const response = await DELETE(request, mockParams('task-1'));

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Task deleted');
    });

    it('should return 500 on database error', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
      mockReturning.mockRejectedValue(new Error('DB error'));

      const request = createRequest('/api/tasks/task-1', { method: 'DELETE' });
      const response = await DELETE(request, mockParams('task-1'));

      expect(response.status).toBe(500);
    });
  });
});
