'use client';

import { useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/toast';
import { getUnnotifiedBadgesAction, markBadgesNotifiedAction } from '@/app/actions/badges';

export function BadgeUnlockToast() {
  const { addToast } = useToast();
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    async function checkBadges() {
      const result = await getUnnotifiedBadgesAction();
      if (!result.success || !result.data || result.data.length === 0) return;

      // Show toasts for each unlocked badge
      for (const badge of result.data) {
        addToast({
          title: 'Badge Unlocked!',
          description: `You earned "${badge.name}"`,
          variant: 'success',
          duration: 6000,
        });
      }

      // Mark all as notified
      await markBadgesNotifiedAction(result.data.map((b) => b.badgeId));
    }

    checkBadges();
  }, [addToast]);

  return null;
}
