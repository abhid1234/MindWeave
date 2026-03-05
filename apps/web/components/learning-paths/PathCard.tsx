'use client';

import Link from 'next/link';
import { Route, Clock, BarChart } from 'lucide-react';
import { PathProgressBar } from './PathProgressBar';
import type { LearningPathSummary } from '@/app/actions/learning-paths';

interface PathCardProps {
  path: LearningPathSummary;
}

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export function PathCard({ path }: PathCardProps) {
  return (
    <Link
      href={`/dashboard/learning-paths/${path.id}`}
      className="group block rounded-lg border border-border/50 bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-primary/10 p-2">
          <Route className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
            {path.title}
          </h3>
          {path.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{path.description}</p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {path.difficulty && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${difficultyColors[path.difficulty] ?? ''}`}
          >
            <BarChart className="h-3 w-3" />
            {path.difficulty}
          </span>
        )}
        {path.estimatedMinutes && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {path.estimatedMinutes}m
          </span>
        )}
        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {path.itemCount} items
        </span>
      </div>

      {path.itemCount > 0 && (
        <PathProgressBar completed={path.completedCount} total={path.itemCount} className="mt-3" />
      )}
    </Link>
  );
}
