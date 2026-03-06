import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getUserBadgesAction,
  checkAndUnlockBadgesAction,
  getPublicBadgesAction,
  getUnnotifiedBadgesAction,
  markBadgesNotifiedAction,
} from './badges';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock database
vi.mock('@/lib/db/client', () => {
  const createChain = () => {
    const chain: Record<string, unknown> = {};
    const methods = ['from', 'where', 'innerJoin', 'leftJoin', 'orderBy', 'groupBy', 'limit', 'offset', 'set', 'values', 'returning', 'onConflictDoNothing'];
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
  revalidateTag: vi.fn(),
}));

// Mock badge engine
vi.mock('@/lib/badges/engine', () => ({
  checkBadgesForUser: vi.fn().mockResolvedValue([]),
  getProgressForBadge: vi.fn().mockResolvedValue(0),
}));

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { checkBadgesForUser, getProgressForBadge } from '@/lib/badges/engine';
import { BADGE_DEFINITIONS } from '@/lib/badges/definitions';

const mockSession = {
  user: { id: 'user-1', email: 'test@example.com' },
  expires: '',
};

function mockDbSelect(...results: unknown[][]) {
  let callCount = 0;
  vi.mocked(db.select).mockImplementation(() => {
    const idx = Math.min(callCount++, results.length - 1);
    const resolveValue = results[idx];
    const chain: Record<string, unknown> = {};
    const methods = ['from', 'where', 'innerJoin', 'leftJoin', 'orderBy', 'groupBy', 'limit', 'offset'];
    for (const method of methods) {
      chain[method] = vi.fn().mockReturnValue(chain);
    }
    chain.then = (resolve: (v: unknown) => unknown) => Promise.resolve(resolveValue).then(resolve);
    return chain as never;
  });
}

function mockDbUpdate() {
  const updateChain: Record<string, unknown> = {};
  const methods = ['set', 'where', 'returning'];
  for (const method of methods) {
    updateChain[method] = vi.fn().mockReturnValue(updateChain);
  }
  updateChain.then = (resolve: (v: unknown[]) => unknown) => Promise.resolve([]).then(resolve);
  vi.mocked(db.update).mockReturnValue(updateChain as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockDbUpdate();
});

describe('getUserBadgesAction', () => {
  it('returns unauthorized when not logged in', async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const result = await getUserBadgesAction();
    expect(result.success).toBe(false);
    expect(result.message).toBe('Unauthorized');
  });

  it('returns all 20 badges with progress', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    mockDbSelect([]); // no unlocked badges
    vi.mocked(getProgressForBadge).mockResolvedValue(0);

    const result = await getUserBadgesAction();
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(29);
  });

  it('marks unlocked badges correctly', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    const unlockedAt = new Date('2024-01-01');
    mockDbSelect([{ badgeId: 'creator-1', unlockedAt }]);

    const result = await getUserBadgesAction();
    expect(result.success).toBe(true);
    const creator1 = result.data?.find(b => b.badge.id === 'creator-1');
    expect(creator1?.unlocked).toBe(true);
    expect(creator1?.unlockedAt).toEqual(unlockedAt);
  });

  it('calls checkBadgesForUser with manual_check', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    mockDbSelect([]);

    await getUserBadgesAction();
    expect(checkBadgesForUser).toHaveBeenCalledWith('user-1', 'manual_check');
  });

  it('sets progress to threshold for unlocked badges', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    mockDbSelect([{ badgeId: 'creator-1', unlockedAt: new Date() }]);

    const result = await getUserBadgesAction();
    const creator1 = result.data?.find(b => b.badge.id === 'creator-1');
    expect(creator1?.progress).toBe(1); // threshold for creator-1
  });
});

describe('checkAndUnlockBadgesAction', () => {
  it('returns unauthorized when not logged in', async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const result = await checkAndUnlockBadgesAction('content_created');
    expect(result.success).toBe(false);
  });

  it('calls engine with correct trigger', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    await checkAndUnlockBadgesAction('content_created');
    expect(checkBadgesForUser).toHaveBeenCalledWith('user-1', 'content_created');
  });

  it('uses targetUserId when provided', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    await checkAndUnlockBadgesAction('clone_received', 'other-user');
    expect(checkBadgesForUser).toHaveBeenCalledWith('other-user', 'clone_received');
  });

  it('returns newly unlocked badge IDs', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(checkBadgesForUser).mockResolvedValue(['creator-1', 'explorer-diverse']);

    const result = await checkAndUnlockBadgesAction('content_created');
    expect(result.newlyUnlocked).toEqual(['creator-1', 'explorer-diverse']);
  });
});

describe('getPublicBadgesAction', () => {
  it('returns unlocked badges for a user', async () => {
    const unlockedAt = new Date('2024-01-01');
    mockDbSelect([{ badgeId: 'creator-1', unlockedAt }]);

    const result = await getPublicBadgesAction('user-1');
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data![0].badge.id).toBe('creator-1');
  });

  it('filters out unknown badge IDs', async () => {
    mockDbSelect([{ badgeId: 'nonexistent-badge', unlockedAt: new Date() }]);

    const result = await getPublicBadgesAction('user-1');
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(0);
  });
});

describe('getUnnotifiedBadgesAction', () => {
  it('returns unauthorized when not logged in', async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const result = await getUnnotifiedBadgesAction();
    expect(result.success).toBe(false);
  });

  it('returns unnotified badges', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    mockDbSelect([{ badgeId: 'creator-1', notified: false }]);

    const result = await getUnnotifiedBadgesAction();
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data![0].name).toBe('First Step');
  });
});

describe('markBadgesNotifiedAction', () => {
  it('returns unauthorized when not logged in', async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const result = await markBadgesNotifiedAction(['creator-1']);
    expect(result.success).toBe(false);
  });

  it('succeeds with empty array', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    const result = await markBadgesNotifiedAction([]);
    expect(result.success).toBe(true);
  });

  it('calls db.update for non-empty array', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    const result = await markBadgesNotifiedAction(['creator-1', 'sharer-1']);
    expect(result.success).toBe(true);
    expect(db.update).toHaveBeenCalled();
  });
});
