'use server';

import { db } from '@/lib/db/client';
import { feedback, type FeedbackType } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { desc, eq, and, count } from 'drizzle-orm';
import { logger } from '@/lib/logger';

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
}

function isAdmin(email: string | null | undefined): boolean {
  return !!email && getAdminEmails().includes(email);
}

const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'improvement', 'other']),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
  email: z.string().email().optional().or(z.literal('')),
  page: z.string().optional(),
});

export type SubmitFeedbackInput = z.infer<typeof feedbackSchema>;

export interface FeedbackResult {
  success: boolean;
  error?: string;
  feedbackId?: string;
}

/**
 * Submit user feedback
 */
export async function submitFeedbackAction(
  input: SubmitFeedbackInput,
  userAgent?: string
): Promise<FeedbackResult> {
  try {
    const validated = feedbackSchema.parse(input);

    // Get current user if logged in
    const session = await auth();
    const userId = session?.user?.id;

    const [inserted] = await db
      .insert(feedback)
      .values({
        userId: userId || null,
        type: validated.type as FeedbackType,
        message: validated.message,
        email: validated.email || null,
        page: validated.page || null,
        userAgent: userAgent || null,
        status: 'new',
      })
      .returning({ id: feedback.id });

    logger.info('Feedback submitted', {
      feedbackId: inserted.id,
      type: validated.type,
      userId: userId || 'anonymous',
      page: validated.page,
    });

    return { success: true, feedbackId: inserted.id };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }

    logger.error('Failed to submit feedback', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return { success: false, error: 'Failed to submit feedback. Please try again.' };
  }
}

/**
 * Get feedback list (admin only - checks for admin in future)
 */
export async function getFeedbackAction(options?: {
  status?: string;
  type?: string;
  limit?: number;
  offset?: number;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized', items: [] };
  }

  // In future, check for admin role
  // For now, allow authenticated users to see their own feedback
  const conditions = [eq(feedback.userId, session.user.id)];

  if (options?.status) {
    conditions.push(eq(feedback.status, options.status));
  }

  if (options?.type) {
    conditions.push(eq(feedback.type, options.type as FeedbackType));
  }

  try {
    const items = await db
      .select()
      .from(feedback)
      .where(and(...conditions))
      .orderBy(desc(feedback.createdAt))
      .limit(options?.limit || 50)
      .offset(options?.offset || 0);

    const [{ total }] = await db
      .select({ total: count() })
      .from(feedback)
      .where(and(...conditions));

    return { success: true, items, total };
  } catch (error) {
    logger.error('Failed to get feedback', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return { success: false, error: 'Failed to load feedback', items: [] };
  }
}

/**
 * Get all feedback (admin only)
 */
export async function getAdminFeedbackAction(options?: {
  status?: string;
  type?: string;
  limit?: number;
  offset?: number;
}) {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.email)) {
    return { success: false, error: 'Unauthorized', items: [], total: 0 };
  }

  const conditions: ReturnType<typeof eq>[] = [];

  if (options?.status) {
    conditions.push(eq(feedback.status, options.status));
  }

  if (options?.type) {
    conditions.push(eq(feedback.type, options.type as FeedbackType));
  }

  try {
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const items = await db
      .select()
      .from(feedback)
      .where(whereClause)
      .orderBy(desc(feedback.createdAt))
      .limit(options?.limit || 50)
      .offset(options?.offset || 0);

    const [{ total }] = await db
      .select({ total: count() })
      .from(feedback)
      .where(whereClause);

    return { success: true, items, total };
  } catch (error) {
    logger.error('Failed to get admin feedback', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return { success: false, error: 'Failed to load feedback', items: [], total: 0 };
  }
}

/**
 * Update feedback status (admin only)
 */
export async function updateFeedbackStatusAction(
  feedbackId: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.email)) {
    return { success: false, error: 'Unauthorized' };
  }

  const validStatuses = ['new', 'reviewed', 'in_progress', 'resolved', 'dismissed'];
  if (!validStatuses.includes(status)) {
    return { success: false, error: 'Invalid status' };
  }

  try {
    await db
      .update(feedback)
      .set({ status })
      .where(eq(feedback.id, feedbackId));

    return { success: true };
  } catch (error) {
    logger.error('Failed to update feedback status', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return { success: false, error: 'Failed to update status' };
  }
}
