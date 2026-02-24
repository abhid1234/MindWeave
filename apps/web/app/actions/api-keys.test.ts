import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAuth, mockSelect, mockInsert, mockUpdate, mockRateLimit, mockGenerateApiKey } =
  vi.hoisted(() => {
    // Select chain: .select().from().where().orderBy() or .select().from().where().limit()
    const mockLimit = vi.fn();
    const mockOrderBy = vi.fn();
    const mockWhere = vi.fn(() => ({ orderBy: mockOrderBy, limit: mockLimit }));
    const mockFrom = vi.fn(() => ({ where: mockWhere }));
    const mockSelect = vi.fn(() => ({ from: mockFrom }));

    // Insert chain: .insert().values().returning()
    const mockReturning = vi.fn();
    const mockValues = vi.fn(() => ({ returning: mockReturning }));
    const mockInsert = vi.fn(() => ({ values: mockValues }));

    // Update chain: .update().set().where()
    const mockUpdateWhere = vi.fn();
    const mockSet = vi.fn(() => ({ where: mockUpdateWhere }));
    const mockUpdate = vi.fn(() => ({ set: mockSet }));

    const mockAuth = vi.fn();
    const mockRateLimit = vi.fn();
    const mockGenerateApiKey = vi.fn();

    Object.assign(mockSelect, {
      from: mockFrom,
      where: mockWhere,
      orderBy: mockOrderBy,
      limit: mockLimit,
    });
    Object.assign(mockInsert, { values: mockValues, returning: mockReturning });
    Object.assign(mockUpdate, { set: mockSet, where: mockUpdateWhere });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { mockAuth, mockSelect: mockSelect as any, mockInsert: mockInsert as any, mockUpdate: mockUpdate as any, mockRateLimit, mockGenerateApiKey };
  });

vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

vi.mock('@/lib/db/client', () => ({
  db: {
    select: (...args: any[]) => mockSelect(...args),
    insert: (...args: any[]) => mockInsert(...args),
    update: (...args: any[]) => mockUpdate(...args),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  apiKeys: {
    id: 'id',
    userId: 'userId',
    name: 'name',
    keyPrefix: 'keyPrefix',
    keyHash: 'keyHash',
    lastUsedAt: 'lastUsedAt',
    expiresAt: 'expiresAt',
    isActive: 'isActive',
    createdAt: 'createdAt',
  },
}));

vi.mock('@/lib/api-key-auth', () => ({
  generateApiKey: () => mockGenerateApiKey(),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkServerActionRateLimit: (...args: unknown[]) => mockRateLimit(...args),
  RATE_LIMITS: { serverAction: { maxRequests: 60, windowMs: 60000 } },
}));

vi.mock('drizzle-orm', () => ({
  eq: (...args: unknown[]) => args,
  and: (...args: unknown[]) => args,
  desc: (col: unknown) => col,
}));

import { listApiKeysAction, createApiKeyAction, revokeApiKeyAction } from './api-keys';

// --- helpers ---

/**
 * Set up the select chain to resolve to `rows`.
 * The `.where()` return is both a thenable (for queries that end at .where()) and
 * has .orderBy() / .limit() (for queries that chain further).
 */
function setupSelectChain(rows: unknown[]) {
  const mockLimitFn = vi.fn().mockResolvedValue(rows);
  const mockOrderByFn = vi.fn().mockResolvedValue(rows);
  const whereResult = { orderBy: mockOrderByFn, limit: mockLimitFn, then: (resolve: (v: unknown) => void) => Promise.resolve(rows).then(resolve) };
  const mockWhereFn = vi.fn(() => whereResult);
  const mockFromFn = vi.fn(() => ({ where: mockWhereFn }));
  mockSelect.mockReturnValue({ from: mockFromFn });
}

/** Set up a second select call that resolves to `rows` (for the active-keys-count query). */
function setupTwoSelects(firstRows: unknown[], secondRows: unknown[]) {
  let callCount = 0;
  mockSelect.mockImplementation(() => {
    callCount++;
    if (callCount === 1) {
      const mockOrderByFn = vi.fn().mockResolvedValue(firstRows);
      const mockWhereFn = vi.fn(() => ({ orderBy: mockOrderByFn }));
      const mockFromFn = vi.fn(() => ({ where: mockWhereFn }));
      return { from: mockFromFn };
    }
    // second call — active keys count check (no orderBy, just resolves directly)
    const mockWhereFn = vi.fn().mockResolvedValue(secondRows);
    const mockFromFn = vi.fn(() => ({ where: mockWhereFn }));
    return { from: mockFromFn };
  });
}

function setupInsertChain(rows: unknown[]) {
  const mockReturningFn = vi.fn().mockResolvedValue(rows);
  const mockValuesFn = vi.fn(() => ({ returning: mockReturningFn }));
  mockInsert.mockReturnValue({ values: mockValuesFn });
}

function setupUpdateChain() {
  const mockUpdateWhereFn = vi.fn().mockResolvedValue(undefined);
  const mockSetFn = vi.fn(() => ({ where: mockUpdateWhereFn }));
  mockUpdate.mockReturnValue({ set: mockSetFn });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
  mockRateLimit.mockReturnValue({ success: true });
  mockGenerateApiKey.mockReturnValue({
    raw: 'mw_testapikey12345678901234567890abcdef1234',
    hash: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    prefix: 'mw_testa',
  });
  setupSelectChain([]);
  setupInsertChain([{ id: 'new-key-id' }]);
  setupUpdateChain();
});

