'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { userBadges } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { CacheTags } from '@/lib/cache';
import { BADGE_DEFINITIONS } from '@/lib/badges/definitions';
import { checkBadgesForUser, getProgressForBadge } from '@/lib/badges/engine';
import type {
  BadgeTrigger,
  UserBadgeWithDefinition,
  BadgesActionResult,
  PublicBadgesResult,
} from '@/types/badges';

export async function getUserBadgesAction(): Promise<BadgesActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const userId = session.user.id;

    // Run manual_check to catch any missed badges
    await checkBadgesForUser(userId, 'manual_check');

    // Get all unlocked badges
    const unlocked = await db
      .select()
      .from(userBadges)
      .where(eq(userBadges.userId, userId));

    const unlockedMap = new Map(
      unlocked.map((u) => [u.badgeId, u.unlockedAt])
    );

    // Build full list with progress
    const badges: UserBadgeWithDefinition[] = await Promise.all(
      BADGE_DEFINITIONS.map(async (badge) => {
        const isUnlocked = unlockedMap.has(badge.id);
        const progress = isUnlocked
          ? badge.threshold
          : await getProgressForBadge(userId, badge);
        return {
          badge,
          unlocked: isUnlocked,
          unlockedAt: unlockedMap.get(badge.id) ?? null,
          progress,
        };
      })
    );

    return { success: true, data: badges };
  } catch (error) {
    console.error('Error getting user badges:', error);
    return { success: false, message: 'Failed to fetch badges' };
  }
}

export async function checkAndUnlockBadgesAction(
  trigger: BadgeTrigger,
  targetUserId?: string
): Promise<{ success: boolean; newlyUnlocked: string[]; message?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, newlyUnlocked: [], message: 'Unauthorized' };
    }

    const userId = targetUserId ?? session.user.id;
    const newlyUnlocked = await checkBadgesForUser(userId, trigger);

    if (newlyUnlocked.length > 0) {
      revalidateTag(CacheTags.BADGES);
    }

    return { success: true, newlyUnlocked };
  } catch (error) {
    console.error('Error checking badges:', error);
    return { success: false, newlyUnlocked: [], message: 'Failed to check badges' };
  }
}

export async function getPublicBadgesAction(
  userId: string
): Promise<PublicBadgesResult> {
  try {
    const unlocked = await db
      .select()
      .from(userBadges)
      .where(eq(userBadges.userId, userId));

    const data = unlocked
      .map((u) => {
        const badge = BADGE_DEFINITIONS.find((b) => b.id === u.badgeId);
        if (!badge) return null;
        return { badge, unlockedAt: u.unlockedAt };
      })
      .filter((b): b is NonNullable<typeof b> => b !== null);

    return { success: true, data };
  } catch (error) {
    console.error('Error getting public badges:', error);
    return { success: false, message: 'Failed to fetch public badges' };
  }
}

export async function getUnnotifiedBadgesAction(): Promise<{
  success: boolean;
  data?: { badgeId: string; name: string; tier: string; icon: string }[];
  message?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const unnotified = await db
      .select()
      .from(userBadges)
      .where(
        and(
          eq(userBadges.userId, session.user.id),
          eq(userBadges.notified, false)
        )
      );

    const data = unnotified
      .map((u) => {
        const badge = BADGE_DEFINITIONS.find((b) => b.id === u.badgeId);
        if (!badge) return null;
        return {
          badgeId: badge.id,
          name: badge.name,
          tier: badge.tier,
          icon: badge.icon,
        };
      })
      .filter((b): b is NonNullable<typeof b> => b !== null);

    return { success: true, data };
  } catch (error) {
    console.error('Error getting unnotified badges:', error);
    return { success: false, message: 'Failed to fetch unnotified badges' };
  }
}

export async function markBadgesNotifiedAction(
  badgeIds: string[]
): Promise<{ success: boolean; message?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    if (badgeIds.length === 0) {
      return { success: true };
    }

    await db
      .update(userBadges)
      .set({ notified: true })
      .where(
        and(
          eq(userBadges.userId, session.user.id),
          inArray(userBadges.badgeId, badgeIds)
        )
      );

    return { success: true };
  } catch (error) {
    console.error('Error marking badges notified:', error);
    return { success: false, message: 'Failed to mark badges as notified' };
  }
}
