'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { collections, contentCollections, content } from '@/lib/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { checkServerActionRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

// Validation schemas
const createCollectionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
});

const updateCollectionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional().nullable(),
});

// Types
type ActionResult = {
  success: boolean;
  message: string;
};

type CollectionResult = ActionResult & {
  collection?: {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
};

type CollectionWithCount = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
  contentCount: number;
};

type GetCollectionsResult = {
  success: boolean;
  collections: CollectionWithCount[];
  message?: string;
};

// Create a new collection
export async function createCollectionAction(
  params: z.infer<typeof createCollectionSchema>
): Promise<CollectionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const validatedData = createCollectionSchema.parse(params);

    const [newCollection] = await db
      .insert(collections)
      .values({
        userId: session.user.id,
        name: validatedData.name,
        description: validatedData.description || null,
        color: validatedData.color || null,
      })
      .returning();

    revalidatePath('/dashboard/library');
    revalidatePath('/dashboard/collections');

    return {
      success: true,
      message: 'Collection created successfully',
      collection: newCollection,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.error('Create collection error:', error);
    return { success: false, message: 'Failed to create collection' };
  }
}

// Get all collections for the current user
export async function getCollectionsAction(): Promise<GetCollectionsResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, collections: [], message: 'Unauthorized' };
    }

    // Single query with LEFT JOIN and COUNT to avoid N+1 query problem
    const collectionsWithCounts = await db
      .select({
        id: collections.id,
        name: collections.name,
        description: collections.description,
        color: collections.color,
        createdAt: collections.createdAt,
        updatedAt: collections.updatedAt,
        contentCount: sql<number>`cast(count(${contentCollections.contentId}) as int)`,
      })
      .from(collections)
      .leftJoin(
        contentCollections,
        eq(collections.id, contentCollections.collectionId)
      )
      .where(eq(collections.userId, session.user.id))
      .groupBy(collections.id)
      .orderBy(collections.name);

    return {
      success: true,
      collections: collectionsWithCounts,
    };
  } catch (error) {
    console.error('Get collections error:', error);
    return { success: false, collections: [], message: 'Failed to fetch collections' };
  }
}

// Update a collection
export async function updateCollectionAction(
  collectionId: string,
  params: z.infer<typeof updateCollectionSchema>
): Promise<CollectionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    // Verify ownership
    const [existing] = await db
      .select()
      .from(collections)
      .where(
        and(eq(collections.id, collectionId), eq(collections.userId, session.user.id))
      );

    if (!existing) {
      return { success: false, message: 'Collection not found' };
    }

    const validatedData = updateCollectionSchema.parse(params);

    const [updated] = await db
      .update(collections)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(collections.id, collectionId))
      .returning();

    revalidatePath('/dashboard/library');
    revalidatePath('/dashboard/collections');

    return {
      success: true,
      message: 'Collection updated successfully',
      collection: updated,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.error('Update collection error:', error);
    return { success: false, message: 'Failed to update collection' };
  }
}

// Delete a collection
export async function deleteCollectionAction(collectionId: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    // Verify ownership
    const [existing] = await db
      .select()
      .from(collections)
      .where(
        and(eq(collections.id, collectionId), eq(collections.userId, session.user.id))
      );

    if (!existing) {
      return { success: false, message: 'Collection not found' };
    }

    // Delete the collection (content_collections entries cascade automatically)
    await db.delete(collections).where(eq(collections.id, collectionId));

    revalidatePath('/dashboard/library');
    revalidatePath('/dashboard/collections');

    return { success: true, message: 'Collection deleted successfully' };
  } catch (error) {
    console.error('Delete collection error:', error);
    return { success: false, message: 'Failed to delete collection' };
  }
}

