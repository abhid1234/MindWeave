'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Sparkles, Hammer, Flame, Crown, BookOpen,
  Zap, Calendar, Rocket,
  Share2, Megaphone, TrendingUp,
  FolderPlus, Library,
  Globe, Heart, Star,
  Palette, Eye, Award, Tags,
} from 'lucide-react';
import { getPublicBadgesAction } from '@/app/actions/badges';
import type { BadgeDefinition } from '@/types/badges';

const iconMap: Record<string, React.ElementType> = {
  Sparkles, Hammer, Flame, Crown, BookOpen,
  Zap, Calendar, Rocket,
  Share2, Megaphone, TrendingUp,
  FolderPlus, Folders: Library, Library,
  Globe, Heart, Star,
  Palette, Tags, Eye,
};

const tierColors = {
  bronze: 'text-amber-600 dark:text-amber-400',
  silver: 'text-slate-500 dark:text-slate-400',
  gold: 'text-yellow-600 dark:text-yellow-400',
};

interface BadgeShowcaseProps {
  userId: string;
}

export function BadgeShowcase({ userId }: BadgeShowcaseProps) {
  const [badges, setBadges] = useState<{ badge: BadgeDefinition; unlockedAt: Date }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBadges() {
      const result = await getPublicBadgesAction(userId);
      if (result.success && result.data) {
        // Sort by most recent, take top 5
        const sorted = [...result.data]
          .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())
          .slice(0, 5);
        setBadges(sorted);
      }
      setIsLoading(false);
    }
    fetchBadges();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (badges.length === 0) return null;

  return (
    <div data-testid="badge-showcase">
      <div className="flex items-center gap-2 mb-2">
        <Award className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">Badges</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {badges.map(({ badge }) => {
          const Icon = iconMap[badge.icon] ?? Sparkles;
          return (
            <div
              key={badge.id}
              className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium bg-card"
              title={badge.description}
            >
              <Icon className={cn('h-3.5 w-3.5', tierColors[badge.tier])} />
              <span>{badge.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
