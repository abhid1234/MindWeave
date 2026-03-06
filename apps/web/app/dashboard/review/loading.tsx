export default function ReviewLoading() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded bg-muted" />
      </div>
      <div className="mb-6">
        <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
      </div>
      <div className="rounded-xl border bg-card p-6">
        <div className="mb-4 h-6 w-24 animate-pulse rounded-full bg-muted" />
        <div className="mb-2 h-6 w-3/4 animate-pulse rounded bg-muted" />
        <div className="mb-4 h-20 w-full animate-pulse rounded bg-muted" />
        <div className="flex gap-2">
          <div className="h-9 w-24 animate-pulse rounded bg-muted" />
          <div className="h-9 w-24 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