// ============================
// listApiKeysAction
// ============================

describe('listApiKeysAction', () => {
  it('returns unauthorized when no session', async () => {
    mockAuth.mockResolvedValue(null);
    const result = await listApiKeysAction();
    expect(result.success).toBe(false);
    expect(result.message).toBe('Unauthorized.');
  });

  it('returns keys array on success', async () => {
    const keyRows = [
      {
        id: 'k1',
        name: 'Test Key',
        keyPrefix: 'mw_abc',
        lastUsedAt: null,
        expiresAt: null,
        isActive: true,
        createdAt: new Date(),
      },
    ];
    setupSelectChain(keyRows);
    const result = await listApiKeysAction();
    expect(result.success).toBe(true);
    expect(result.keys).toEqual(keyRows);
  });

  it('returns failure on DB error', async () => {
    const mockOrderByFn = vi.fn().mockRejectedValue(new Error('DB failure'));
    const mockWhereFn = vi.fn(() => ({ orderBy: mockOrderByFn }));
    const mockFromFn = vi.fn(() => ({ where: mockWhereFn }));
    mockSelect.mockReturnValue({ from: mockFromFn });

    const result = await listApiKeysAction();
    expect(result.success).toBe(false);
    expect(result.keys).toEqual([]);
  });
});

// ============================
// createApiKeyAction
// ============================

