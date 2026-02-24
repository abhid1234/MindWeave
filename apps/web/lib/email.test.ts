import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';

// Mock resend
const mockSend = vi.fn();
vi.mock('resend', () => {
  return {
    Resend: class {
      emails = { send: mockSend };
    },
  };
});

// Mock db
const mockFindFirst = vi.fn();
const mockDelete = vi.fn().mockReturnValue({ where: vi.fn() });
const mockInsert = vi.fn().mockReturnValue({ values: vi.fn() });
const mockUpdate = vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn() }) });

vi.mock('./db/client', () => ({
  db: {
    query: {
      verificationTokens: { findFirst: mockFindFirst },
      users: { findFirst: mockFindFirst },
    },
    delete: mockDelete,
    insert: mockInsert,
    update: mockUpdate,
  },
}));

vi.mock('./db/schema', () => ({
  verificationTokens: { identifier: 'identifier', token: 'token' },
  users: { email: 'email' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => ({ field: a, value: b })),
  and: vi.fn((...args) => ({ and: args })),
}));

describe('Email Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue({ data: { id: 'test-id' }, error: null });
    mockDelete.mockReturnValue({ where: vi.fn() });
    mockInsert.mockReturnValue({ values: vi.fn() });
    process.env.AUTH_URL = 'http://localhost:3000';
    process.env.RESEND_API_KEY = 'test-key';
  });

  describe('hashToken', () => {
    it('should return consistent SHA-256 hex digest', async () => {
      const { hashToken } = await import('./email');
      const result = hashToken('test-token');
      const expected = crypto.createHash('sha256').update('test-token').digest('hex');
      expect(result).toBe(expected);
    });

    it('should return different hashes for different inputs', async () => {
      const { hashToken } = await import('./email');
      expect(hashToken('token-a')).not.toBe(hashToken('token-b'));
    });

    it('should return a 64-character hex string', async () => {
      const { hashToken } = await import('./email');
      const result = hashToken('any-input');
      expect(result).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('sendVerificationEmail', () => {
    it('should delete existing tokens for email with verify: prefix', async () => {
      const { sendVerificationEmail } = await import('./email');
      const mockWhere = vi.fn();
      mockDelete.mockReturnValue({ where: mockWhere });

      await sendVerificationEmail('user@example.com');

      expect(mockDelete).toHaveBeenCalled();
    });

    it('should insert new hashed token with 24h expiry', async () => {
      const { sendVerificationEmail } = await import('./email');
      const mockValues = vi.fn();
      mockInsert.mockReturnValue({ values: mockValues });

      const now = Math.floor(Date.now() / 1000);
      await sendVerificationEmail('user@example.com');

      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: 'verify:user@example.com',
          expires: expect.any(Number),
        })
      );

      const callArg = mockValues.mock.calls[0][0];
      // 24 hours = 86400 seconds, allow 5s tolerance
      expect(callArg.expires).toBeGreaterThanOrEqual(now + 86400 - 5);
      expect(callArg.expires).toBeLessThanOrEqual(now + 86400 + 5);
    });

    it('should send email via Resend with correct parameters', async () => {
      const { sendVerificationEmail } = await import('./email');
      await sendVerificationEmail('user@example.com');

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Verify your Mindweave email',
        })
      );
    });

    it('should include verify URL in email HTML', async () => {
      const { sendVerificationEmail } = await import('./email');
      await sendVerificationEmail('user@example.com');

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain('http://localhost:3000/verify-email?token=');
      expect(call.html).toContain('user%40example.com');
    });

    it('should log error when Resend fails', async () => {
      const { sendVerificationEmail } = await import('./email');
      mockSend.mockResolvedValue({ data: null, error: { message: 'fail' } });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await sendVerificationEmail('user@example.com');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Email Verification]'),
        expect.any(String)
      );
      consoleSpy.mockRestore();
    });

    it('should log success when email sends', async () => {
      const { sendVerificationEmail } = await import('./email');
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await sendVerificationEmail('user@example.com');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Email Verification]'),
        expect.any(String)
      );
      consoleSpy.mockRestore();
    });
  });

  describe('consumeVerificationToken', () => {
    it('should return true and delete token when valid', async () => {
      const { consumeVerificationToken } = await import('./email');
      const futureExpiry = Math.floor(Date.now() / 1000) + 3600;
      mockFindFirst.mockResolvedValue({
        identifier: 'verify:user@example.com',
        token: 'hashed',
        expires: futureExpiry,
      });
      const mockWhere = vi.fn();
      mockDelete.mockReturnValue({ where: mockWhere });

      const result = await consumeVerificationToken('user@example.com', 'raw-token');

      expect(result).toBe(true);
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should return false when token not found', async () => {
      const { consumeVerificationToken } = await import('./email');
      mockFindFirst.mockResolvedValue(null);

      const result = await consumeVerificationToken('user@example.com', 'bad-token');

      expect(result).toBe(false);
    });

    it('should return false when token expired', async () => {
      const { consumeVerificationToken } = await import('./email');
      const pastExpiry = Math.floor(Date.now() / 1000) - 3600;
      mockFindFirst.mockResolvedValue({
        identifier: 'verify:user@example.com',
        token: 'hashed',
        expires: pastExpiry,
      });

      const result = await consumeVerificationToken('user@example.com', 'raw-token');

      expect(result).toBe(false);
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should skip if user not found', async () => {
      const { sendPasswordResetEmail } = await import('./email');
      mockFindFirst.mockResolvedValue(null);

      await sendPasswordResetEmail('unknown@example.com');

      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should skip if user has no password (OAuth-only)', async () => {
      const { sendPasswordResetEmail } = await import('./email');
      mockFindFirst.mockResolvedValue({ email: 'user@example.com', password: null });

      await sendPasswordResetEmail('user@example.com');

      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should send email with reset URL when user has password', async () => {
      const { sendPasswordResetEmail } = await import('./email');
      mockFindFirst.mockResolvedValue({ email: 'user@example.com', password: 'hashed-pw' });
      const mockWhere = vi.fn();
      mockDelete.mockReturnValue({ where: mockWhere });
      const mockValues = vi.fn();
      mockInsert.mockReturnValue({ values: mockValues });

      await sendPasswordResetEmail('user@example.com');

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Reset your Mindweave password',
        })
      );
    });

    it('should delete existing tokens before creating new one', async () => {
      const { sendPasswordResetEmail } = await import('./email');
      mockFindFirst.mockResolvedValue({ email: 'user@example.com', password: 'hashed-pw' });
      const mockWhere = vi.fn();
      mockDelete.mockReturnValue({ where: mockWhere });
      const mockValues = vi.fn();
      mockInsert.mockReturnValue({ values: mockValues });

      await sendPasswordResetEmail('user@example.com');

      expect(mockDelete).toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should use 30-minute expiry for reset tokens', async () => {
      const { sendPasswordResetEmail } = await import('./email');
      mockFindFirst.mockResolvedValue({ email: 'user@example.com', password: 'hashed-pw' });
      const mockWhere = vi.fn();
      mockDelete.mockReturnValue({ where: mockWhere });
      const mockValues = vi.fn();
      mockInsert.mockReturnValue({ values: mockValues });

      const now = Math.floor(Date.now() / 1000);
      await sendPasswordResetEmail('user@example.com');

      const callArg = mockValues.mock.calls[0][0];
      // SECURITY: Reduced from 1 hour to 30 minutes (1800 seconds)
      expect(callArg.expires).toBeGreaterThanOrEqual(now + 1800 - 5);
      expect(callArg.expires).toBeLessThanOrEqual(now + 1800 + 5);
    });

    it('should include reset URL in email HTML', async () => {
      const { sendPasswordResetEmail } = await import('./email');
      mockFindFirst.mockResolvedValue({ email: 'user@example.com', password: 'hashed-pw' });
      const mockWhere = vi.fn();
      mockDelete.mockReturnValue({ where: mockWhere });
      const mockValues = vi.fn();
      mockInsert.mockReturnValue({ values: mockValues });

      await sendPasswordResetEmail('user@example.com');

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain('http://localhost:3000/reset-password?token=');
    });
  });

  describe('verifyResetToken', () => {
    it('should return true for valid token', async () => {
      const { verifyResetToken } = await import('./email');
      mockFindFirst.mockResolvedValue({
        identifier: 'user@example.com',
        token: 'hashed',
        expires: Math.floor(Date.now() / 1000) + 3600,
      });

      const result = await verifyResetToken('user@example.com', 'raw-token');
      expect(result).toBe(true);
    });

    it('should return false for missing token', async () => {
      const { verifyResetToken } = await import('./email');
      mockFindFirst.mockResolvedValue(null);

      const result = await verifyResetToken('user@example.com', 'bad-token');
      expect(result).toBe(false);
    });

    it('should return false for expired token', async () => {
      const { verifyResetToken } = await import('./email');
      mockFindFirst.mockResolvedValue({
        identifier: 'user@example.com',
        token: 'hashed',
        expires: Math.floor(Date.now() / 1000) - 3600,
      });

      const result = await verifyResetToken('user@example.com', 'raw-token');
      expect(result).toBe(false);
    });
  });

  describe('consumeResetToken', () => {
    it('should return true and delete on valid token', async () => {
      const { consumeResetToken } = await import('./email');
      mockFindFirst.mockResolvedValue({
        identifier: 'user@example.com',
        token: 'hashed',
        expires: Math.floor(Date.now() / 1000) + 3600,
      });
      const mockWhere = vi.fn();
      mockDelete.mockReturnValue({ where: mockWhere });

      const result = await consumeResetToken('user@example.com', 'raw-token');

      expect(result).toBe(true);
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should return false on missing token', async () => {
      const { consumeResetToken } = await import('./email');
      mockFindFirst.mockResolvedValue(null);

      const result = await consumeResetToken('user@example.com', 'bad-token');
      expect(result).toBe(false);
    });

    it('should return false on expired token', async () => {
      const { consumeResetToken } = await import('./email');
      mockFindFirst.mockResolvedValue({
        identifier: 'user@example.com',
        token: 'hashed',
        expires: Math.floor(Date.now() / 1000) - 3600,
      });

      const result = await consumeResetToken('user@example.com', 'raw-token');
      expect(result).toBe(false);
    });
  });
});
