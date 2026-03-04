'use client';

import { useState, useEffect } from 'react';
import { Award, Trophy } from 'lucide-react';
import { BadgeGrid } from '@/components/badges/BadgeGrid';
import { getUserBadgesAction } from '@/app/actions/badges';
import type { UserBadgeWithDefinition } from '@/types/badges';

export default function BadgesPage() {
  const [badges, setBadges] = useState<UserBadgeWithDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBadges() {
      const result = await getUserBadgesAction();
      if (result.success && result.data) {
        setBadges(result.data);
      }
      setIsLoading(false);
    }
    fetchBadges();
  }, []);

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const totalCount = badges.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Award className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Badges</h1>
            <p className="text-sm text-muted-foreground">
              Track your achievements and milestones
            </p>
          </div>
        </div>
        {!isLoading && (
          <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">
              {unlockedCount} / {totalCount} unlocked
            </span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border bg-muted"
            />
          ))}
        </div>
      ) : (
        <BadgeGrid badges={badges} />
      )}
    </div>
  );
}
