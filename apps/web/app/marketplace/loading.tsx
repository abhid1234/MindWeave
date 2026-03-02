export default function MarketplaceLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-64 animate-pulse rounded-lg bg-muted" />
        <div className="mt-2 h-5 w-96 animate-pulse rounded-lg bg-muted" />
      </div>

      {/* Filter skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="h-10 flex-1 animate-pulse rounded-lg bg-muted" />
        <div className="h-10 w-40 animate-pulse rounded-lg bg-muted" />
        <div className="h-10 w-60 animate-pulse rounded-lg bg-muted" />
      </div>

      {/* Grid skeleton */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-48 animate-pulse rounded-xl border bg-muted" />
        ))}
      </div>
    </div>
  );
}
