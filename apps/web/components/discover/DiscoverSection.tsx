'use client';

import type { LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export type DiscoverSectionProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  isLoading?: boolean;
  isEmpty?: boolean;
  children?: React.ReactNode;
};

function LoadingSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="discover-section-loading">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-lg border p-4">
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-3 w-full mb-1" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function DiscoverSection({
  title,
  description,
  icon: Icon,
  isLoading = false,
  isEmpty = false,
  children,
}: DiscoverSectionProps) {
  if (isEmpty && !isLoading) return null;

  return (
    <section className="space-y-3" aria-labelledby={`discover-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div>
        <h2
          id={`discover-${title.toLowerCase().replace(/\s+/g, '-')}`}
          className="text-lg font-semibold flex items-center gap-2"
        >
          <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
          {title}
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="discover-section-grid">
          {children}
        </div>
      )}
    </section>
  );
}
