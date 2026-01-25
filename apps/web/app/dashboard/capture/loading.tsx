import { Skeleton } from '@/components/ui/skeleton';

export default function CaptureLoading() {
  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-80" />
      </div>

      {/* Form */}
      <div className="rounded-lg border bg-card p-6 space-y-6">
        {/* Type Selection */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        {/* Body */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-32 w-full rounded-md" />
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-32 w-full rounded-md border-dashed" />
        </div>

        {/* Submit Button */}
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </div>
  );
}
