import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-9 w-64 mb-2 animate-fade-up stagger-1" style={{ animationFillMode: 'backwards' }} />
        <Skeleton className="h-5 w-80 animate-fade-up stagger-2" style={{ animationFillMode: 'backwards' }} />
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`rounded-lg border bg-card p-6 animate-fade-up stagger-${i + 1}`}
            style={{ animationFillMode: 'backwards' }}
          >
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>

      {/* Recent items */}
      <div className="mt-8">
        <Skeleton className="h-7 w-32 mb-4 animate-fade-up stagger-5" style={{ animationFillMode: 'backwards' }} />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton
              key={i}
              className={`h-20 w-full rounded-lg animate-fade-up stagger-${i + 5}`}
              style={{ animationFillMode: 'backwards' }}
            />
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton
            key={i}
            className={`h-24 rounded-lg animate-fade-up stagger-${i + 6}`}
            style={{ animationFillMode: 'backwards' }}
          />
        ))}
      </div>
    </div>
  );
}
