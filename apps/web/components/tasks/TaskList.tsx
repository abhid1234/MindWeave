'use client';

import { Plus, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TaskItem as TaskItemType } from '@/app/actions/tasks';
import { TaskItem } from './TaskItem';
import { TaskDialog } from './TaskDialog';

type TaskListProps = {
  items: TaskItemType[];
};

export function TaskList({ items }: TaskListProps) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {items.length} task{items.length !== 1 ? 's' : ''}
        </p>
        <TaskDialog
          trigger={
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          }
        />
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <ClipboardList className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">No tasks yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first task to get started.
          </p>
          <TaskDialog
            trigger={
              <Button className="mt-4" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
