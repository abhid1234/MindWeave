'use client';

import { cn } from '@/lib/utils';
import {
  Sparkles, Hammer, Flame, Crown, BookOpen,
  Zap, Calendar, Rocket,
  Share2, Megaphone, TrendingUp,
  FolderPlus, Library,
  Globe, Heart, Star,
  Palette, Eye,
  Lock, Tags,
  Brain, GraduationCap, BookMarked,
} from 'lucide-react';
import type { UserBadgeWithDefinition } from '@/types/badges';

const iconMap: Record<string, React.ElementType> = {
  Sparkles, Hammer, Flame, Crown, BookOpen,
  Zap, Calendar, Rocket,
  Share2, Megaphone, TrendingUp,
  FolderPlus, Folders: Library, Library,
  Globe, Heart, Star,
  Palette, Tags, Eye,
  Brain, GraduationCap, BookMarked,
};

const tierColors = {
  bronze: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    border: 'border-amber-300 dark:border-amber-700',
    text: 'text-amber-700 dark:text-amber-300',
    icon: 'text-amber-600 dark:text-amber-400',
    progress: 'bg-amber-500',
  },
  silver: {
    bg: 'bg-slate-100 dark:bg-slate-800/30',
    border: 'border-slate-300 dark:border-slate-600',
    text: 'text-slate-700 dark:text-slate-300',
    icon: 'text-slate-500 dark:text-slate-400',
    progress: 'bg-slate-500',
  },
  gold: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    border: 'border-yellow-400 dark:border-yellow-600',
    text: 'text-yellow-700 dark:text-yellow-300',
    icon: 'text-yellow-600 dark:text-yellow-400',
    progress: 'bg-yellow-500',
  },
};

interface BadgeCardProps {
  data: UserBadgeWithDefinition;
}

export function BadgeCard({ data }: BadgeCardProps) {
  const { badge, unlocked, progress } = data;
  const Icon = iconMap[badge.icon] ?? Sparkles;
  const colors = tierColors[badge.tier];
  const progressPercent = Math.round((progress / badge.threshold) * 100);

  return (
    <div
      className={cn(
        'relative rounded-xl border p-4 transition-all duration-200',
        unlocked
          ? `${colors.bg} ${colors.border} shadow-sm`
          : 'bg-muted/30 border-border opacity-60'
      )}
      data-testid={`badge-card-${badge.id}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg',
            unlocked ? colors.bg : 'bg-muted'
          )}
        >
          {unlocked ? (
            <Icon className={cn('h-5 w-5', colors.icon)} />
          ) : (
            <Lock className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className={cn(
                'text-sm font-semibold truncate',
                unlocked ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {badge.name}
            </h3>
            <span
              className={cn(
                'text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded',
                unlocked ? `${colors.bg} ${colors.text}` : 'bg-muted text-muted-foreground'
              )}
            >
              {badge.tier}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {badge.description}
          </p>
        </div>
      </div>

      {!unlocked && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Progress</span>
            <span>
              {progress} / {badge.threshold}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', colors.progress)}
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={badge.threshold}
            />
          </div>
        </div>
      )}
    </div>
  );
}