// Add content to a collection
export async function addToCollectionAction(
  contentId: string,
  collectionId: string
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    // Verify collection ownership
    const [collection] = await db
      .select()
      .from(collections)
      .where(
        and(eq(collections.id, collectionId), eq(collections.userId, session.user.id))
      );

    if (!collection) {
      return { success: false, message: 'Collection not found' };
    }

    // Check if already in collection
    const [existing] = await db
      .select()
      .from(contentCollections)
      .where(
        and(
          eq(contentCollections.contentId, contentId),
          eq(contentCollections.collectionId, collectionId)
        )
      );

    if (existing) {
      return { success: false, message: 'Content already in collection' };
    }

    await db.insert(contentCollections).values({
      contentId,
      collectionId,
    });

    revalidatePath('/dashboard/library');
    revalidatePath('/dashboard/collections');

    return { success: true, message: 'Added to collection' };
  } catch (error) {
    console.error('Add to collection error:', error);
    return { success: false, message: 'Failed to add to collection' };
  }
}

// Remove content from a collection
export async function removeFromCollectionAction(
  contentId: string,
  collectionId: string
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    // Verify collection ownership
    const [collection] = await db
      .select()
      .from(collections)
      .where(
        and(eq(collections.id, collectionId), eq(collections.userId, session.user.id))
      );

    if (!collection) {
      return { success: false, message: 'Collection not found' };
    }

    await db
      .delete(contentCollections)
      .where(
        and(
          eq(contentCollections.contentId, contentId),
          eq(contentCollections.collectionId, collectionId)
        )
      );

    revalidatePath('/dashboard/library');
    revalidatePath('/dashboard/collections');

    return { success: true, message: 'Removed from collection' };
  } catch (error) {
    console.error('Remove from collection error:', error);
    return { success: false, message: 'Failed to remove from collection' };
  }
}

// Bulk add content to a collection
export async function bulkAddToCollectionAction(
  contentIds: string[],
  collectionId: string
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const rateCheck = checkServerActionRateLimit(session.user.id, 'bulkAddToCollection', RATE_LIMITS.serverActionBulk);
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    // Verify collection ownership
    const [collection] = await db
      .select()
      .from(collections)
      .where(
        and(eq(collections.id, collectionId), eq(collections.userId, session.user.id))
      );

    if (!collection) {
      return { success: false, message: 'Collection not found' };
    }

    // Get existing entries to avoid duplicates
    const existing = await db
      .select({ contentId: contentCollections.contentId })
      .from(contentCollections)
      .where(
        and(
          inArray(contentCollections.contentId, contentIds),
          eq(contentCollections.collectionId, collectionId)
        )
      );

    const existingIds = new Set(existing.map((e) => e.contentId));
    const newContentIds = contentIds.filter((id) => !existingIds.has(id));

    if (newContentIds.length === 0) {
      return { success: true, message: 'All items already in collection' };
    }

    await db.insert(contentCollections).values(
      newContentIds.map((contentId) => ({
        contentId,
        collectionId,
      }))
    );

    revalidatePath('/dashboard/library');
    revalidatePath('/dashboard/collections');

    return {
      success: true,
      message: `Added ${newContentIds.length} item${newContentIds.length !== 1 ? 's' : ''} to collection`,
    };
  } catch (error) {
    console.error('Bulk add to collection error:', error);
    return { success: false, message: 'Failed to add to collection' };
  }
}

// Get collections for a specific content item
export async function getContentCollectionsAction(
  contentId: string
): Promise<{ success: boolean; collectionIds: string[]; message?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, collectionIds: [], message: 'Unauthorized' };
    }

    // SECURITY: Join to content table to verify the content belongs to the authenticated user
    const result = await db
      .select({ collectionId: contentCollections.collectionId })
      .from(contentCollections)
      .innerJoin(content, eq(contentCollections.contentId, content.id))
      .where(
        and(
          eq(contentCollections.contentId, contentId),
          eq(content.userId, session.user.id)
        )
      );

    return {
      success: true,
      collectionIds: result.map((r) => r.collectionId),
    };
  } catch (error) {
    console.error('Get content collections error:', error);
    return { success: false, collectionIds: [], message: 'Failed to fetch collections' };
  }
}
