import { Skeleton } from '@/components/ui/skeleton';

export default function ImportLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div className="animate-fade-up" style={{ animationFillMode: 'backwards' }}>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
        </div>
      </div>

      {/* Step indicator skeleton */}
      <div
        className="flex items-center justify-center gap-4 animate-fade-up"
        style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}
      >
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-0.5 w-16" />
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-0.5 w-16" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>

      {/* Content skeleton */}
      <div
        className="animate-fade-up"
        style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}
      >
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>

        {/* Button skeleton */}
        <div className="mt-6 flex justify-end">
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  );
}
