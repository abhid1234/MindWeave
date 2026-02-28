'use client';

import { useState, useEffect } from 'react';
import { Flame, Calendar, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getStreakDataAction } from '@/app/actions/analytics';
import type { StreakData } from '@/types/analytics';
import { cn } from '@/lib/utils';

export function StreakCard() {
  const [data, setData] = useState<StreakData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const result = await getStreakDataAction();
        if (result.success && result.data) {
          setData(result.data);
        }
      } catch {
        // Silently fail - card just shows skeleton
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) {
    return <div className="h-[200px] animate-pulse rounded-lg bg-muted" data-testid="streak-skeleton" />;
  }

  if (!data) return null;

  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-muted';
    if (count === 1) return 'bg-primary/20';
    if (count <= 3) return 'bg-primary/40';
    if (count <= 5) return 'bg-primary/60';
    return 'bg-primary/80';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Flame className="h-5 w-5 text-orange-500" />
          Activity Streak
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-6 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{data.currentStreak}</div>
            <div className="text-xs text-muted-foreground">Current Streak</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="text-2xl font-bold">{data.longestStreak}</span>
            </div>
            <div className="text-xs text-muted-foreground">Longest Streak</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{data.totalActiveDays}</span>
            </div>
            <div className="text-xs text-muted-foreground">Active Days</div>
          </div>
        </div>

        {/* Heatmap */}
        <div className="grid grid-cols-[repeat(13,14px)] gap-[3px]" role="img" aria-label="Activity heatmap for the last 90 days">
          {data.heatmap.map((day) => (
            <div
              key={day.date}
              className={cn(
                'h-[14px] w-[14px] rounded-sm transition-colors',
                getHeatmapColor(day.count)
              )}
              title={`${day.date}: ${day.count} items`}
            />
          ))}
        </div>
        <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-muted-foreground">
          <span>Less</span>
          <div className="h-2.5 w-2.5 rounded-sm bg-muted" />
          <div className="h-2.5 w-2.5 rounded-sm bg-primary/20" />
          <div className="h-2.5 w-2.5 rounded-sm bg-primary/40" />
          <div className="h-2.5 w-2.5 rounded-sm bg-primary/60" />
          <div className="h-2.5 w-2.5 rounded-sm bg-primary/80" />
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}
