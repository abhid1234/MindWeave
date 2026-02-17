import { Skeleton } from '@/components/ui/skeleton';

function SearchResultSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 animate-in fade-in-50 duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-3/4 mb-3" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-4 w-24 ml-4" />
      </div>
    </div>
  );
}

export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-9 w-28 mb-2" />
        <Skeleton className="h-5 w-64" />
        <p className="mt-3 text-sm text-muted-foreground animate-pulse">Loading your search...</p>
      </div>

      {/* Search Form */}
      <div className="mb-6">
        <div className="flex gap-2 mb-4">
          <Skeleton className="h-10 flex-1 rounded-md" />
          <Skeleton className="h-10 w-24 rounded-md" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32 rounded-md" />
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
      </div>

      {/* Results */}
      <Skeleton className="h-5 w-48 mb-4" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SearchResultSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
