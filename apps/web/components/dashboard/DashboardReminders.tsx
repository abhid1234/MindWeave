'use client';

import { useState, useEffect } from 'react';
import { Bell, Clock, X, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import {
  getActiveRemindersAction,
  dismissReminderAction,
  snoozeReminderAction,
} from '@/app/actions/reminders';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/toast';

type ReminderItem = {
  id: string;
  contentId: string;
  title: string;
  type: string;
  interval: string;
  nextRemindAt: Date;
};

function formatTimeUntil(date: Date): string {
  const now = new Date();
  const diff = new Date(date).getTime() - now.getTime();
  if (diff <= 0) return 'Due now';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `In ${days}d`;
  if (hours > 0) return `In ${hours}h`;
  const minutes = Math.floor(diff / (1000 * 60));
  return `In ${minutes}m`;
}

export function DashboardReminders() {
  const [reminderList, setReminderList] = useState<ReminderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    getActiveRemindersAction().then((result) => {
      if (cancelled) return;
      if (result.success) {
        setReminderList(result.reminders);
      }
      setIsLoading(false);
    }).catch(() => {
      if (!cancelled) setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const handleDismiss = async (reminderId: string) => {
    const result = await dismissReminderAction(reminderId);
    if (result.success) {
      setReminderList((prev) => prev.filter((r) => r.id !== reminderId));
      addToast({ variant: 'success', title: 'Reminder dismissed' });
    }
  };

  const handleSnooze = async (reminderId: string, duration: '1d' | '3d' | '7d') => {
    const result = await snoozeReminderAction({ reminderId, duration });
    if (result.success) {
      addToast({ variant: 'success', title: 'Reminder snoozed' });
      // Refresh
      const refreshed = await getActiveRemindersAction();
      if (refreshed.success) {
        setReminderList(refreshed.reminders);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-12 animate-pulse rounded-lg bg-muted" />
        <div className="h-12 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (reminderList.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Bell className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Reminders</h3>
      </div>
      <div className="space-y-2">
        {reminderList.map((reminder) => {
          const isDue = new Date(reminder.nextRemindAt).getTime() <= Date.now();
          return (
            <div
              key={reminder.id}
              className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                isDue ? 'border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/10' : 'bg-card'
              }`}
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/dashboard/library?highlight=${reminder.contentId}`}
                  className="text-sm font-medium hover:underline line-clamp-1"
                >
                  {reminder.title}
                </Link>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`flex items-center gap-1 text-xs ${
                    isDue ? 'text-amber-600 font-medium' : 'text-muted-foreground'
                  }`}>
                    <Clock className="h-3 w-3" />
                    {formatTimeUntil(reminder.nextRemindAt)}
                  </span>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleSnooze(reminder.id, '1d')}>
                    Snooze 1 day
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSnooze(reminder.id, '3d')}>
                    Snooze 3 days
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSnooze(reminder.id, '7d')}>
                    Snooze 1 week
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDismiss(reminder.id)}>
                    <X className="mr-2 h-4 w-4" />
                    Dismiss
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>
    </div>
  );
}
