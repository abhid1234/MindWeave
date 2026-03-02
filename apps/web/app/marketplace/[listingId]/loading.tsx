export default function ListingLoading() {
  return (
    <div className="space-y-6">
      {/* Back link skeleton */}
      <div className="h-5 w-40 animate-pulse rounded bg-muted" />

      {/* Header skeleton */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex-1 space-y-3">
          <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
          <div className="h-8 w-72 animate-pulse rounded-lg bg-muted" />
          <div className="h-5 w-full max-w-lg animate-pulse rounded-lg bg-muted" />
          <div className="flex gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-5 w-16 animate-pulse rounded bg-muted" />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-12 w-48 animate-pulse rounded-lg bg-muted" />
          <div className="h-16 w-48 animate-pulse rounded-lg border bg-muted" />
        </div>
      </div>

      {/* Content preview skeleton */}
      <div className="space-y-3">
        <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        <div className="rounded-xl border divide-y">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="h-4 w-4 animate-pulse rounded bg-muted" />
              <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
