import { Skeleton } from '@/components/ui/skeleton';

function SectionSkeleton() {
  return (
    <div className="space-y-3">
      <div>
        <Skeleton className="h-6 w-48 mb-1" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border p-4">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-full mb-1" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DiscoverLoading() {
  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-9 w-36 mb-2" />
        <Skeleton className="h-5 w-80" />
        <p className="mt-3 text-sm text-muted-foreground animate-pulse">
          Loading your recommendations...
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-10">
        <SectionSkeleton />
        <SectionSkeleton />
        <SectionSkeleton />
      </div>
    </div>
  );
}
