import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'default' | 'lg';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  default: 'h-5 w-5',
  lg: 'h-6 w-6',
};

function Spinner({ size = 'default', className, ...props }: SpinnerProps) {
  return (
    <div role="status" aria-label="Loading" {...props}>
      <Loader2 className={cn('animate-spin', sizeClasses[size], className)} />
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export { Spinner };
