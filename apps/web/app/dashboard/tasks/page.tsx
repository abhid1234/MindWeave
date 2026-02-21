import type { Metadata } from 'next';
import { getTasksAction } from '@/app/actions/tasks';
import { TaskFilterBar } from '@/components/tasks/TaskFilterBar';
import { TaskList } from '@/components/tasks/TaskList';
import { CheckSquare } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Tasks | Mindweave',
  description: 'Manage your tasks and track progress',
};

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    priority?: string;
  }>;
}) {
  const params = await searchParams;

  const { items } = await getTasksAction({
    status: params.status,
    priority: params.priority,
  });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 animate-fade-up" style={{ animationFillMode: 'backwards' }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <CheckSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Tasks</h1>
            <p className="text-muted-foreground">
              Manage your tasks and track progress
            </p>
          </div>
        </div>
      </div>

      <div className="animate-fade-up" style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}>
        <TaskFilterBar />
      </div>
      <div className="animate-fade-up" style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}>
        <TaskList items={items} />
      </div>
    </div>
  );
}
