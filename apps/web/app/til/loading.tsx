export default function TilLoading() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="h-9 w-64 mx-auto bg-muted animate-pulse rounded-lg" />
        <div className="h-5 w-96 mx-auto bg-muted animate-pulse rounded-lg" />
      </div>

      {/* Filters skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1 h-10 bg-muted animate-pulse rounded-lg" />
        <div className="h-10 w-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-10 w-48 bg-muted animate-pulse rounded-lg" />
      </div>

      {/* Cards skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl border bg-muted" />
        ))}
      </div>
    </div>
  );
}
