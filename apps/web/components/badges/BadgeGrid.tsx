'use client';

import { BadgeCard } from './BadgeCard';
import { BADGE_CATEGORIES } from '@/lib/badges/definitions';
import type { UserBadgeWithDefinition } from '@/types/badges';

interface BadgeGridProps {
  badges: UserBadgeWithDefinition[];
}

export function BadgeGrid({ badges }: BadgeGridProps) {
  return (
    <div className="space-y-8">
      {BADGE_CATEGORIES.map((category) => {
        const categoryBadges = badges.filter(
          (b) => b.badge.category === category.id
        );
        const unlockedCount = categoryBadges.filter((b) => b.unlocked).length;

        return (
          <section key={category.id} data-testid={`badge-category-${category.id}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {category.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {category.description}
                </p>
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                {unlockedCount} / {categoryBadges.length}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categoryBadges.map((badge) => (
                <BadgeCard key={badge.badge.id} data={badge} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
