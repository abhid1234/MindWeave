'use client';

import Link from 'next/link';
import { useCountUp } from '@/hooks/useCountUp';

interface DashboardStatsProps {
  totalCount: number;
  tagCount: number;
  thisWeekCount: number;
  favoritesCount: number;
}

function AnimatedStat({ value, label, delay, href }: { value: number; label: string; delay: number; href?: string }) {
  const animated = useCountUp(value);
  const content = (
    <>
      <div className="text-2xl font-bold">{animated.toLocaleString()}</div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-lg border bg-card p-6 animate-fade-up transition-colors hover:bg-accent cursor-pointer"
        style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
      >
        {content}
      </Link>
    );
  }

  return (
    <div
      className="rounded-lg border bg-card p-6 animate-fade-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
    >
      {content}
    </div>
  );
}

export function DashboardStats({ totalCount, tagCount, thisWeekCount, favoritesCount }: DashboardStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <AnimatedStat value={totalCount} label="Total Items" delay={0} href="/dashboard/library" />
      <AnimatedStat value={tagCount} label="Tags" delay={50} href="/dashboard/library" />
      <AnimatedStat value={thisWeekCount} label="This Week" delay={100} href="/dashboard/library" />
      <AnimatedStat value={favoritesCount} label="Favorites" delay={150} href="/dashboard/library?favorites=true" />
    </div>
  );
}
