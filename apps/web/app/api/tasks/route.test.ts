import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock database
const {
  mockReturning,
  mockValues,
  mockOffset,
  mockSelect,
} = vi.hoisted(() => {
  const mockReturning = vi.fn();
  const mockValues = vi.fn(() => ({ returning: mockReturning }));
  const mockOffset = vi.fn();
  const mockLimit = vi.fn(() => ({ offset: mockOffset }));
  const mockOrderBy = vi.fn(() => ({ limit: mockLimit }));
  const mockWhere = vi.fn(() => ({ orderBy: mockOrderBy }));
  const mockFrom = vi.fn(() => ({ where: mockWhere }));
  const mockSelect = vi.fn(() => ({ from: mockFrom }));
  const mockQueryFindFirst = vi.fn();
  const mockQueryFindMany = vi.fn();
  return { mockReturning, mockValues, mockOffset, mockLimit, mockOrderBy, mockWhere, mockFrom, mockSelect, mockQueryFindFirst, mockQueryFindMany };
});

vi.mock('@/lib/db/client', () => ({
  db: {
    select: mockSelect,
    insert: vi.fn(() => ({
      values: mockValues,
    })),
    query: {
      tasks: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
  },
}));

// Mock rate limiting to always allow
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(() => ({ success: true, remaining: 99, resetTime: Date.now() + 60000 })),
  rateLimitExceededResponse: vi.fn(),
  RATE_LIMITS: { api: { maxRequests: 100, windowMs: 60000 } },
}));

// Mock drizzle-orm functions
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: any[]) => ({ type: 'eq', args })),
  and: vi.fn((...args: any[]) => ({ type: 'and', args })),
  desc: vi.fn((col: any) => ({ type: 'desc', col })),
  asc: vi.fn((col: any) => ({ type: 'asc', col })),
  count: vi.fn(() => 'count'),
  relations: vi.fn(() => ({})),
}));

function createRequest(url: string, options?: any): NextRequest {
  return new NextRequest(`http://localhost:3000${url}`, options);
}

describe('Tasks API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/tasks', () => {
    describe('Authentication', () => {
      it('should return 401 when not authenticated', async () => {
        vi.mocked(auth).mockResolvedValue(null as any);

        const request = createRequest('/api/tasks');
        const response = await GET(request);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error).toBe('Unauthorized');
      });

      it('should return 401 when session has no user id', async () => {
        vi.mocked(auth).mockResolvedValue({ user: {} } as any);

        const request = createRequest('/api/tasks');
        const response = await GET(request);

        expect(response.status).toBe(401);
      });
    });

    describe('Validation', () => {
      it('should return 400 for invalid status filter', async () => {
        vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);

        const request = createRequest('/api/tasks?status=invalid');
        const response = await GET(request);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBe('Invalid query parameters');
      });

      it('should return 400 for invalid priority filter', async () => {
        vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);

        const request = createRequest('/api/tasks?priority=urgent');
        const response = await GET(request);

        expect(response.status).toBe(400);
      });
    });

    describe('Success', () => {
      it('should return paginated tasks', async () => {
        vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);

        const mockTasks = [
          { id: 'task-1', title: 'Test Task', status: 'todo', priority: 'medium' },
        ];

        // Mock count query
        mockSelect.mockImplementationOnce(() => ({
          from: vi.fn(() => ({
            where: vi.fn().mockResolvedValue([{ total: 1 }]),
          })),
        }));

        // Mock data query
        mockOffset.mockResolvedValue(mockTasks);

        const request = createRequest('/api/tasks');
        const response = await GET(request);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data).toEqual(mockTasks);
        expect(data.pagination).toBeDefined();
        expect(data.pagination.total).toBe(1);
      });

      it('should filter by status', async () => {
        vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);

        mockSelect.mockImplementationOnce(() => ({
          from: vi.fn(() => ({
            where: vi.fn().mockResolvedValue([{ total: 0 }]),
          })),
        }));
        mockOffset.mockResolvedValue([]);

        const request = createRequest('/api/tasks?status=done');
        const response = await GET(request);

        expect(response.status).toBe(200);
      });
    });

    describe('Error handling', () => {
      it('should return 500 on database error', async () => {
        vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
        mockSelect.mockImplementationOnce(() => {
          throw new Error('DB error');
        });

        const request = createRequest('/api/tasks');
        const response = await GET(request);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data.error).toBe('Internal server error');
      });
    });
  });

  describe('POST /api/tasks', () => {
    describe('Authentication', () => {
      it('should return 401 when not authenticated', async () => {
        vi.mocked(auth).mockResolvedValue(null as any);

        const request = createRequest('/api/tasks', {
          method: 'POST',
          body: JSON.stringify({ title: 'Test' }),
        });
        const response = await POST(request);

        expect(response.status).toBe(401);
      });
    });

    describe('Validation', () => {
      it('should return 400 when title is missing', async () => {
        vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);

        const request = createRequest('/api/tasks', {
          method: 'POST',
          body: JSON.stringify({}),
        });
        const response = await POST(request);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBe('Invalid request');
      });

      it('should return 400 when title is empty', async () => {
        vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);

        const request = createRequest('/api/tasks', {
          method: 'POST',
          body: JSON.stringify({ title: '' }),
        });
        const response = await POST(request);

        expect(response.status).toBe(400);
      });

      it('should return 400 for invalid status', async () => {
        vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);

        const request = createRequest('/api/tasks', {
          method: 'POST',
          body: JSON.stringify({ title: 'Test', status: 'invalid' }),
        });
        const response = await POST(request);

        expect(response.status).toBe(400);
      });

      it('should return 400 for invalid priority', async () => {
        vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);

        const request = createRequest('/api/tasks', {
          method: 'POST',
          body: JSON.stringify({ title: 'Test', priority: 'critical' }),
        });
        const response = await POST(request);

        expect(response.status).toBe(400);
      });
    });

    describe('Success', () => {
      it('should create a task with minimal fields', async () => {
        vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);

        const newTask = {
          id: 'task-1',
          userId: 'user-1',
          title: 'Test Task',
          status: 'todo',
          priority: 'medium',
        };
        mockReturning.mockResolvedValue([newTask]);

        const request = createRequest('/api/tasks', {
          method: 'POST',
          body: JSON.stringify({ title: 'Test Task' }),
        });
        const response = await POST(request);

        expect(response.status).toBe(201);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.title).toBe('Test Task');
      });

      it('should create a task with all fields', async () => {
        vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);

        const newTask = {
          id: 'task-2',
          userId: 'user-1',
          title: 'Full Task',
          description: 'A description',
          status: 'in_progress',
          priority: 'high',
          dueDate: '2025-12-31T00:00:00.000Z',
        };
        mockReturning.mockResolvedValue([newTask]);

        const request = createRequest('/api/tasks', {
          method: 'POST',
          body: JSON.stringify({
            title: 'Full Task',
            description: 'A description',
            status: 'in_progress',
            priority: 'high',
            dueDate: '2025-12-31',
          }),
        });
        const response = await POST(request);

        expect(response.status).toBe(201);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.title).toBe('Full Task');
        expect(data.data.priority).toBe('high');
      });
    });

    describe('Error handling', () => {
      it('should return 500 on database error', async () => {
        vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
        mockReturning.mockRejectedValue(new Error('DB error'));

        const request = createRequest('/api/tasks', {
          method: 'POST',
          body: JSON.stringify({ title: 'Test' }),
        });
        const response = await POST(request);

        expect(response.status).toBe(500);
      });
    });
  });
});
