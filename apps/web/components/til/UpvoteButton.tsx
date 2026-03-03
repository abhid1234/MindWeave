'use client';

import { useState, useTransition } from 'react';
import { ArrowBigUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { upvoteTilAction } from '@/app/actions/til';

interface UpvoteButtonProps {
  tilId: string;
  initialCount: number;
  initialUpvoted: boolean;
  isAuthenticated: boolean;
  size?: 'sm' | 'lg';
}

export function UpvoteButton({
  tilId,
  initialCount,
  initialUpvoted,
  isAuthenticated,
  size = 'sm',
}: UpvoteButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [upvoted, setUpvoted] = useState(initialUpvoted);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleClick = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Optimistic update
    const newUpvoted = !upvoted;
    setUpvoted(newUpvoted);
    setCount((prev) => prev + (newUpvoted ? 1 : -1));

    startTransition(async () => {
      const result = await upvoteTilAction(tilId);
      if (!result.success) {
        // Revert optimistic update
        setUpvoted(!newUpvoted);
        setCount((prev) => prev + (newUpvoted ? -1 : 1));
      }
    });
  };

  const isLarge = size === 'lg';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`inline-flex items-center gap-1 rounded-lg border font-medium transition-all ${
        upvoted
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-input text-muted-foreground hover:border-primary/50 hover:text-primary'
      } ${isLarge ? 'px-4 py-2 text-sm' : 'px-2.5 py-1 text-xs'} ${
        isPending ? 'opacity-50' : ''
      }`}
      aria-label={upvoted ? 'Remove upvote' : 'Upvote'}
    >
      <ArrowBigUp
        className={`${isLarge ? 'h-5 w-5' : 'h-4 w-4'} ${upvoted ? 'fill-primary' : ''}`}
      />
      <span>{count}</span>
    </button>
  );
}
