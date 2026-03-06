export default function BrainDumpLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="h-5 w-96 rounded bg-muted animate-pulse" />
      </div>
      <div className="h-[300px] w-full rounded-lg bg-muted animate-pulse" />
      <div className="flex justify-between">
        <div className="h-5 w-32 rounded bg-muted animate-pulse" />
        <div className="h-10 w-40 rounded-lg bg-muted animate-pulse" />
      </div>
    </div>
  );
}
