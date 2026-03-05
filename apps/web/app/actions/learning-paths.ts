'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import {
  learningPaths,
  learningPathItems,
  learningPathProgress,
  content,
} from '@/lib/db/schema';
import { eq, and, sql, ilike, notInArray, max } from 'drizzle-orm';
import { checkServerActionRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import {
  createLearningPathSchema,
  updateLearningPathSchema,
  addLearningPathItemSchema,
  reorderLearningPathItemsSchema,
  toggleLearningPathProgressSchema,
} from '@/lib/validations';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { checkBadgesForUser } from '@/lib/badges/engine';
import { getRecommendations } from '@/lib/ai/embeddings';

type ActionResult = {
  success: boolean;
  message: string;
};

export type LearningPathSummary = {
  id: string;
  title: string;
  description: string | null;
  estimatedMinutes: number | null;
  difficulty: string | null;
  isPublic: boolean;
  createdAt: Date;
  itemCount: number;
  completedCount: number;
};

export type LearningPathDetail = {
  id: string;
  title: string;
  description: string | null;
  estimatedMinutes: number | null;
  difficulty: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  items: LearningPathDetailItem[];
};

export type LearningPathDetailItem = {
  id: string;
  contentId: string;
  position: number;
  isOptional: boolean;
  contentTitle: string;
  contentType: string;
  contentBody: string | null;
  isCompleted: boolean;
};

export type SuggestedItem = {
  id: string;
  title: string;
  type: string;
};

/**
 * Create a new learning path.
 */
export async function createLearningPathAction(
  params: z.infer<typeof createLearningPathSchema>
): Promise<ActionResult & { pathId?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const rateCheck = checkServerActionRateLimit(
      session.user.id,
      'createLearningPath',
      RATE_LIMITS.serverAction
    );
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    const validated = createLearningPathSchema.parse(params);

    const [path] = await db
      .insert(learningPaths)
      .values({
        userId: session.user.id,
        title: validated.title,
        description: validated.description ?? null,
        estimatedMinutes: validated.estimatedMinutes ?? null,
        difficulty: validated.difficulty ?? null,
      })
      .returning({ id: learningPaths.id });

    revalidatePath('/dashboard/learning-paths');
    await checkBadgesForUser(session.user.id, 'path_created');

    return { success: true, message: 'Learning path created', pathId: path.id };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.error('createLearningPathAction error:', error);
    return { success: false, message: 'Failed to create learning path' };
  }
}

/**
 * Update a learning path.
 */
export async function updateLearningPathAction(
  pathId: string,
  params: z.infer<typeof updateLearningPathSchema>
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const rateCheck = checkServerActionRateLimit(
      session.user.id,
      'updateLearningPath',
      RATE_LIMITS.serverAction
    );
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    const validated = updateLearningPathSchema.parse(params);

    // Verify ownership
    const [existing] = await db
      .select({ id: learningPaths.id })
      .from(learningPaths)
      .where(and(eq(learningPaths.id, pathId), eq(learningPaths.userId, session.user.id)));

    if (!existing) {
      return { success: false, message: 'Learning path not found' };
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (validated.title !== undefined) updates.title = validated.title;
    if (validated.description !== undefined) updates.description = validated.description;
    if (validated.estimatedMinutes !== undefined) updates.estimatedMinutes = validated.estimatedMinutes;
    if (validated.difficulty !== undefined) updates.difficulty = validated.difficulty;
    if (validated.isPublic !== undefined) updates.isPublic = validated.isPublic;

    await db.update(learningPaths).set(updates).where(eq(learningPaths.id, pathId));

    revalidatePath('/dashboard/learning-paths');
    revalidatePath(`/dashboard/learning-paths/${pathId}`);

    return { success: true, message: 'Learning path updated' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.error('updateLearningPathAction error:', error);
    return { success: false, message: 'Failed to update learning path' };
  }
}

/**
 * Delete a learning path.
 */
export async function deleteLearningPathAction(pathId: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const rateCheck = checkServerActionRateLimit(
      session.user.id,
      'deleteLearningPath',
      RATE_LIMITS.serverAction
    );
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    const result = await db
      .delete(learningPaths)
      .where(and(eq(learningPaths.id, pathId), eq(learningPaths.userId, session.user.id)))
      .returning({ id: learningPaths.id });

    if (result.length === 0) {
      return { success: false, message: 'Learning path not found' };
    }

    revalidatePath('/dashboard/learning-paths');

    return { success: true, message: 'Learning path deleted' };
  } catch (error) {
    console.error('deleteLearningPathAction error:', error);
    return { success: false, message: 'Failed to delete learning path' };
  }
}

