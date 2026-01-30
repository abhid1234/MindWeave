'use client';

import { useCountUp } from '@/hooks/useCountUp';

interface DashboardStatsProps {
  totalCount: number;
}

function AnimatedStat({ value, label, delay }: { value: number; label: string; delay: number }) {
  const animated = useCountUp(value);
  return (
    <div
      className="rounded-lg border bg-card p-6 animate-fade-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
    >
      <div className="text-2xl font-bold">{animated.toLocaleString()}</div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function DashboardStats({ totalCount }: DashboardStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <AnimatedStat value={totalCount} label="Total Items" delay={0} />
      <AnimatedStat value={0} label="Tags" delay={50} />
      <AnimatedStat value={0} label="This Week" delay={100} />
      <AnimatedStat value={0} label="Searches" delay={150} />
    </div>
  );
}
