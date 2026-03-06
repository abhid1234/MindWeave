'use client';

import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface ReviewCompleteProps {
  reviewedCount: number;
}

export function ReviewComplete({ reviewedCount }: ReviewCompleteProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border bg-card p-12 text-center shadow-soft">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
        <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
      </div>
      <h2 className="text-2xl font-bold">All caught up!</h2>
      <p className="mt-2 text-muted-foreground">
        You reviewed {reviewedCount} {reviewedCount === 1 ? 'item' : 'items'} today.
      </p>
      <Link href="/dashboard" className="mt-6">
        <Button variant="outline">Back to Dashboard</Button>
      </Link>
    </div>
  );
}