/**
 * Get all learning paths for the current user.
 */
export async function getLearningPathsAction(): Promise<
  ActionResult & { data?: LearningPathSummary[] }
> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const rateCheck = checkServerActionRateLimit(
      session.user.id,
      'getLearningPaths',
      RATE_LIMITS.serverAction
    );
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    const userId = session.user.id;

    const paths = await db
      .select({
        id: learningPaths.id,
        title: learningPaths.title,
        description: learningPaths.description,
        estimatedMinutes: learningPaths.estimatedMinutes,
        difficulty: learningPaths.difficulty,
        isPublic: learningPaths.isPublic,
        createdAt: learningPaths.createdAt,
      })
      .from(learningPaths)
      .where(eq(learningPaths.userId, userId))
      .orderBy(sql`${learningPaths.createdAt} DESC`);

    // Get item counts and completion counts per path
    const summaries: LearningPathSummary[] = await Promise.all(
      paths.map(async (path) => {
        const [itemCountResult] = await db
          .select({ value: sql<number>`count(*)::int` })
          .from(learningPathItems)
          .where(eq(learningPathItems.pathId, path.id));

        const [completedCountResult] = await db
          .select({ value: sql<number>`count(*)::int` })
          .from(learningPathProgress)
          .where(
            and(
              eq(learningPathProgress.pathId, path.id),
              eq(learningPathProgress.userId, userId)
            )
          );

        return {
          ...path,
          itemCount: itemCountResult?.value ?? 0,
          completedCount: completedCountResult?.value ?? 0,
        };
      })
    );

    return { success: true, message: 'Success', data: summaries };
  } catch (error) {
    console.error('getLearningPathsAction error:', error);
    return { success: false, message: 'Failed to get learning paths' };
  }
}

/**
 * Get learning path detail with items and progress.
 */
export async function getLearningPathDetailAction(
  pathId: string
): Promise<ActionResult & { data?: LearningPathDetail }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const rateCheck = checkServerActionRateLimit(
      session.user.id,
      'getLearningPathDetail',
      RATE_LIMITS.serverAction
    );
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    const [path] = await db
      .select()
      .from(learningPaths)
      .where(and(eq(learningPaths.id, pathId), eq(learningPaths.userId, session.user.id)));

    if (!path) {
      return { success: false, message: 'Learning path not found' };
    }

    // Get items with content details
    const items = await db
      .select({
        id: learningPathItems.id,
        contentId: learningPathItems.contentId,
        position: learningPathItems.position,
        isOptional: learningPathItems.isOptional,
        contentTitle: content.title,
        contentType: content.type,
        contentBody: content.body,
      })
      .from(learningPathItems)
      .innerJoin(content, eq(learningPathItems.contentId, content.id))
      .where(eq(learningPathItems.pathId, pathId))
      .orderBy(learningPathItems.position);

    // Get completed items for this user
    const completed = await db
      .select({ contentId: learningPathProgress.contentId })
      .from(learningPathProgress)
      .where(
        and(
          eq(learningPathProgress.pathId, pathId),
          eq(learningPathProgress.userId, session.user.id)
        )
      );
    const completedSet = new Set(completed.map((c) => c.contentId));

    const detailItems: LearningPathDetailItem[] = items.map((item) => ({
      id: item.id,
      contentId: item.contentId,
      position: item.position,
      isOptional: item.isOptional,
      contentTitle: item.contentTitle,
      contentType: item.contentType,
      contentBody: item.contentBody,
      isCompleted: completedSet.has(item.contentId),
    }));

    return {
      success: true,
      message: 'Success',
      data: {
        id: path.id,
        title: path.title,
        description: path.description,
        estimatedMinutes: path.estimatedMinutes,
        difficulty: path.difficulty,
        isPublic: path.isPublic,
        createdAt: path.createdAt,
        updatedAt: path.updatedAt,
        items: detailItems,
      },
    };
  } catch (error) {
    console.error('getLearningPathDetailAction error:', error);
    return { success: false, message: 'Failed to get learning path details' };
  }
}

