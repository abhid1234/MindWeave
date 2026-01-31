'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { tasks } from '@/lib/db/schema';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { eq, desc, and, type SQL } from 'drizzle-orm';

export type ActionResult = {
  success: boolean;
  message: string;
  data?: { id: string };
  errors?: Partial<Record<string, string[]>>;
};

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title is too long'),
  description: z.string().max(5000, 'Description is too long').optional(),
  status: z.enum(['todo', 'in_progress', 'done']).default('todo'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.string().optional(),
});

const updateTaskSchema = createTaskSchema.partial();

export type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type GetTasksParams = {
  status?: string;
  priority?: string;
};

export type GetTasksResult = {
  success: boolean;
  items: TaskItem[];
};

export async function getTasksAction(
  params: GetTasksParams = {}
): Promise<GetTasksResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, items: [] };
    }

    const conditions: SQL[] = [eq(tasks.userId, session.user.id)];

    if (params.status) {
      conditions.push(eq(tasks.status, params.status));
    }
    if (params.priority) {
      conditions.push(eq(tasks.priority, params.priority));
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    const items = await db
      .select()
      .from(tasks)
      .where(whereClause)
      .orderBy(desc(tasks.createdAt));

    return { success: true, items };
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return { success: false, items: [] };
  }
}

export async function createTaskAction(data: {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
}): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized. Please log in.' };
    }

    const validationResult = createTaskSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        message: 'Validation failed.',
        errors: validationResult.error.flatten().fieldErrors,
      };
    }

    const validated = validationResult.data;

    const [newTask] = await db
      .insert(tasks)
      .values({
        userId: session.user.id,
        title: validated.title,
        description: validated.description || null,
        status: validated.status,
        priority: validated.priority,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
      })
      .returning({ id: tasks.id });

    revalidatePath('/dashboard/tasks');

    return {
      success: true,
      message: 'Task created successfully!',
      data: { id: newTask.id },
    };
  } catch (error) {
    console.error('Error creating task:', error);
    return { success: false, message: 'Failed to create task.' };
  }
}

export async function updateTaskAction(
  taskId: string,
  data: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    dueDate?: string;
  }
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized. Please log in.' };
    }

    const validationResult = updateTaskSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        message: 'Validation failed.',
        errors: validationResult.error.flatten().fieldErrors,
      };
    }

    const existing = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, session.user.id)))
      .limit(1);

    if (existing.length === 0) {
      return { success: false, message: 'Task not found or access denied.' };
    }

    const validated = validationResult.data;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.description !== undefined) updateData.description = validated.description || null;
    if (validated.status !== undefined) {
      updateData.status = validated.status;
      updateData.completedAt = validated.status === 'done' ? new Date() : null;
    }
    if (validated.priority !== undefined) updateData.priority = validated.priority;
    if (validated.dueDate !== undefined) {
      updateData.dueDate = validated.dueDate ? new Date(validated.dueDate) : null;
    }

    await db.update(tasks).set(updateData).where(eq(tasks.id, taskId));

    revalidatePath('/dashboard/tasks');

    return { success: true, message: 'Task updated successfully!', data: { id: taskId } };
  } catch (error) {
    console.error('Error updating task:', error);
    return { success: false, message: 'Failed to update task.' };
  }
}

export async function deleteTaskAction(taskId: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized. Please log in.' };
    }

    const existing = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, session.user.id)))
      .limit(1);

    if (existing.length === 0) {
      return { success: false, message: 'Task not found or access denied.' };
    }

    await db.delete(tasks).where(eq(tasks.id, taskId));

    revalidatePath('/dashboard/tasks');

    return { success: true, message: 'Task deleted successfully!' };
  } catch (error) {
    console.error('Error deleting task:', error);
    return { success: false, message: 'Failed to delete task.' };
  }
}

export async function toggleTaskDoneAction(taskId: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized. Please log in.' };
    }

    const [existing] = await db
      .select({ id: tasks.id, status: tasks.status })
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, session.user.id)));

    if (!existing) {
      return { success: false, message: 'Task not found or access denied.' };
    }

    const newStatus = existing.status === 'done' ? 'todo' : 'done';

    await db
      .update(tasks)
      .set({
        status: newStatus,
        completedAt: newStatus === 'done' ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, taskId));

    revalidatePath('/dashboard/tasks');

    return {
      success: true,
      message: newStatus === 'done' ? 'Task completed!' : 'Task reopened.',
    };
  } catch (error) {
    console.error('Error toggling task:', error);
    return { success: false, message: 'Failed to update task.' };
  }
}
