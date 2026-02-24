import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockSelect, mockUpdate } = vi.hoisted(() => {
  const mockLimit = vi.fn();
  const mockWhere = vi.fn(() => ({ limit: mockLimit }));
  const mockFrom = vi.fn(() => ({ where: mockWhere }));
  const mockSelect = vi.fn(() => ({ from: mockFrom }));

  const mockUpdateWhere = vi.fn(() => ({ catch: vi.fn() }));
  const mockSet = vi.fn(() => ({ where: mockUpdateWhere }));
  const mockUpdate = vi.fn(() => ({ set: mockSet }));

  Object.assign(mockSelect, { from: mockFrom, where: mockWhere, limit: mockLimit });
  Object.assign(mockUpdate, { set: mockSet, where: mockUpdateWhere });

  return { mockSelect, mockUpdate };
});

vi.mock('@/lib/db/client', () => ({
  db: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select: (...args: any[]) => (mockSelect as (...a: any[]) => any)(...args),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: (...args: any[]) => (mockUpdate as (...a: any[]) => any)(...args),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  apiKeys: {
    id: 'id',
    userId: 'userId',
    isActive: 'isActive',
    expiresAt: 'expiresAt',
    keyHash: 'keyHash',
    lastUsedAt: 'lastUsedAt',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: (...args: unknown[]) => args,
}));

import { generateApiKey, hashApiKey, authenticateApiKey } from './api-key-auth';

function setupSelectChain(rows: unknown[]) {
  const mockLimitFn = vi.fn().mockResolvedValue(rows);
  const mockWhereFn = vi.fn(() => ({ limit: mockLimitFn }));
  const mockFromFn = vi.fn(() => ({ where: mockWhereFn }));
  mockSelect.mockReturnValue({ from: mockFromFn });
}

function setupUpdateChain() {
  const mockCatch = vi.fn();
  const mockUpdateWhereFn = vi.fn(() => ({ catch: mockCatch }));
  const mockSetFn = vi.fn(() => ({ where: mockUpdateWhereFn }));
  mockUpdate.mockReturnValue({ set: mockSetFn });
  return { mockSetFn, mockUpdateWhereFn, mockCatch };
}

function makeRequest(authHeader?: string): Request {
  const headers = new Headers();
  if (authHeader !== undefined) {
    headers.set('Authorization', authHeader);
  }
  return new Request('http://localhost/api/test', { headers });
}

beforeEach(() => {
  vi.clearAllMocks();
  setupSelectChain([]);
  setupUpdateChain();
});

describe('generateApiKey', () => {
  it('returns an object with raw, hash, and prefix', () => {
    const result = generateApiKey();
    expect(result).toHaveProperty('raw');
    expect(result).toHaveProperty('hash');
    expect(result).toHaveProperty('prefix');
  });

  it('raw key starts with mw_ prefix', () => {
    const result = generateApiKey();
    expect(result.raw).toMatch(/^mw_/);
  });

  it('hash is a 64-character hex string (SHA-256)', () => {
    const result = generateApiKey();
    expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('prefix starts with mw_', () => {
    const result = generateApiKey();
    expect(result.prefix).toMatch(/^mw_/);
  });

  it('generates unique keys on each call', () => {
    const key1 = generateApiKey();
    const key2 = generateApiKey();
    expect(key1.raw).not.toBe(key2.raw);
    expect(key1.hash).not.toBe(key2.hash);
  });
});

describe('hashApiKey', () => {
  it('produces consistent hashes for the same input', () => {
    const input = 'mw_abc123';
    expect(hashApiKey(input)).toBe(hashApiKey(input));
  });

  it('produces different hashes for different inputs', () => {
    expect(hashApiKey('mw_abc123')).not.toBe(hashApiKey('mw_def456'));
  });

  it('returns a 64-character hex string', () => {
    const result = hashApiKey('mw_test');
    expect(result).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('authenticateApiKey', () => {
  it('returns error when Authorization header is missing', async () => {
    const req = makeRequest();
    const result = await authenticateApiKey(req);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Missing or invalid Authorization header.');
    }
  });

  it('returns error when Authorization header lacks Bearer prefix', async () => {
    const req = makeRequest('Basic mw_abc123');
    const result = await authenticateApiKey(req);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Missing or invalid Authorization header.');
    }
  });

  it('returns error when Bearer token lacks mw_ prefix', async () => {
    const req = makeRequest('Bearer sk_abc123');
    const result = await authenticateApiKey(req);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Invalid API key format.');
    }
  });

  it('returns error when key is not found in DB', async () => {
    setupSelectChain([]);
    const req = makeRequest('Bearer mw_abc123deadbeef1234567890abcdef1234567890ab');
    const result = await authenticateApiKey(req);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Invalid API key.');
    }
  });

  it('returns error when key is found but isActive is false', async () => {
    setupSelectChain([
      { id: 'key-1', userId: 'user-1', isActive: false, expiresAt: null },
    ]);
    const req = makeRequest('Bearer mw_abc123deadbeef1234567890abcdef1234567890ab');
    const result = await authenticateApiKey(req);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('API key has been revoked.');
    }
  });

  it('returns error when key is found but expired', async () => {
    const pastDate = new Date(Date.now() - 86400000); // 1 day ago
    setupSelectChain([
      { id: 'key-1', userId: 'user-1', isActive: true, expiresAt: pastDate },
    ]);
    const req = makeRequest('Bearer mw_abc123deadbeef1234567890abcdef1234567890ab');
    const result = await authenticateApiKey(req);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('API key has expired.');
    }
  });

  it('returns success with userId and keyId when key is valid and active', async () => {
    const futureDate = new Date(Date.now() + 86400000); // 1 day from now
    setupSelectChain([
      { id: 'key-1', userId: 'user-1', isActive: true, expiresAt: futureDate },
    ]);
    setupUpdateChain();
    const req = makeRequest('Bearer mw_abc123deadbeef1234567890abcdef1234567890ab');
    const result = await authenticateApiKey(req);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.userId).toBe('user-1');
      expect(result.keyId).toBe('key-1');
    }
  });

  it('triggers lastUsedAt update on successful auth', async () => {
    const futureDate = new Date(Date.now() + 86400000);
    setupSelectChain([
      { id: 'key-1', userId: 'user-1', isActive: true, expiresAt: futureDate },
    ]);
    setupUpdateChain();
    const req = makeRequest('Bearer mw_abc123deadbeef1234567890abcdef1234567890ab');
    await authenticateApiKey(req);
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('returns success when expiresAt is null (no expiry)', async () => {
    setupSelectChain([
      { id: 'key-2', userId: 'user-2', isActive: true, expiresAt: null },
    ]);
    setupUpdateChain();
    const req = makeRequest('Bearer mw_abc123deadbeef1234567890abcdef1234567890ab');
    const result = await authenticateApiKey(req);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.userId).toBe('user-2');
      expect(result.keyId).toBe('key-2');
    }
  });
});