/**
 * Add a content item to a learning path.
 */
export async function addItemToPathAction(
  params: z.infer<typeof addLearningPathItemSchema>
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const rateCheck = checkServerActionRateLimit(
      session.user.id,
      'addItemToPath',
      RATE_LIMITS.serverAction
    );
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    const validated = addLearningPathItemSchema.parse(params);

    // Verify path ownership
    const [path] = await db
      .select({ id: learningPaths.id })
      .from(learningPaths)
      .where(
        and(eq(learningPaths.id, validated.pathId), eq(learningPaths.userId, session.user.id))
      );

    if (!path) {
      return { success: false, message: 'Learning path not found' };
    }

    // Verify content ownership
    const [contentItem] = await db
      .select({ id: content.id })
      .from(content)
      .where(and(eq(content.id, validated.contentId), eq(content.userId, session.user.id)));

    if (!contentItem) {
      return { success: false, message: 'Content not found' };
    }

    // Get next position
    const [maxPos] = await db
      .select({ value: max(learningPathItems.position) })
      .from(learningPathItems)
      .where(eq(learningPathItems.pathId, validated.pathId));

    const nextPosition = (maxPos?.value ?? -1) + 1;

    await db.insert(learningPathItems).values({
      pathId: validated.pathId,
      contentId: validated.contentId,
      position: nextPosition,
      isOptional: validated.isOptional,
    });

    revalidatePath(`/dashboard/learning-paths/${validated.pathId}`);

    return { success: true, message: 'Item added to path' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.error('addItemToPathAction error:', error);
    return { success: false, message: 'Failed to add item to path' };
  }
}

/**
 * Remove an item from a learning path and re-compact positions.
 */
export async function removeItemFromPathAction(
  itemId: string,
  pathId: string
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const rateCheck = checkServerActionRateLimit(
      session.user.id,
      'removeItemFromPath',
      RATE_LIMITS.serverAction
    );
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    // Verify path ownership
    const [path] = await db
      .select({ id: learningPaths.id })
      .from(learningPaths)
      .where(and(eq(learningPaths.id, pathId), eq(learningPaths.userId, session.user.id)));

    if (!path) {
      return { success: false, message: 'Learning path not found' };
    }

    // Delete the item
    const result = await db
      .delete(learningPathItems)
      .where(and(eq(learningPathItems.id, itemId), eq(learningPathItems.pathId, pathId)))
      .returning({ id: learningPathItems.id });

    if (result.length === 0) {
      return { success: false, message: 'Item not found' };
    }

    // Re-compact positions
    const remaining = await db
      .select({ id: learningPathItems.id })
      .from(learningPathItems)
      .where(eq(learningPathItems.pathId, pathId))
      .orderBy(learningPathItems.position);

    for (let i = 0; i < remaining.length; i++) {
      await db
        .update(learningPathItems)
        .set({ position: i })
        .where(eq(learningPathItems.id, remaining[i].id));
    }

    revalidatePath(`/dashboard/learning-paths/${pathId}`);

    return { success: true, message: 'Item removed from path' };
  } catch (error) {
    console.error('removeItemFromPathAction error:', error);
    return { success: false, message: 'Failed to remove item from path' };
  }
}

