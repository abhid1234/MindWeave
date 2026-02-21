import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

function ContentCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-2/3 mb-3" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
    </div>
  );
}

export default function LibraryLoading() {
  return (
    <div className="mx-auto max-w-7xl">
      {/* Header with icon badge */}
      <div className="mb-8 animate-fade-up">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div>
            <Skeleton className="h-9 w-32 mb-1" />
            <Skeleton className="h-5 w-64" />
          </div>
        </div>
      </div>

      {/* Tab Toggle skeleton (pill container) */}
      <div className="mb-6 animate-fade-up" style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}>
        <Skeleton className="h-11 w-64 rounded-lg" />
      </div>

      <div className="flex flex-col lg:flex-row gap-6 animate-fade-up" style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}>
        <div className="flex-1 min-w-0">
          {/* Search and Collection Filter */}
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <Skeleton className="h-10 w-32 rounded-md" />
            <Skeleton className="h-10 w-40 rounded-md" />
          </div>

          {/* Filters wrapped in Card */}
          <Card className="mb-6">
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <Skeleton className="h-3 w-12 mb-2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-16 rounded-lg" />
                    <Skeleton className="h-9 w-20 rounded-lg" />
                    <Skeleton className="h-9 w-20 rounded-lg" />
                    <Skeleton className="h-9 w-20 rounded-lg" />
                  </div>
                </div>
                <Skeleton className="h-9 w-28 rounded-lg" />
              </div>
              <div>
                <Skeleton className="h-3 w-16 mb-2" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-28 rounded-lg" />
                  <Skeleton className="h-9 w-24 rounded-lg" />
                  <Skeleton className="h-9 w-24 rounded-lg" />
                  <Skeleton className="h-9 w-24 rounded-lg" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Grid Skeleton */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-fade-up"
                style={{ animationDelay: `${200 + i * 50}ms`, animationFillMode: 'backwards' }}
              >
                <ContentCardSkeleton />
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar skeleton */}
        <aside className="lg:w-72 shrink-0">
          <Skeleton className="h-64 w-full rounded-xl" />
        </aside>
      </div>
    </div>
  );
}