describe('createApiKeyAction', () => {
  it('returns unauthorized when no session', async () => {
    mockAuth.mockResolvedValue(null);
    const result = await createApiKeyAction({ name: 'My Key' });
    expect(result.success).toBe(false);
    expect(result.message).toBe('Unauthorized.');
  });

  it('returns failure when rate limited', async () => {
    mockRateLimit.mockReturnValue({
      success: false,
      message: 'Rate limit exceeded. Please try again in 30 seconds.',
    });
    const result = await createApiKeyAction({ name: 'My Key' });
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/rate/i);
  });

  it('returns failure for empty name', async () => {
    const result = await createApiKeyAction({ name: '' });
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/Name is required/);
  });

  it('returns failure for name over 100 characters', async () => {
    const longName = 'a'.repeat(101);
    const result = await createApiKeyAction({ name: longName });
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/under 100 characters/);
  });

  it('returns failure when 10 or more active keys exist', async () => {
    // First select call: active keys count → 10 keys
    const tenKeys = Array.from({ length: 10 }, (_, i) => ({ id: `k${i}` }));
    setupSelectChain(tenKeys);

    const result = await createApiKeyAction({ name: 'New Key' });
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/Maximum/);
  });

  it('returns success with rawKey starting with mw_ on valid create', async () => {
    // Active keys count: empty array
    setupSelectChain([]);
    setupInsertChain([{ id: 'new-key-id' }]);

    const result = await createApiKeyAction({ name: 'My Key' });
    expect(result.success).toBe(true);
    expect(result.rawKey).toMatch(/^mw_/);
    expect(result.keyId).toBe('new-key-id');
  });

  it('passes expiresAt when expiresInDays is provided', async () => {
    setupSelectChain([]);

    // Capture the values passed to insert
    const mockReturningFn = vi.fn().mockResolvedValue([{ id: 'new-key-id' }]);
    const mockValuesFn = vi.fn(() => ({ returning: mockReturningFn }));
    mockInsert.mockReturnValue({ values: mockValuesFn });

    const result = await createApiKeyAction({ name: 'My Key', expiresInDays: 30 });
    expect(result.success).toBe(true);

    // Verify that values was called with an expiresAt that is a Date
    const valuesArg = (mockValuesFn.mock.calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(valuesArg.expiresAt).toBeInstanceOf(Date);
    // Should be ~30 days from now
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const diff = (valuesArg.expiresAt as Date).getTime() - Date.now();
    expect(diff).toBeGreaterThan(thirtyDaysMs - 5000);
    expect(diff).toBeLessThanOrEqual(thirtyDaysMs);
  });

  it('sets expiresAt to null when expiresInDays is not provided', async () => {
    setupSelectChain([]);

    const mockReturningFn = vi.fn().mockResolvedValue([{ id: 'new-key-id' }]);
    const mockValuesFn = vi.fn(() => ({ returning: mockReturningFn }));
    mockInsert.mockReturnValue({ values: mockValuesFn });

    const result = await createApiKeyAction({ name: 'My Key' });
    expect(result.success).toBe(true);

    const valuesArg = (mockValuesFn.mock.calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(valuesArg.expiresAt).toBeNull();
  });

  it('returns failure on DB error during insert', async () => {
    setupSelectChain([]);
    const mockReturningFn = vi.fn().mockRejectedValue(new Error('Insert failed'));
    const mockValuesFn = vi.fn(() => ({ returning: mockReturningFn }));
    mockInsert.mockReturnValue({ values: mockValuesFn });

    const result = await createApiKeyAction({ name: 'My Key' });
    expect(result.success).toBe(false);
    expect(result.message).toBe('Failed to create API key.');
  });
});

// ============================
// revokeApiKeyAction
// ============================

describe('revokeApiKeyAction', () => {
  it('returns unauthorized when no session', async () => {
    mockAuth.mockResolvedValue(null);
    const result = await revokeApiKeyAction('key-1');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Unauthorized.');
  });

  it('returns failure when rate limited', async () => {
    mockRateLimit.mockReturnValue({
      success: false,
      message: 'Rate limit exceeded. Please try again in 30 seconds.',
    });
    const result = await revokeApiKeyAction('key-1');
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/rate/i);
  });

  it('returns failure when key is not owned by user (empty select)', async () => {
    setupSelectChain([]);
    const result = await revokeApiKeyAction('key-999');
    expect(result.success).toBe(false);
    expect(result.message).toBe('API key not found.');
  });

  it('returns success when key is found and revoked', async () => {
    setupSelectChain([{ id: 'key-1' }]);
    setupUpdateChain();
    const result = await revokeApiKeyAction('key-1');
    expect(result.success).toBe(true);
    expect(result.message).toBe('API key revoked.');
  });

  it('calls db.update to set isActive to false', async () => {
    setupSelectChain([{ id: 'key-1' }]);
    const mockUpdateWhereFn = vi.fn().mockResolvedValue(undefined);
    const mockSetFn = vi.fn(() => ({ where: mockUpdateWhereFn }));
    mockUpdate.mockReturnValue({ set: mockSetFn });

    await revokeApiKeyAction('key-1');
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockSetFn).toHaveBeenCalledWith({ isActive: false });
  });

  it('returns failure on DB error during revoke', async () => {
    setupSelectChain([{ id: 'key-1' }]);
    const mockUpdateWhereFn = vi.fn().mockRejectedValue(new Error('Update failed'));
    const mockSetFn = vi.fn(() => ({ where: mockUpdateWhereFn }));
    mockUpdate.mockReturnValue({ set: mockSetFn });

    const result = await revokeApiKeyAction('key-1');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Failed to revoke API key.');
  });
});