/**
 * Reorder items in a learning path.
 */
export async function reorderPathItemsAction(
  params: z.infer<typeof reorderLearningPathItemsSchema>
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const rateCheck = checkServerActionRateLimit(
      session.user.id,
      'reorderPathItems',
      RATE_LIMITS.serverAction
    );
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    const validated = reorderLearningPathItemsSchema.parse(params);

    // Verify path ownership
    const [path] = await db
      .select({ id: learningPaths.id })
      .from(learningPaths)
      .where(
        and(eq(learningPaths.id, validated.pathId), eq(learningPaths.userId, session.user.id))
      );

    if (!path) {
      return { success: false, message: 'Learning path not found' };
    }

    // Update positions based on new order
    for (let i = 0; i < validated.itemIds.length; i++) {
      await db
        .update(learningPathItems)
        .set({ position: i })
        .where(
          and(
            eq(learningPathItems.id, validated.itemIds[i]),
            eq(learningPathItems.pathId, validated.pathId)
          )
        );
    }

    revalidatePath(`/dashboard/learning-paths/${validated.pathId}`);

    return { success: true, message: 'Items reordered' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.error('reorderPathItemsAction error:', error);
    return { success: false, message: 'Failed to reorder items' };
  }
}

/**
 * Toggle item completion status in a learning path.
 */
export async function toggleItemProgressAction(
  params: z.infer<typeof toggleLearningPathProgressSchema>
): Promise<ActionResult & { completed?: boolean }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const rateCheck = checkServerActionRateLimit(
      session.user.id,
      'toggleItemProgress',
      RATE_LIMITS.serverAction
    );
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    const validated = toggleLearningPathProgressSchema.parse(params);

    // Verify path ownership
    const [path] = await db
      .select({ id: learningPaths.id })
      .from(learningPaths)
      .where(
        and(eq(learningPaths.id, validated.pathId), eq(learningPaths.userId, session.user.id))
      );

    if (!path) {
      return { success: false, message: 'Learning path not found' };
    }

    // Check if already completed
    const [existing] = await db
      .select({ pathId: learningPathProgress.pathId })
      .from(learningPathProgress)
      .where(
        and(
          eq(learningPathProgress.pathId, validated.pathId),
          eq(learningPathProgress.userId, session.user.id),
          eq(learningPathProgress.contentId, validated.contentId)
        )
      );

    let completed: boolean;

    if (existing) {
      // Remove progress (uncomplete)
      await db
        .delete(learningPathProgress)
        .where(
          and(
            eq(learningPathProgress.pathId, validated.pathId),
            eq(learningPathProgress.userId, session.user.id),
            eq(learningPathProgress.contentId, validated.contentId)
          )
        );
      completed = false;
    } else {
      // Add progress (complete)
      await db.insert(learningPathProgress).values({
        pathId: validated.pathId,
        userId: session.user.id,
        contentId: validated.contentId,
      });
      completed = true;

      // Check if all required items are now complete → trigger badge
      const [requiredCount] = await db
        .select({ value: sql<number>`count(*)::int` })
        .from(learningPathItems)
        .where(
          and(
            eq(learningPathItems.pathId, validated.pathId),
            eq(learningPathItems.isOptional, false)
          )
        );

      const [completedCount] = await db
        .select({ value: sql<number>`count(*)::int` })
        .from(learningPathProgress)
        .innerJoin(
          learningPathItems,
          and(
            eq(learningPathProgress.pathId, learningPathItems.pathId),
            eq(learningPathProgress.contentId, learningPathItems.contentId)
          )
        )
        .where(
          and(
            eq(learningPathProgress.pathId, validated.pathId),
            eq(learningPathProgress.userId, session.user.id),
            eq(learningPathItems.isOptional, false)
          )
        );

      if (
        requiredCount.value > 0 &&
        completedCount.value >= requiredCount.value
      ) {
        await checkBadgesForUser(session.user.id, 'path_completed');
      }
    }

    revalidatePath(`/dashboard/learning-paths/${validated.pathId}`);

    return {
      success: true,
      message: completed ? 'Item completed' : 'Item uncompleted',
      completed,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.error('toggleItemProgressAction error:', error);
    return { success: false, message: 'Failed to toggle progress' };
  }
}

