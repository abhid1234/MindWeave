import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { tasks } from '@/lib/db/schema';
import { eq, and, desc, asc, count } from 'drizzle-orm';
import { createTaskSchema, taskQuerySchema } from '@/lib/validations';
import {
  checkRateLimit,
  rateLimitExceededResponse,
  RATE_LIMITS,
} from '@/lib/rate-limit';

/**
 * GET /api/tasks
 * List tasks with filtering, sorting, and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = checkRateLimit(request, 'tasks', RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);

    // Parse query params
    const queryResult = taskQuerySchema.safeParse({
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      sort: searchParams.get('sort') || undefined,
      order: searchParams.get('order') || undefined,
      page: searchParams.get('page') || undefined,
      perPage: searchParams.get('perPage') || undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.flatten() },
        { status: 400 }
      );
    }

    const { status, priority, sort, order, page, perPage } = queryResult.data;

    // Build where conditions
    const conditions = [eq(tasks.userId, userId)];
    if (status) conditions.push(eq(tasks.status, status));
    if (priority) conditions.push(eq(tasks.priority, priority));

    const whereClause = and(...conditions);

    // Build order by
    const orderFn = order === 'asc' ? asc : desc;
    const sortColumn = {
      createdAt: tasks.createdAt,
      dueDate: tasks.dueDate,
      priority: tasks.priority,
      title: tasks.title,
    }[sort];

    // Get total count
    const [{ total }] = await db
      .select({ total: count() })
      .from(tasks)
      .where(whereClause);

    // Get paginated results
    const offset = (page - 1) * perPage;
    const userTasks = await db
      .select()
      .from(tasks)
      .where(whereClause)
      .orderBy(orderFn(sortColumn))
      .limit(perPage)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: userTasks,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    console.error('Error listing tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/tasks
 * Create a new task
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = checkRateLimit(request, 'tasks', RATE_LIMITS.api);
    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult);
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = createTaskSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { title, description, status, priority, dueDate } = result.data;
    const userId = session.user.id;

    const [newTask] = await db
      .insert(tasks)
      .values({
        userId,
        title,
        description: description || null,
        status,
        priority,
        dueDate: dueDate || null,
        completedAt: status === 'done' ? new Date() : null,
      })
      .returning();

    return NextResponse.json(
      { success: true, data: newTask },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
