import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockAuth, mockDbSelect, mockDbInsert, mockDbUpdate } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDbSelect: vi.fn(),
  mockDbInsert: vi.fn(),
  mockDbUpdate: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

vi.mock('@/lib/db/client', () => {
  const makeChain = () => {
    const chain: Record<string, unknown> = {};
    chain.from = vi.fn(() => chain);
    chain.where = vi.fn(() => chain);
    chain.orderBy = vi.fn(() => chain);
    chain.limit = vi.fn(() => mockDbSelect());
    chain.innerJoin = vi.fn(() => chain);
    chain.then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) =>
      Promise.resolve(mockDbSelect()).then(resolve, reject);
    return chain;
  };

  return {
    db: {
      select: () => makeChain(),
      insert: () => ({
        values: vi.fn(() => ({
          returning: vi.fn(() => mockDbInsert()),
        })),
      }),
      update: () => ({
        set: vi.fn(() => ({
          where: vi.fn(() => mockDbUpdate()),
        })),
      }),
    },
  };
});

vi.mock('@/lib/db/schema', () => ({
  content: {
    id: 'id',
    userId: 'userId',
    title: 'title',
    type: 'type',
  },
  reminders: {
    id: 'id',
    userId: 'userId',
    contentId: 'contentId',
    interval: 'interval',
    nextRemindAt: 'nextRemindAt',
    status: 'status',
    createdAt: 'createdAt',
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  checkServerActionRateLimit: () => ({ success: true }),
  RATE_LIMITS: {
    serverAction: { maxRequests: 30, windowMs: 60000 },
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: unknown[]) => ({ op: 'eq', args })),
  and: vi.fn((...args: unknown[]) => ({ op: 'and', args })),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import {
  setReminderAction,
  dismissReminderAction,
  snoozeReminderAction,
  getActiveRemindersAction,
} from './reminders';
import { getNextRemindAt, getNextInterval } from '@/lib/reminder-utils';

const VALID_UUID = '00000000-0000-0000-0000-000000000001';
const VALID_UUID_2 = '00000000-0000-0000-0000-000000000002';

describe('Reminder Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ── Helper functions ──────────────────────────────────────────────

  describe('getNextRemindAt', () => {
    it('should return a future date for a valid interval', () => {
      const before = Date.now();
      const result = getNextRemindAt('1d');
      const after = Date.now();

      expect(result).toBeInstanceOf(Date);
      // 1d = 86400000 ms
      expect(result.getTime()).toBeGreaterThanOrEqual(before + 86400000);
      expect(result.getTime()).toBeLessThanOrEqual(after + 86400000);
    });

    it('should throw for an invalid interval', () => {
      expect(() => getNextRemindAt('99d')).toThrow('Invalid interval: 99d');
    });
  });

  describe('getNextInterval', () => {
    it('should return correct progression for each interval', () => {
      expect(getNextInterval('1d')).toBe('3d');
      expect(getNextInterval('3d')).toBe('7d');
      expect(getNextInterval('7d')).toBe('30d');
      expect(getNextInterval('30d')).toBeNull();
    });

    it('should return null for unknown interval', () => {
      expect(getNextInterval('unknown')).toBeNull();
    });
  });

  // ── setReminderAction ─────────────────────────────────────────────

  describe('setReminderAction', () => {
    it('should return unauthorized when not logged in', async () => {
      mockAuth.mockResolvedValueOnce(null);

      const result = await setReminderAction({ contentId: VALID_UUID, interval: '1d' });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
    });

    it('should return error when content not found', async () => {
      // First select: content ownership check returns empty
      mockDbSelect.mockResolvedValueOnce([]);

      const result = await setReminderAction({ contentId: VALID_UUID, interval: '7d' });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Content not found');
    });

    it('should return error when active reminder already exists', async () => {
      // First select: content ownership check returns item
      mockDbSelect.mockResolvedValueOnce([{ id: VALID_UUID }]);
      // Second select: existing reminder check returns active reminder
      mockDbSelect.mockResolvedValueOnce([{ id: 'existing-rem' }]);

      const result = await setReminderAction({ contentId: VALID_UUID, interval: '1d' });

      expect(result.success).toBe(false);
      expect(result.message).toBe('An active reminder already exists for this content');
    });

    it('should successfully create a reminder with 1d interval', async () => {
      // First select: content found
      mockDbSelect.mockResolvedValueOnce([{ id: VALID_UUID }]);
      // Second select: no existing reminder
      mockDbSelect.mockResolvedValueOnce([]);
      mockDbInsert.mockResolvedValueOnce([{ id: 'rem-1' }]);

      const result = await setReminderAction({ contentId: VALID_UUID, interval: '1d' });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Reminder set successfully');
    });

    it('should successfully create a reminder with 7d interval', async () => {
      mockDbSelect.mockResolvedValueOnce([{ id: VALID_UUID }]);
      mockDbSelect.mockResolvedValueOnce([]);
      mockDbInsert.mockResolvedValueOnce([{ id: 'rem-2' }]);

      const result = await setReminderAction({ contentId: VALID_UUID, interval: '7d' });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Reminder set successfully');
    });

    it('should return validation error for invalid contentId', async () => {
      const result = await setReminderAction({ contentId: 'not-a-uuid', interval: '1d' });

      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
      // Zod validation error for invalid UUID
      expect(result.message).toContain('Invalid content ID');
    });
  });

  // ── dismissReminderAction ─────────────────────────────────────────

  describe('dismissReminderAction', () => {
    it('should return unauthorized when not logged in', async () => {
      mockAuth.mockResolvedValueOnce(null);

      const result = await dismissReminderAction(VALID_UUID);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
    });

    it('should return error when reminder not found', async () => {
      mockDbSelect.mockResolvedValueOnce([]);

      const result = await dismissReminderAction(VALID_UUID);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Reminder not found');
    });

    it('should successfully dismiss a reminder', async () => {
      mockDbSelect.mockResolvedValueOnce([{ id: VALID_UUID }]);
      mockDbUpdate.mockResolvedValueOnce(undefined);

      const result = await dismissReminderAction(VALID_UUID);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Reminder dismissed');
    });
  });

  // ── snoozeReminderAction ──────────────────────────────────────────

  describe('snoozeReminderAction', () => {
    it('should return unauthorized when not logged in', async () => {
      mockAuth.mockResolvedValueOnce(null);

      const result = await snoozeReminderAction({ reminderId: VALID_UUID, duration: '1d' });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
    });

    it('should return error when reminder not found', async () => {
      mockDbSelect.mockResolvedValueOnce([]);

      const result = await snoozeReminderAction({ reminderId: VALID_UUID, duration: '3d' });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Reminder not found');
    });

    it('should successfully snooze a reminder', async () => {
      mockDbSelect.mockResolvedValueOnce([{ id: VALID_UUID }]);
      mockDbUpdate.mockResolvedValueOnce(undefined);

      const result = await snoozeReminderAction({ reminderId: VALID_UUID, duration: '7d' });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Reminder snoozed');
    });
  });

  // ── getActiveRemindersAction ──────────────────────────────────────

  describe('getActiveRemindersAction', () => {
    it('should return unauthorized when not logged in', async () => {
      mockAuth.mockResolvedValueOnce(null);

      const result = await getActiveRemindersAction();

      expect(result.success).toBe(false);
      expect(result.reminders).toEqual([]);
      expect(result.message).toBe('Unauthorized');
    });

    it('should return active reminders list', async () => {
      const now = new Date();
      const mockReminders = [
        {
          id: 'rem-1',
          contentId: VALID_UUID,
          title: 'My Note',
          type: 'note',
          interval: '1d',
          nextRemindAt: now,
        },
        {
          id: 'rem-2',
          contentId: VALID_UUID_2,
          title: 'My Link',
          type: 'link',
          interval: '7d',
          nextRemindAt: now,
        },
      ];
      mockDbSelect.mockResolvedValueOnce(mockReminders);

      const result = await getActiveRemindersAction();

      expect(result.success).toBe(true);
      expect(result.reminders).toHaveLength(2);
      expect(result.reminders[0].title).toBe('My Note');
      expect(result.reminders[1].type).toBe('link');
    });

    it('should return empty array when no reminders exist', async () => {
      mockDbSelect.mockResolvedValueOnce([]);

      const result = await getActiveRemindersAction();

      expect(result.success).toBe(true);
      expect(result.reminders).toEqual([]);
    });
  });
});