/**
 * Suggest content items to add to a learning path using AI recommendations.
 */
export async function suggestPathItemsAction(
  pathId: string
): Promise<ActionResult & { data?: SuggestedItem[] }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const rateCheck = checkServerActionRateLimit(
      session.user.id,
      'suggestPathItems',
      RATE_LIMITS.serverActionAI
    );
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    // Verify path ownership
    const [path] = await db
      .select({ id: learningPaths.id })
      .from(learningPaths)
      .where(and(eq(learningPaths.id, pathId), eq(learningPaths.userId, session.user.id)));

    if (!path) {
      return { success: false, message: 'Learning path not found' };
    }

    // Get existing items
    const existingItems = await db
      .select({ contentId: learningPathItems.contentId })
      .from(learningPathItems)
      .where(eq(learningPathItems.pathId, pathId));

    const existingIds = new Set(existingItems.map((i) => i.contentId));

    // Use up to 3 existing items as seeds for recommendations
    const seedIds = existingItems.slice(0, 3).map((i) => i.contentId);

    if (seedIds.length === 0) {
      return { success: true, message: 'Add some items first to get suggestions', data: [] };
    }

    // Collect recommendations from each seed, dedupe
    const allRecs = new Map<string, { id: string; title: string; type: string }>();

    for (const seedId of seedIds) {
      const recs = await getRecommendations(seedId, session.user.id, 5, 0.3);
      for (const rec of recs) {
        if (!existingIds.has(rec.id) && !allRecs.has(rec.id)) {
          allRecs.set(rec.id, { id: rec.id, title: rec.title, type: rec.type });
        }
      }
    }

    const suggestions = Array.from(allRecs.values()).slice(0, 5);

    return { success: true, message: 'Success', data: suggestions };
  } catch (error) {
    console.error('suggestPathItemsAction error:', error);
    return { success: false, message: 'Failed to get suggestions' };
  }
}

/**
 * Search user's content for adding to a path (excludes already-added items).
 */
export async function getPathContentPickerAction(
  pathId: string,
  query: string
): Promise<ActionResult & { data?: SuggestedItem[] }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const rateCheck = checkServerActionRateLimit(
      session.user.id,
      'getPathContentPicker',
      RATE_LIMITS.serverAction
    );
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    // Get existing item content IDs
    const existingItems = await db
      .select({ contentId: learningPathItems.contentId })
      .from(learningPathItems)
      .where(eq(learningPathItems.pathId, pathId));

    const existingIds = existingItems.map((i) => i.contentId);

    let results;
    if (existingIds.length > 0) {
      results = await db
        .select({ id: content.id, title: content.title, type: content.type })
        .from(content)
        .where(
          and(
            eq(content.userId, session.user.id),
            ilike(content.title, `%${query}%`),
            notInArray(content.id, existingIds)
          )
        )
        .limit(20);
    } else {
      results = await db
        .select({ id: content.id, title: content.title, type: content.type })
        .from(content)
        .where(and(eq(content.userId, session.user.id), ilike(content.title, `%${query}%`)))
        .limit(20);
    }

    return { success: true, message: 'Success', data: results };
  } catch (error) {
    console.error('getPathContentPickerAction error:', error);
    return { success: false, message: 'Failed to search content' };
  }
}
