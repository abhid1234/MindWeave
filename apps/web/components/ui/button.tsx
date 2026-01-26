import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          // Base styles
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium',
          'transition-all duration-200 ease-smooth',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:pointer-events-none disabled:opacity-50',
          'active:scale-[0.98]',
          // Variants
          {
            // Default - primary with subtle shadow
            'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md':
              variant === 'default',
            // Destructive
            'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90':
              variant === 'destructive',
            // Outline - refined border
            'border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/20':
              variant === 'outline',
            // Secondary - subtle background
            'bg-secondary text-secondary-foreground hover:bg-secondary/80':
              variant === 'secondary',
            // Ghost - minimal
            'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
            // Link - text only
            'text-primary underline-offset-4 hover:underline': variant === 'link',
          },
          // Sizes
          {
            'h-10 px-4 py-2 text-sm': size === 'default',
            'h-8 px-3 text-xs': size === 'sm',
            'h-12 px-6 text-base': size === 'lg',
            'h-10 w-10 p-0': size === 'icon',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };
