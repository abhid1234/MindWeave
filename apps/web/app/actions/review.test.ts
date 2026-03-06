import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getReviewQueueAction, markReviewedAction } from './review';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock database
vi.mock('@/lib/db/client', () => {
  const createChain = () => {
    const chain: Record<string, unknown> = {};
    const methods = [
      'from', 'where', 'innerJoin', 'leftJoin', 'orderBy',
      'groupBy', 'limit', 'offset', 'set', 'values',
      'returning', 'onConflictDoNothing',
    ];
    for (const method of methods) {
      chain[method] = vi.fn().mockReturnValue(chain);
    }
    chain.then = (resolve: (v: unknown[]) => unknown) => Promise.resolve([]).then(resolve);
    return chain;
  };

  return {
    db: {
      select: vi.fn().mockReturnValue(createChain()),
      insert: vi.fn().mockReturnValue(createChain()),
      update: vi.fn().mockReturnValue(createChain()),
      delete: vi.fn().mockReturnValue(createChain()),
      execute: vi.fn().mockResolvedValue([]),
    },
  };
});

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// Mock rate limit
vi.mock('@/lib/rate-limit', () => ({
  checkServerActionRateLimit: vi.fn().mockReturnValue({ success: true }),
  RATE_LIMITS: { serverAction: { windowMs: 60000, maxRequests: 60 } },
}));

// Mock badges
vi.mock('./badges', () => ({
  checkAndUnlockBadgesAction: vi.fn().mockResolvedValue({ success: true }),
}));

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { checkServerActionRateLimit } from '@/lib/rate-limit';
import { checkAndUnlockBadgesAction } from './badges';

const mockAuth = vi.mocked(auth);
const mockRateLimit = vi.mocked(checkServerActionRateLimit);

function mockDbSelectSequential(...results: unknown[][]) {
  let callCount = 0;
  vi.mocked(db.select).mockImplementation(() => {
    const idx = Math.min(callCount++, results.length - 1);
    const resolveValue = results[idx];
    const chain: Record<string, unknown> = {};
    const methods = [
      'from', 'where', 'innerJoin', 'leftJoin', 'orderBy',
      'groupBy', 'limit', 'offset', 'onConflictDoNothing',
    ];
    for (const method of methods) {
      chain[method] = vi.fn().mockReturnValue(chain);
    }
    chain.then = (resolve: (v: unknown) => unknown) => Promise.resolve(resolveValue).then(resolve);
    return chain as never;
  });
}

function mockDbInsert() {
  const insertChain: Record<string, unknown> = {};
  const methods = ['values', 'onConflictDoNothing', 'returning'];
  for (const method of methods) {
    insertChain[method] = vi.fn().mockReturnValue(insertChain);
  }
  insertChain.then = (resolve: (v: unknown) => unknown) => Promise.resolve([]).then(resolve);
  vi.mocked(db.insert).mockReturnValue(insertChain as never);
}

describe('getReviewQueueAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never);
    mockRateLimit.mockReturnValue({ success: true });
  });

  it('should return unauthorized when not logged in', async () => {
    mockAuth.mockResolvedValue(null as never);
    const result = await getReviewQueueAction();
    expect(result.success).toBe(false);
    expect(result.message).toBe('Unauthorized');
    expect(result.queue).toEqual([]);
  });

  it('should return rate limit error when rate limited', async () => {
    mockRateLimit.mockReturnValue({ success: false, message: 'Too many requests' });
    const result = await getReviewQueueAction();
    expect(result.success).toBe(false);
    expect(result.message).toBe('Too many requests');
  });

  it('should return empty queue when no items available', async () => {
    // reviewedToday, flashcards, reminders, stale, rediscovery
    mockDbSelectSequential([], [], [], [], []);
    const result = await getReviewQueueAction();
    expect(result.success).toBe(true);
    expect(result.queue).toEqual([]);
  });

  it('should return due flashcards', async () => {
    mockDbSelectSequential(
      [], // reviewedToday
      [{ flashcardId: 'fc-1', contentId: 'c-1', question: 'Q1?', answer: 'A1', title: 'Card 1', body: 'Body', contentType: 'note', tags: ['js'] }],
      [], // reminders
      [], // stale
      []  // rediscovery
    );

    const result = await getReviewQueueAction();
    expect(result.success).toBe(true);
    expect(result.queue).toHaveLength(1);
    expect(result.queue[0].type).toBe('flashcard');
    expect(result.queue[0].source).toBe('flashcard');
    expect(result.queue[0].label).toBe('Flashcard');
    expect(result.queue[0].question).toBe('Q1?');
    expect(result.queue[0].flashcardId).toBe('fc-1');
  });

  it('should return due reminders', async () => {
    mockDbSelectSequential(
      [], // reviewedToday
      [], // flashcards
      [{ reminderId: 'rem-1', contentId: 'c-2', title: 'Reminder 1', body: 'Body', contentType: 'link', tags: [] }],
      [], // stale
      []  // rediscovery
    );

    const result = await getReviewQueueAction();
    expect(result.success).toBe(true);
    expect(result.queue).toHaveLength(1);
    expect(result.queue[0].type).toBe('reminder');
    expect(result.queue[0].source).toBe('reminder');
    expect(result.queue[0].label).toBe('Due Reminder');
    expect(result.queue[0].reminderId).toBe('rem-1');
  });

  it('should return stale content', async () => {
    mockDbSelectSequential(
      [], // reviewedToday
      [], // flashcards
      [], // reminders
      [{ id: 'c-3', title: 'Old Note', body: 'Forgotten', contentType: 'note', tags: ['old'] }],
      []  // rediscovery
    );

    const result = await getReviewQueueAction();
    expect(result.success).toBe(true);
    expect(result.queue).toHaveLength(1);
    expect(result.queue[0].type).toBe('content');
    expect(result.queue[0].source).toBe('stale');
    expect(result.queue[0].label).toBe('Forgotten Gem');
  });

  it('should return rediscovery content', async () => {
    mockDbSelectSequential(
      [], // reviewedToday
      [], // flashcards
      [], // reminders
      [], // stale
      [{ id: 'c-4', title: 'Rediscovered', body: null, contentType: 'link', tags: [] }]
    );

    const result = await getReviewQueueAction();
    expect(result.success).toBe(true);
    expect(result.queue).toHaveLength(1);
    expect(result.queue[0].type).toBe('content');
    expect(result.queue[0].source).toBe('rediscovery');
    expect(result.queue[0].label).toBe('Rediscovery');
  });

  it('should exclude items already reviewed today', async () => {
    mockDbSelectSequential(
      [{ contentId: 'c-1' }], // reviewedToday - c-1 already reviewed
      [{ flashcardId: 'fc-1', contentId: 'c-1', question: 'Q?', answer: 'A', title: 'T', body: null, contentType: 'note', tags: [] }],
      [], [], []
    );

    const result = await getReviewQueueAction();
    expect(result.success).toBe(true);
    expect(result.queue).toHaveLength(0);
  });

  it('should aggregate items from multiple sources', async () => {
    mockDbSelectSequential(
      [], // reviewedToday
      [{ flashcardId: 'fc-1', contentId: 'c-1', question: 'Q?', answer: 'A', title: 'FC', body: null, contentType: 'note', tags: [] }],
      [{ reminderId: 'rem-1', contentId: 'c-2', title: 'Rem', body: null, contentType: 'note', tags: [] }],
      [{ id: 'c-3', title: 'Stale', body: null, contentType: 'note', tags: [] }],
      [{ id: 'c-4', title: 'Redis', body: null, contentType: 'note', tags: [] }]
    );

    const result = await getReviewQueueAction();
    expect(result.success).toBe(true);
    expect(result.queue).toHaveLength(4);
    expect(result.queue.map((q) => q.source)).toEqual(['flashcard', 'reminder', 'stale', 'rediscovery']);
  });

  it('should limit total queue to 8 items', async () => {
    // 3 flashcards + 2 reminders + 2 stale + 1 rediscovery = 8
    mockDbSelectSequential(
      [],
      [
        { flashcardId: 'fc-1', contentId: 'c-1', question: 'Q1', answer: 'A1', title: 'FC1', body: null, contentType: 'note', tags: [] },
        { flashcardId: 'fc-2', contentId: 'c-2', question: 'Q2', answer: 'A2', title: 'FC2', body: null, contentType: 'note', tags: [] },
        { flashcardId: 'fc-3', contentId: 'c-3', question: 'Q3', answer: 'A3', title: 'FC3', body: null, contentType: 'note', tags: [] },
      ],
      [
        { reminderId: 'rem-1', contentId: 'c-4', title: 'Rem1', body: null, contentType: 'note', tags: [] },
        { reminderId: 'rem-2', contentId: 'c-5', title: 'Rem2', body: null, contentType: 'note', tags: [] },
      ],
      [
        { id: 'c-6', title: 'Stale1', body: null, contentType: 'note', tags: [] },
        { id: 'c-7', title: 'Stale2', body: null, contentType: 'note', tags: [] },
      ],
      [{ id: 'c-8', title: 'Redis', body: null, contentType: 'note', tags: [] }]
    );

    const result = await getReviewQueueAction();
    expect(result.success).toBe(true);
    expect(result.queue.length).toBeLessThanOrEqual(8);
  });

  it('should handle database errors gracefully', async () => {
    vi.mocked(db.select).mockImplementation(() => {
      throw new Error('DB connection failed');
    });

    const result = await getReviewQueueAction();
    expect(result.success).toBe(false);
    expect(result.message).toBe('Failed to load review queue');
  });
});

describe('markReviewedAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never);
    mockRateLimit.mockReturnValue({ success: true });
    mockDbInsert();
  });

  it('should return unauthorized when not logged in', async () => {
    mockAuth.mockResolvedValue(null as never);
    const result = await markReviewedAction('550e8400-e29b-41d4-a716-446655440000');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Unauthorized');
  });

  it('should return rate limit error when rate limited', async () => {
    mockRateLimit.mockReturnValue({ success: false, message: 'Too many requests' });
    const result = await markReviewedAction('550e8400-e29b-41d4-a716-446655440000');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Too many requests');
  });

  it('should reject invalid content ID', async () => {
    const result = await markReviewedAction('not-a-uuid');
    expect(result.success).toBe(false);
  });

  it('should insert content view and check badges', async () => {
    const result = await markReviewedAction('550e8400-e29b-41d4-a716-446655440000');
    expect(result.success).toBe(true);
    expect(result.message).toBe('Marked as reviewed');
    expect(db.insert).toHaveBeenCalled();
    expect(checkAndUnlockBadgesAction).toHaveBeenCalledWith('review_completed');
  });

  it('should handle database errors gracefully', async () => {
    vi.mocked(db.insert).mockImplementation(() => {
      throw new Error('DB error');
    });
    const result = await markReviewedAction('550e8400-e29b-41d4-a716-446655440000');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Failed to mark as reviewed');
  });
});
