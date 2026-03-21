import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trackReferralClick, getReferralStats } from './referrals';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock database
vi.mock('@/lib/db/client', () => {
  const createChain = () => {
    const chain: Record<string, unknown> = {};
    const methods = [
      'from',
      'where',
      'innerJoin',
      'leftJoin',
      'orderBy',
      'groupBy',
      'limit',
      'offset',
      'set',
      'values',
      'returning',
      'onConflictDoNothing',
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
      query: {
        users: {
          findFirst: vi.fn(),
        },
        referrals: {
          findFirst: vi.fn(),
        },
      },
    },
  };
});

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';

const mockSession = {
  user: { id: 'user-1', email: 'test@example.com' },
  expires: '',
};

function makeSelectChain(resolveValue: unknown) {
  const chain: Record<string, unknown> = {};
  const methods = [
    'from',
    'where',
    'innerJoin',
    'leftJoin',
    'orderBy',
    'groupBy',
    'limit',
    'offset',
  ];
  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  chain.then = (resolve: (v: unknown) => unknown) => Promise.resolve(resolveValue).then(resolve);
  return chain;
}

function makeUpdateChain() {
  const chain: Record<string, unknown> = {};
  const methods = ['set', 'where', 'returning'];
  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  chain.then = (resolve: (v: unknown[]) => unknown) => Promise.resolve([]).then(resolve);
  return chain;
}

function makeInsertChain() {
  const chain: Record<string, unknown> = {};
  const methods = ['values', 'onConflictDoNothing', 'returning'];
  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  chain.then = (resolve: (v: unknown[]) => unknown) => Promise.resolve([]).then(resolve);
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('trackReferralClick', () => {
  it('returns failure when username is empty', async () => {
    const result = await trackReferralClick('');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Username is required');
  });

  it('returns failure when user is not found', async () => {
    vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined);

    const result = await trackReferralClick('unknownuser');
    expect(result.success).toBe(false);
    expect(result.message).toBe('User not found');
  });

  it('increments clickCount on an existing pending referral', async () => {
    vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: 'referrer-1' } as never);
    vi.mocked(db.query.referrals.findFirst).mockResolvedValue({
      id: 'ref-1',
      referrerId: 'referrer-1',
      status: 'pending',
      clickCount: 3,
    } as never);

    const updateChain = makeUpdateChain();
    vi.mocked(db.update).mockReturnValue(updateChain as never);

    const result = await trackReferralClick('testuser');
    expect(result.success).toBe(true);
    expect(db.update).toHaveBeenCalled();
  });

  it('creates a new referral row when no existing pending referral', async () => {
    vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: 'referrer-1' } as never);
    vi.mocked(db.query.referrals.findFirst).mockResolvedValue(undefined);

    const insertChain = makeInsertChain();
    vi.mocked(db.insert).mockReturnValue(insertChain as never);

    const result = await trackReferralClick('testuser');
    expect(result.success).toBe(true);
    expect(db.insert).toHaveBeenCalled();
  });

  it('returns failure on unexpected error', async () => {
    vi.mocked(db.query.users.findFirst).mockRejectedValue(new Error('DB error'));

    const result = await trackReferralClick('testuser');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Failed to track referral click');
  });
});

describe('getReferralStats', () => {
  it('returns unauthorized when not logged in', async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const result = await getReferralStats();
    expect(result.success).toBe(false);
    expect(result.message).toBe('Unauthorized');
  });

  it('returns failure when user has no username', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(db.query.users.findFirst).mockResolvedValue({ username: null } as never);

    const result = await getReferralStats();
    expect(result.success).toBe(false);
    expect(result.message).toContain('username');
  });

  it('returns referral stats successfully', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(db.query.users.findFirst).mockResolvedValue({ username: 'testuser' } as never);

    const statsRow = { totalClicks: 15, totalSignups: 5, totalActivated: 2 };
    vi.mocked(db.select).mockReturnValue(makeSelectChain([statsRow]) as never);

    const result = await getReferralStats();
    expect(result.success).toBe(true);
    expect(result.referralLink).toContain('/r/testuser');
    expect(result.totalClicks).toBe(15);
    expect(result.totalSignups).toBe(5);
    expect(result.totalActivated).toBe(2);
  });

  it('returns failure on unexpected error', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as never);
    vi.mocked(db.query.users.findFirst).mockRejectedValue(new Error('DB error'));

    const result = await getReferralStats();
    expect(result.success).toBe(false);
    expect(result.message).toBe('Failed to get referral stats');
  });
});
