'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { digestSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { checkServerActionRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export type DigestSettingsData = {
  enabled: boolean;
  frequency: string;
  preferredDay: number;
  preferredHour: number;
};

export type GetDigestSettingsResult = {
  success: boolean;
  message?: string;
  settings: DigestSettingsData;
};

const DEFAULT_SETTINGS: DigestSettingsData = {
  enabled: false,
  frequency: 'weekly',
  preferredDay: 1,
  preferredHour: 9,
};

export async function getDigestSettingsAction(): Promise<GetDigestSettingsResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized.', settings: DEFAULT_SETTINGS };
    }

    const [row] = await db
      .select({
        enabled: digestSettings.enabled,
        frequency: digestSettings.frequency,
        preferredDay: digestSettings.preferredDay,
        preferredHour: digestSettings.preferredHour,
      })
      .from(digestSettings)
      .where(eq(digestSettings.userId, session.user.id))
      .limit(1);

    return {
      success: true,
      settings: row ?? DEFAULT_SETTINGS,
    };
  } catch (error) {
    console.error('Error fetching digest settings:', error);
    return { success: false, message: 'Failed to load settings.', settings: DEFAULT_SETTINGS };
  }
}

export type UpdateDigestSettingsResult = {
  success: boolean;
  message: string;
};

export async function updateDigestSettingsAction(
  params: DigestSettingsData
): Promise<UpdateDigestSettingsResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized.' };
    }

    const rateCheck = checkServerActionRateLimit(
      session.user.id,
      'updateDigestSettings',
      RATE_LIMITS.serverAction
    );
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    const { enabled, frequency, preferredDay, preferredHour } = params;

    // Validate
    if (!['daily', 'weekly'].includes(frequency)) {
      return { success: false, message: 'Invalid frequency.' };
    }
    if (preferredDay < 0 || preferredDay > 6) {
      return { success: false, message: 'Invalid day of week.' };
    }
    if (preferredHour < 0 || preferredHour > 23) {
      return { success: false, message: 'Invalid hour.' };
    }

    // Upsert
    const [existing] = await db
      .select({ userId: digestSettings.userId })
      .from(digestSettings)
      .where(eq(digestSettings.userId, session.user.id))
      .limit(1);

    if (existing) {
      await db
        .update(digestSettings)
        .set({
          enabled,
          frequency,
          preferredDay,
          preferredHour,
          updatedAt: new Date(),
        })
        .where(eq(digestSettings.userId, session.user.id));
    } else {
      await db.insert(digestSettings).values({
        userId: session.user.id,
        enabled,
        frequency,
        preferredDay,
        preferredHour,
      });
    }

    return { success: true, message: 'Digest settings saved.' };
  } catch (error) {
    console.error('Error updating digest settings:', error);
    return { success: false, message: 'Failed to save settings.' };
  }
}
