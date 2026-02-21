import { Skeleton } from '@/components/ui/skeleton';

export default function AskLoading() {
  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8 animate-fade-up" style={{ animationFillMode: 'backwards' }}>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div>
            <Skeleton className="h-9 w-72 mb-2" />
            <Skeleton className="h-5 w-full max-w-xl" />
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div
        className="rounded-lg border bg-card animate-fade-up"
        style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}
      >
        {/* Messages Area */}
        <div className="h-[400px] p-4 border-b">
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <Skeleton className="h-12 w-64 rounded-lg" />
            </div>
            <div className="flex justify-start">
              <Skeleton className="h-24 w-80 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4">
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1 rounded-md" />
            <Skeleton className="h-10 w-20 rounded-md" />
          </div>
        </div>
      </div>

      {/* Tips */}
      <div
        className="mt-6 animate-fade-up"
        style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}
      >
        <Skeleton className="h-5 w-48 mb-2" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
      </div>
    </div>
  );
}
