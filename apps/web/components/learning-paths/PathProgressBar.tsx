'use client';

interface PathProgressBarProps {
  completed: number;
  total: number;
  className?: string;
}

export function PathProgressBar({ completed, total, className = '' }: PathProgressBarProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className={className}>
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
        <span>
          {completed}/{total} complete
        </span>
        <span>{percentage}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${percentage}% complete`}
        />
      </div>
    </div>
  );
}
