import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

const { mockDbSelect, mockDbUpdate, mockSendPushNotification } = vi.hoisted(() => ({
  mockDbSelect: vi.fn(),
  mockDbUpdate: vi.fn(),
  mockSendPushNotification: vi.fn(),
}));

vi.mock('@/lib/db/client', () => {
  const makeSelectChain = () => {
    const chain: Record<string, unknown> = {};
    chain.from = vi.fn(() => chain);
    chain.where = vi.fn(() => chain);
    chain.orderBy = vi.fn(() => chain);
    chain.limit = vi.fn(() => chain);
    chain.innerJoin = vi.fn(() => chain);
    chain.then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) =>
      Promise.resolve(mockDbSelect()).then(resolve, reject);
    return chain;
  };

  return {
    db: {
      select: () => makeSelectChain(),
      update: () => ({
        set: vi.fn(() => ({
          where: vi.fn(() => mockDbUpdate()),
        })),
      }),
    },
  };
});

vi.mock('@/lib/db/schema', () => ({
  reminders: {
    id: 'id',
    userId: 'userId',
    contentId: 'contentId',
    interval: 'interval',
    nextRemindAt: 'nextRemindAt',
    status: 'status',
  },
  content: {
    id: 'id',
    title: 'title',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: unknown[]) => ({ op: 'eq', args })),
  and: vi.fn((...args: unknown[]) => ({ op: 'and', args })),
  sql: vi.fn(),
}));

vi.mock('@/lib/push-notifications', () => ({
  sendPushNotification: (...args: unknown[]) => mockSendPushNotification(...args),
}));

vi.mock('@/lib/reminder-utils', () => ({
  getNextInterval: (interval: string): string | null => {
    const progression: Record<string, string | null> = {
      '1d': '3d',
      '3d': '7d',
      '7d': '30d',
      '30d': null,
    };
    return progression[interval] ?? null;
  },
  getNextRemindAt: (interval: string): Date => {
    const ms: Record<string, number> = {
      '1d': 86400000,
      '3d': 259200000,
      '7d': 604800000,
      '30d': 2592000000,
    };
    if (!ms[interval]) throw new Error(`Invalid interval: ${interval}`);
    return new Date(Date.now() + ms[interval]);
  },
}));

import { POST } from './route';

function createCronRequest(secret?: string): NextRequest {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (secret) {
    headers['authorization'] = `Bearer ${secret}`;
  }
  return new NextRequest('http://localhost:3000/api/cron/reminders', {
    method: 'POST',
    headers,
  });
}

describe('/api/cron/reminders', () => {
  const originalEnv = process.env.CRON_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'test-secret';
    mockSendPushNotification.mockResolvedValue({ sent: 1, failed: 0 });
  });

  afterEach(() => {
    vi.resetAllMocks();
    if (originalEnv !== undefined) {
      process.env.CRON_SECRET = originalEnv;
    } else {
      delete process.env.CRON_SECRET;
    }
  });

  it('should return 401 without valid authorization header', async () => {
    const request = createCronRequest('wrong-secret');

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 500 when CRON_SECRET is not configured', async () => {
    delete process.env.CRON_SECRET;

    const request = createCronRequest('any-secret');

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('CRON_SECRET not configured');
  });

  it('should process due reminders and send push notifications', async () => {
    const dueReminders = [
      { id: 'rem-1', userId: 'user-1', contentId: 'c-1', interval: '1d', title: 'Learn React' },
      { id: 'rem-2', userId: 'user-2', contentId: 'c-2', interval: '3d', title: 'Node.js Guide' },
    ];
    mockDbSelect.mockResolvedValueOnce(dueReminders);
    mockDbUpdate.mockResolvedValue(undefined);

    const request = createCronRequest('test-secret');
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.due).toBe(2);
    expect(data.processed).toBe(2);
    expect(data.completed).toBe(0);

    // Verify push notifications were sent for each reminder
    expect(mockSendPushNotification).toHaveBeenCalledTimes(2);
    expect(mockSendPushNotification).toHaveBeenCalledWith('user-1', 'Time to revisit!', 'Learn React');
    expect(mockSendPushNotification).toHaveBeenCalledWith('user-2', 'Time to revisit!', 'Node.js Guide');
  });

  it('should advance intervals correctly (1d to 3d)', async () => {
    // A reminder at '1d' should advance to '3d' (not completed)
    const dueReminders = [
      { id: 'rem-1', userId: 'user-1', contentId: 'c-1', interval: '1d', title: 'My Note' },
    ];
    mockDbSelect.mockResolvedValueOnce(dueReminders);
    mockDbUpdate.mockResolvedValue(undefined);

    const request = createCronRequest('test-secret');
    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.processed).toBe(1);
    expect(data.completed).toBe(0); // '1d' advances to '3d', not completed
  });

  it('should mark 30d reminders as completed', async () => {
    // A reminder at '30d' has no next interval, so it should be completed
    const dueReminders = [
      { id: 'rem-1', userId: 'user-1', contentId: 'c-1', interval: '30d', title: 'Final Review' },
    ];
    mockDbSelect.mockResolvedValueOnce(dueReminders);
    mockDbUpdate.mockResolvedValue(undefined);

    const request = createCronRequest('test-secret');
    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.processed).toBe(1);
    expect(data.completed).toBe(1); // '30d' has no next interval, marked completed
  });

  it('should return empty result when no due reminders', async () => {
    mockDbSelect.mockResolvedValueOnce([]);

    const request = createCronRequest('test-secret');
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.due).toBe(0);
    expect(data.processed).toBe(0);
    expect(data.completed).toBe(0);
  });
});
