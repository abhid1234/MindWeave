'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

const statuses = [
  { value: '', label: 'All' },
  { value: 'todo', label: 'Todo' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

const priorities = [
  { value: '', label: 'All' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export function TaskFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get('status') || '';
  const currentPriority = searchParams.get('priority') || '';

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/dashboard/tasks?${params.toString()}`);
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Status:</span>
        <div className="flex gap-1">
          {statuses.map((s) => (
            <Button
              key={s.value}
              variant={currentStatus === s.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateFilter('status', s.value)}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Priority:</span>
        <div className="flex gap-1">
          {priorities.map((p) => (
            <Button
              key={p.value}
              variant={currentPriority === p.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateFilter('priority', p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
