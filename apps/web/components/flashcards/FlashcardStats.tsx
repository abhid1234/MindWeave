'use client';

import { BrainCircuit, Calendar, BookCheck, Flame } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface FlashcardStatsProps {
  totalCards: number;
  dueToday: number;
  reviewedToday: number;
  studyStreak: number;
}

export function FlashcardStats({ totalCards, dueToday, reviewedToday, studyStreak }: FlashcardStatsProps) {
  const stats = [
    { label: 'Total Cards', value: totalCards, icon: BrainCircuit, color: 'text-blue-500' },
    { label: 'Due Today', value: dueToday, icon: Calendar, color: 'text-orange-500' },
    { label: 'Reviewed Today', value: reviewedToday, icon: BookCheck, color: 'text-green-500' },
    { label: 'Study Streak', value: `${studyStreak}d`, icon: Flame, color: 'text-red-500' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center gap-3">
              <Icon className={`h-5 w-5 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
