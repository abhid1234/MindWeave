'use client';

import { useState } from 'react';
import { Bell, Clock } from 'lucide-react';
import { setReminderAction } from '@/app/actions/reminders';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const INTERVALS = [
  { value: '1d' as const, label: 'Tomorrow' },
  { value: '3d' as const, label: 'In 3 days' },
  { value: '7d' as const, label: 'In 1 week' },
  { value: '30d' as const, label: 'In 1 month' },
];

type ReminderButtonProps = {
  contentId: string;
  variant?: 'button' | 'menuItem';
};

export function ReminderButton({ contentId, variant = 'button' }: ReminderButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const { addToast } = useToast();

  const handleSetReminder = async (interval: '1d' | '3d' | '7d' | '30d') => {
    setIsPending(true);
    try {
      const result = await setReminderAction({ contentId, interval });
      if (result.success) {
        addToast({ variant: 'success', title: 'Reminder set' });
      } else {
        addToast({ variant: 'error', title: result.message });
      }
    } catch {
      addToast({ variant: 'error', title: 'Failed to set reminder' });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === 'button' ? (
          <Button variant="outline" size="sm" disabled={isPending}>
            <Bell className="mr-1.5 h-3.5 w-3.5" />
            Remind Me
          </Button>
        ) : (
          <button
            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground hover:bg-accent w-full"
            disabled={isPending}
          >
            <Bell className="mr-2 h-4 w-4" />
            Remind Me
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {INTERVALS.map((interval) => (
          <DropdownMenuItem
            key={interval.value}
            onClick={() => handleSetReminder(interval.value)}
          >
            <Clock className="mr-2 h-4 w-4" />
            {interval.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
