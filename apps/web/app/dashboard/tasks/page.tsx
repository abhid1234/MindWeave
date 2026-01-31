import { getTasksAction } from '@/app/actions/tasks';
import { TaskFilterBar } from '@/components/tasks/TaskFilterBar';
import { TaskList } from '@/components/tasks/TaskList';

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Tasks</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your tasks and track progress
        </p>
      </div>

      <TaskFilterBar />
      <TaskList items={items} />
    </div>
  );
}
