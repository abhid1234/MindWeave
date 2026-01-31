'use client';

import { useTransition } from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/toast';
import { toggleTaskDoneAction, type TaskItem as TaskItemType } from '@/app/actions/tasks';
import { TaskDialog } from './TaskDialog';
import { DeleteTaskDialog } from './DeleteTaskDialog';

const priorityConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  high: { label: 'High', variant: 'destructive' },
  medium: { label: 'Medium', variant: 'default' },
  low: { label: 'Low', variant: 'secondary' },
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  todo: { label: 'Todo', variant: 'outline' },
  in_progress: { label: 'In Progress', variant: 'default' },
  done: { label: 'Done', variant: 'secondary' },
};

export function TaskItem({ task }: { task: TaskItemType }) {
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();
  const isDone = task.status === 'done';

  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const status = statusConfig[task.status] || statusConfig.todo;

  const isOverdue =
    task.dueDate && !isDone && new Date(task.dueDate) < new Date(new Date().toDateString());

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleTaskDoneAction(task.id);
      if (!result.success) {
        addToast({ title: result.message, variant: 'error' });
      }
    });
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-accent/50">
      <input
        type="checkbox"
        checked={isDone}
        onChange={handleToggle}
        disabled={isPending}
        className="mt-1 h-4 w-4 rounded border-gray-300 accent-primary"
        aria-label={`Mark "${task.title}" as ${isDone ? 'incomplete' : 'complete'}`}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-medium ${isDone ? 'line-through text-muted-foreground' : ''}`}>
            {task.title}
          </span>
          <Badge variant={priority.variant}>{priority.label}</Badge>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        {task.description && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{task.description}</p>
        )}
        {task.dueDate && (
          <p className={`mt-1 text-xs ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
            Due: {new Date(task.dueDate).toLocaleDateString()}
            {isOverdue && ' (overdue)'}
          </p>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <TaskDialog
            task={task}
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            }
          />
          <DeleteTaskDialog
            taskId={task.id}
            taskTitle={task.title}
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            }
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
