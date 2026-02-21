import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function TasksLoading() {
  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8 animate-fade-up" style={{ animationFillMode: 'backwards' }}>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div>
            <Skeleton className="h-9 w-32 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="animate-fade-up" style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}>
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-12" />
                <div className="flex gap-1">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-20 rounded-md" />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-14" />
                <div className="flex gap-1">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-16 rounded-md" />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task list */}
      <div className="animate-fade-up" style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}>
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
