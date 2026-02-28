'use client';

import { Hash, Flame, Sparkles, FileText, Link, File } from 'lucide-react';
import type { WrappedStats, WrappedCardVariant } from '@/types/wrapped';

interface WrappedCardProps {
  stats: WrappedStats;
  variant: WrappedCardVariant;
}

export function WrappedCard({ stats, variant }: WrappedCardProps) {
  switch (variant) {
    case 'overview':
      return (
        <div className="flex h-full flex-col items-center justify-center gap-6 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-white">
          <p className="text-sm font-medium uppercase tracking-wider opacity-80">Your Knowledge Base</p>
          <div className="text-center">
            <p className="text-6xl font-bold">{stats.totalItems}</p>
            <p className="mt-2 text-lg opacity-90">items captured</p>
          </div>
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              <span>{stats.contentTypeSplit.notes} notes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Link className="h-4 w-4" />
              <span>{stats.contentTypeSplit.links} links</span>
            </div>
            <div className="flex items-center gap-1.5">
              <File className="h-4 w-4" />
              <span>{stats.contentTypeSplit.files} files</span>
            </div>
          </div>
          {stats.monthOverMonthGrowth !== 0 && (
            <p className="text-sm opacity-80">
              {stats.monthOverMonthGrowth > 0 ? '+' : ''}{stats.monthOverMonthGrowth}% vs last month
            </p>
          )}
        </div>
      );

    case 'top-tags':
      return (
        <div className="flex h-full flex-col items-center justify-center gap-6 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-8 text-white">
          <Hash className="h-8 w-8 opacity-80" />
          <p className="text-sm font-medium uppercase tracking-wider opacity-80">Top Topics</p>
          <div className="flex flex-wrap justify-center gap-2">
            {stats.topTags.map((tag, i) => (
              <span
                key={tag}
                className="rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium backdrop-blur-sm"
                style={{ fontSize: `${Math.max(14, 20 - i * 2)}px` }}
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="text-sm opacity-80">{stats.uniqueTagCount} unique tags across your library</p>
        </div>
      );

    case 'streak':
      return (
        <div className="flex h-full flex-col items-center justify-center gap-6 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 p-8 text-white">
          <Flame className="h-8 w-8 opacity-80" />
          <p className="text-sm font-medium uppercase tracking-wider opacity-80">Activity Streaks</p>
          <div className="text-center">
            <p className="text-5xl font-bold">{stats.longestStreak}</p>
            <p className="mt-1 text-lg opacity-90">day longest streak</p>
          </div>
          <div className="flex gap-6 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.currentStreak}</p>
              <p className="opacity-80">current</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.totalActiveDays}</p>
              <p className="opacity-80">active days</p>
            </div>
          </div>
          <p className="text-sm opacity-80">Most active on {stats.mostActiveDay}s</p>
        </div>
      );

    case 'personality':
      return (
        <div className="flex h-full flex-col items-center justify-center gap-6 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-700 p-8 text-white">
          <Sparkles className="h-8 w-8 opacity-80" />
          <p className="text-sm font-medium uppercase tracking-wider opacity-80">Your Knowledge Personality</p>
          <p className="text-3xl font-bold text-center">{stats.knowledgePersonality}</p>
          <p className="text-center text-sm opacity-90 max-w-xs">{stats.personalityDescription}</p>
          {stats.mostConnectedContent && (
            <div className="mt-2 text-center text-sm opacity-80">
              <p>Most connected: &ldquo;{stats.mostConnectedContent.title}&rdquo;</p>
              <p>({stats.mostConnectedContent.connectionCount} connections)</p>
            </div>
          )}
        </div>
      );
  }
}
