import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getOnboardingStatus,
  updateOnboardingStep,
  completeOnboarding,
  skipOnboarding,
} from './onboarding';

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db/schema', () => ({
  users: { id: 'id', onboardingCompleted: 'onboarding_completed', onboardingStep: 'onboarding_step' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: unknown[]) => args),
}));

vi.mock('@/lib/db/client', () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn(),
      },
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
  },
}));

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';

describe('Onboarding Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOnboardingStatus', () => {
    it('returns unauthorized when not logged in', async () => {
      vi.mocked(auth).mockResolvedValue(null as never);
      const result = await getOnboardingStatus();
      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
    });

    it('returns onboarding status for authenticated user', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never);
      vi.mocked(db.query.users.findFirst).mockResolvedValue({
        onboardingCompleted: false,
        onboardingStep: 1,
      } as never);

      const result = await getOnboardingStatus();
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        onboardingCompleted: false,
        onboardingStep: 1,
      });
    });

    it('returns error when user not found', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never);
      vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined as never);

      const result = await getOnboardingStatus();
      expect(result.success).toBe(false);
      expect(result.message).toBe('User not found');
    });
  });

  describe('updateOnboardingStep', () => {
    it('returns unauthorized when not logged in', async () => {
      vi.mocked(auth).mockResolvedValue(null as never);
      const result = await updateOnboardingStep(1);
      expect(result.success).toBe(false);
    });

    it('rejects invalid step values', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never);
      const result = await updateOnboardingStep(5);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid step');
    });

    it('updates step for valid values', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never);
      const result = await updateOnboardingStep(2);
      expect(result.success).toBe(true);
      expect(result.data?.onboardingStep).toBe(2);
      expect(db.update).toHaveBeenCalled();
    });
  });

  describe('completeOnboarding', () => {
    it('returns unauthorized when not logged in', async () => {
      vi.mocked(auth).mockResolvedValue(null as never);
      const result = await completeOnboarding();
      expect(result.success).toBe(false);
    });

    it('marks onboarding as completed', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never);
      const result = await completeOnboarding();
      expect(result.success).toBe(true);
      expect(result.data?.onboardingCompleted).toBe(true);
      expect(result.data?.onboardingStep).toBe(4);
      expect(db.update).toHaveBeenCalled();
    });
  });

  describe('skipOnboarding', () => {
    it('returns unauthorized when not logged in', async () => {
      vi.mocked(auth).mockResolvedValue(null as never);
      const result = await skipOnboarding();
      expect(result.success).toBe(false);
    });

    it('marks onboarding as skipped', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never);
      const result = await skipOnboarding();
      expect(result.success).toBe(true);
      expect(result.data?.onboardingCompleted).toBe(true);
      expect(db.update).toHaveBeenCalled();
    });
  });
});
