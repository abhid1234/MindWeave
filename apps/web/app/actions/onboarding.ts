'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

type OnboardingResult = {
  success: boolean;
  message: string;
  data?: {
    onboardingCompleted: boolean;
    onboardingStep: number;
  };
};

export async function getOnboardingStatus(): Promise<OnboardingResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: 'Unauthorized' };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { onboardingCompleted: true, onboardingStep: true },
  });

  if (!user) {
    return { success: false, message: 'User not found' };
  }

  return {
    success: true,
    message: 'OK',
    data: {
      onboardingCompleted: user.onboardingCompleted,
      onboardingStep: user.onboardingStep,
    },
  };
}

export async function updateOnboardingStep(step: number): Promise<OnboardingResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: 'Unauthorized' };
  }

  if (step < 0 || step > 4) {
    return { success: false, message: 'Invalid step' };
  }

  await db
    .update(users)
    .set({ onboardingStep: step, updatedAt: new Date() })
    .where(eq(users.id, session.user.id));

  return {
    success: true,
    message: 'Step updated',
    data: { onboardingCompleted: false, onboardingStep: step },
  };
}

export async function completeOnboarding(): Promise<OnboardingResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: 'Unauthorized' };
  }

  await db
    .update(users)
    .set({
      onboardingCompleted: true,
      onboardingStep: 4,
      onboardingCompletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id));

  return {
    success: true,
    message: 'Onboarding completed',
    data: { onboardingCompleted: true, onboardingStep: 4 },
  };
}

export async function skipOnboarding(): Promise<OnboardingResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: 'Unauthorized' };
  }

  await db
    .update(users)
    .set({
      onboardingCompleted: true,
      onboardingSkippedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id));

  return {
    success: true,
    message: 'Onboarding skipped',
    data: { onboardingCompleted: true, onboardingStep: 0 },
  };
}
