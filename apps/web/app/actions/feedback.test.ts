import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitFeedbackAction, getFeedbackAction } from './feedback';

// Mock dependencies
const mockSelectChain = {
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  offset: vi.fn().mockResolvedValue([]),
};

vi.mock('@/lib/db/client', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([{ id: 'test-feedback-id' }]),
      })),
    })),
    select: vi.fn((selectArg) => {
      // If selecting count, return count chain
      if (selectArg && typeof selectArg === 'object') {
        return {
          from: vi.fn(() => ({
            where: vi.fn().mockResolvedValue([{ total: 5 }]),
          })),
        };
      }
      return mockSelectChain;
    }),
  },
}));

vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: 'test-user-id', email: 'test@example.com' },
  }),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('feedback actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('submitFeedbackAction', () => {
    it('submits feedback successfully', async () => {
      const result = await submitFeedbackAction({
        type: 'bug',
        message: 'This is a test bug report with enough characters.',
        email: 'user@example.com',
        page: '/dashboard',
      });

      expect(result.success).toBe(true);
      expect(result.feedbackId).toBe('test-feedback-id');
    });

    it('rejects message that is too short', async () => {
      const result = await submitFeedbackAction({
        type: 'feature',
        message: 'short',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('at least 10 characters');
    });

    it('accepts empty email', async () => {
      const result = await submitFeedbackAction({
        type: 'improvement',
        message: 'This is a valid feedback message that is long enough.',
        email: '',
      });

      expect(result.success).toBe(true);
    });

    it('rejects invalid email format', async () => {
      const result = await submitFeedbackAction({
        type: 'other',
        message: 'This is a valid feedback message that is long enough.',
        email: 'invalid-email',
      });

      expect(result.success).toBe(false);
    });

    it('accepts all feedback types', async () => {
      const types = ['bug', 'feature', 'improvement', 'other'] as const;

      for (const type of types) {
        const result = await submitFeedbackAction({
          type,
          message: 'This is a valid feedback message for type testing.',
        });
        expect(result.success).toBe(true);
      }
    });

    it('includes user agent when provided', async () => {
      const { db } = await import('@/lib/db/client');

      await submitFeedbackAction(
        {
          type: 'bug',
          message: 'Testing user agent handling functionality.',
        },
        'Mozilla/5.0 Test Agent'
      );

      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe('getFeedbackAction', () => {
    it('requires authentication', async () => {
      const { auth } = await import('@/lib/auth');
      vi.mocked(auth).mockResolvedValueOnce(null as any);

      const result = await getFeedbackAction();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('returns feedback items for authenticated user', async () => {
      const result = await getFeedbackAction();

      // Returns empty array from mock but structure is correct
      expect(result.success).toBe(true);
      expect(Array.isArray(result.items)).toBe(true);
    });

    it('supports pagination options', async () => {
      const result = await getFeedbackAction({
        limit: 10,
        offset: 5,
      });

      expect(result.success).toBe(true);
    });

    it('supports status filter', async () => {
      const result = await getFeedbackAction({
        status: 'new',
      });

      expect(result.success).toBe(true);
    });

    it('supports type filter', async () => {
      const result = await getFeedbackAction({
        type: 'bug',
      });

      expect(result.success).toBe(true);
    });
  });
});
