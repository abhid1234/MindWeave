import { cn } from '@/lib/utils';

type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  shimmer?: boolean;
};

function Skeleton({ className, shimmer = true, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-lg bg-muted',
        shimmer && 'relative overflow-hidden',
        shimmer &&
          'before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent',
        !shimmer && 'animate-pulse',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
