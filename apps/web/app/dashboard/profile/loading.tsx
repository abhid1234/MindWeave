import { Skeleton } from '@/components/ui/skeleton';

export default function ProfileLoading() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6 animate-fade-up" style={{ animationFillMode: 'backwards' }}>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-80" />
          </div>
        </div>
      </div>

      {/* Form fields */}
      <div className="animate-fade-up space-y-6" style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}>
        <div>
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        <div>
          <Skeleton className="h-4 w-12 mb-2" />
          <Skeleton className="h-24 w-full rounded-md" />
        </div>
        <div>
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-6 w-10 rounded-full" />
        </div>
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
    </div>
  );
}
