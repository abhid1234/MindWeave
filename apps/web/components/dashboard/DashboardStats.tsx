'use client';

import Link from 'next/link';
import { useCountUp } from '@/hooks/useCountUp';
import { Library, Tags, CalendarDays, Star } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface DashboardStatsProps {
  totalCount: number;
  tagCount: number;
  thisWeekCount: number;
  favoritesCount: number;
}

interface StatConfig {
  value: number;
  label: string;
  href: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  borderHover: string;
}

function AnimatedStat({
  value,
  label,
  delay,
  href,
  icon: Icon,
  iconBg,
  iconColor,
  borderHover,
}: {
  value: number;
  label: string;
  delay: number;
  href: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  borderHover: string;
}) {
  const animated = useCountUp(value);

  return (
    <Link
      href={href}
      className={`bg-card animate-fade-up hover:shadow-soft-md group block cursor-pointer rounded-xl border p-5 transition-all duration-200 hover:-translate-y-0.5 ${borderHover}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <div className="text-2xl font-bold tracking-tight">{animated.toLocaleString()}</div>
          <p className="text-muted-foreground text-sm">{label}</p>
        </div>
      </div>
    </Link>
  );
}

export function DashboardStats({
  totalCount,
  tagCount,
  thisWeekCount,
  favoritesCount,
}: DashboardStatsProps) {
  const stats: StatConfig[] = [
    {
      value: totalCount,
      label: 'Total Items',
      href: '/dashboard/library',
      icon: Library,
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-600',
      borderHover: 'hover:border-blue-500/30',
    },
    {
      value: tagCount,
      label: 'Tags',
      href: '/dashboard/library',
      icon: Tags,
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-600',
      borderHover: 'hover:border-purple-500/30',
    },
    {
      value: thisWeekCount,
      label: 'This Week',
      href: '/dashboard/library',
      icon: CalendarDays,
      iconBg: 'bg-green-500/10',
      iconColor: 'text-green-600',
      borderHover: 'hover:border-green-500/30',
    },
    {
      value: favoritesCount,
      label: 'Favorites',
      href: '/dashboard/library?favorites=true',
      icon: Star,
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-600',
      borderHover: 'hover:border-amber-500/30',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, i) => (
        <AnimatedStat
          key={stat.label}
          value={stat.value}
          label={stat.label}
          delay={i * 50}
          href={stat.href}
          icon={stat.icon}
          iconBg={stat.iconBg}
          iconColor={stat.iconColor}
          borderHover={stat.borderHover}
        />
      ))}
    </div>
  );
}
