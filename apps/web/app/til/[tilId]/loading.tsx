export default function TilDetailLoading() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="rounded-xl border bg-card shadow-soft">
        <div className="p-6 border-b space-y-3">
          <div className="h-8 w-3/4 bg-muted animate-pulse rounded-lg" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 bg-muted animate-pulse rounded-full" />
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </div>
            <div className="flex gap-4">
              <div className="h-4 w-16 bg-muted animate-pulse rounded" />
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
        <div className="p-6 space-y-3">
          <div className="h-4 w-full bg-muted animate-pulse rounded" />
          <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
          <div className="h-4 w-4/6 bg-muted animate-pulse rounded" />
        </div>
        <div className="p-6 border-t flex items-center justify-between">
          <div className="h-10 w-24 bg-muted animate-pulse rounded-lg" />
          <div className="h-10 w-36 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    </div>
  );
}
