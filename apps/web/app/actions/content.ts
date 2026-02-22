'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { content, contentCollections, type ContentType } from '@/lib/db/schema';
import { createContentSchema, updateContentSchema } from '@/lib/validations';
import { generateTags, extractTextFromImage } from '@/lib/ai/claude';
import { generateSummary } from '@/lib/ai/summarization';
import { upsertContentEmbedding } from '@/lib/ai/embeddings';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { eq, desc, asc, and, or, sql, inArray, type SQL } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { CacheTags } from '@/lib/cache';
import { randomBytes } from 'crypto';
import { checkServerActionRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { isGCSConfigured, deleteFromGCS, extractGCSObjectPath, downloadFromGCS, getFileBuffer } from '@/lib/storage';
import path from 'path';

export type ActionResult = {
  success: boolean;
  message: string;
  data?: { id: string };
  errors?: Partial<Record<string, string[]>>;
};

export async function createContentAction(formData: FormData): Promise<ActionResult> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: 'Unauthorized. Please log in.',
      };
    }

    // Rate limit
    const rateCheck = checkServerActionRateLimit(session.user.id, 'createContent', RATE_LIMITS.serverAction);
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    // Parse and prepare data
    const tagsInput = formData.get('tags') as string | null;
    const metadataInput = formData.get('metadata') as string | null;
    let parsedMetadata: Record<string, string | number | boolean | null> | undefined;
    if (metadataInput) {
      try {
        parsedMetadata = JSON.parse(metadataInput);
      } catch {
        // Invalid metadata JSON, ignore
      }
    }
    const rawData = {
      type: formData.get('type'),
      title: formData.get('title'),
      body: formData.get('body') || '',
      url: formData.get('url') || '',
      tags: tagsInput
        ? tagsInput.split(',').map((tag) => tag.trim()).filter(Boolean)
        : [],
      ...(parsedMetadata ? { metadata: parsedMetadata } : {}),
    };

    // Validate with Zod
    const validationResult = createContentSchema.safeParse(rawData);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      return {
        success: false,
        message: 'Validation failed. Please check your input.',
        errors,
      };
    }

    const validatedData = validationResult.data;

    // AI Text Extraction for Images
    if (validatedData.type === 'file' && validatedData.metadata?.fileType && String(validatedData.metadata.fileType).startsWith('image/')) {
      try {
        const filePath = validatedData.metadata.filePath as string;
        const imageBuffer = await getFileBuffer(filePath, session.user.id);

        if (imageBuffer) {
          const extractedText = await extractTextFromImage(imageBuffer, validatedData.metadata.fileType as string);
          if (extractedText) {
            validatedData.body = validatedData.body
              ? `${validatedData.body}\n\n--- AI Extracted Content ---\n${extractedText}`
              : extractedText;
          }
        }
      } catch (error) {
        console.error('Error extracting text from image:', error);
      }
    }

    // Generate auto-tags and summary using Claude AI in parallel
    let autoTags: string[] = [];
    let summary: string | null = null;

    try {
      const aiInput = {
        title: validatedData.title,
        body: validatedData.body,
        url: validatedData.url,
        type: validatedData.type,
      };

      // Run both in parallel for better performance
      const [tagsResult, summaryResult] = await Promise.all([
        generateTags(aiInput).catch((error) => {
          console.error('Auto-tagging failed:', error);
          return [];
        }),
        generateSummary(aiInput).catch((error) => {
          console.error('Summarization failed:', error);
          return null;
        }),
      ]);

      autoTags = tagsResult;
      summary = summaryResult;
    } catch (error) {
      // Don't fail content creation if AI features fail
      console.error('AI processing failed:', error);
    }

    // Insert into database
    const [newContent] = await db
      .insert(content)
      .values({
        userId: session.user.id,
        type: validatedData.type,
        title: validatedData.title,
        body: validatedData.body || null,
        url: validatedData.url || null,
        tags: validatedData.tags,
        autoTags,
        summary,
        metadata: validatedData.metadata || {},
      })
      .returning({ id: content.id });

    // Generate embedding asynchronously (non-blocking)
    upsertContentEmbedding(newContent.id).catch((error) => {
      console.error('Failed to generate embedding for content:', newContent.id, error);
    });

    // Revalidate relevant pages and cache tags
    revalidatePath('/dashboard/library');
    revalidateTag(CacheTags.ANALYTICS);
    revalidateTag(CacheTags.CONTENT);

    return {
      success: true,
      message: 'Content saved successfully!',
      data: { id: newContent.id },
    };
  } catch (error) {
    console.error('Error creating content:', error);
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: 'Validation error',
        errors: error.flatten().fieldErrors,
      };
    }

    // Return more specific error message for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: `Failed to save content: ${errorMessage}`,
    };
  }
}

export type GetContentParams = {
  type?: ContentType;
  tag?: string;
  query?: string;
  sortBy?: 'createdAt' | 'title';
  sortOrder?: 'asc' | 'desc';
  collectionId?: string;
  favoritesOnly?: boolean;
  cursor?: string; // ISO date string for cursor-based pagination
  limit?: number; // Number of items to fetch
};

export type ContentItem = {
  id: string;
  type: ContentType;
  title: string;
  body: string | null;
  url: string | null;
  tags: string[];
  autoTags: string[];
  createdAt: Date;
  metadata: {
    fileType?: string;
    fileSize?: number;
    filePath?: string;
    fileName?: string;
    [key: string]: unknown;
  } | null;
  isShared: boolean;
  shareId: string | null;
  isFavorite: boolean;
  summary?: string | null;
};

export type GetContentResult = {
  success: boolean;
  items: ContentItem[];
  allTags: string[];
  nextCursor?: string | null; // ISO date string of last item for pagination
  hasMore?: boolean;
};

export type UpdateTagsParams = {
  contentId: string;
  tags: string[];
};

export async function updateContentTagsAction(
  params: UpdateTagsParams
): Promise<ActionResult> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: 'Unauthorized. Please log in.',
      };
    }

    // Rate limit
    const rateCheck = checkServerActionRateLimit(session.user.id, 'updateContentTags', RATE_LIMITS.serverAction);
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    const { contentId, tags } = params;

    // Validate inputs
    if (!contentId || typeof contentId !== 'string') {
      return {
        success: false,
        message: 'Invalid content ID.',
      };
    }

    if (!Array.isArray(tags)) {
      return {
        success: false,
        message: 'Tags must be an array.',
      };
    }

    // Validate and clean tags
    const cleanedTags = tags
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0 && tag.length <= 50)
      .slice(0, 20); // Max 20 tags

    // Verify content belongs to the user
    const existingContent = await db
      .select({ id: content.id })
      .from(content)
      .where(and(eq(content.id, contentId), eq(content.userId, session.user.id)))
      .limit(1);

    if (existingContent.length === 0) {
      return {
        success: false,
        message: 'Content not found or access denied.',
      };
    }

    // Update tags
    await db
      .update(content)
      .set({ tags: cleanedTags, updatedAt: new Date() })
      .where(eq(content.id, contentId));

    // Regenerate embedding with new tags (non-blocking)
    upsertContentEmbedding(contentId).catch((error) => {
      console.error('Failed to refresh embedding after tag update:', contentId, error);
    });

    // Revalidate relevant pages and cache tags
    revalidatePath('/dashboard/library');
    revalidateTag(CacheTags.ANALYTICS);
    
    return {
      success: true,
      message: 'Tags updated successfully!',
    };
  } catch (error) {
    console.error('Error updating tags:', error);
    return {
      success: false,
      message: 'Failed to update tags. Please try again.',
    };
  }
}

export type UpdateContentParams = {
  contentId: string;
  title?: string;
  body?: string;
  url?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export async function updateContentAction(params: UpdateContentParams): Promise<ActionResult> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: 'Unauthorized. Please log in.',
      };
    }

    // Rate limit
    const rateCheck = checkServerActionRateLimit(session.user.id, 'updateContent', RATE_LIMITS.serverAction);
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    const { contentId, ...updateFields } = params;

    // Validate content ID
    if (!contentId || typeof contentId !== 'string') {
      return {
        success: false,
        message: 'Invalid content ID.',
      };
    }

    // Validate update fields with Zod
    const validationResult = updateContentSchema.safeParse(updateFields);
    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      return {
        success: false,
        message: 'Validation failed. Please check your input.',
        errors,
      };
    }

    const validatedData = validationResult.data;

    // Verify content exists and belongs to the user
    const existingContent = await db
      .select({
        id: content.id,
        body: content.body,
        title: content.title,
        url: content.url,
        type: content.type,
        metadata: content.metadata,
      })
      .from(content)
      .where(and(eq(content.id, contentId), eq(content.userId, session.user.id)))
      .limit(1);

    if (existingContent.length === 0) {
      return {
        success: false,
        message: 'Content not found or access denied.',
      };
    }

    const currentContent = existingContent[0];

    // Build update object with only provided fields
    const updateData: Partial<{
      title: string;
      body: string | null;
      url: string | null;
      metadata: Record<string, unknown>;
      updatedAt: Date;
    }> = {
      updatedAt: new Date(),
    };

    if (validatedData.title !== undefined) {
      updateData.title = validatedData.title;
    }
    if (validatedData.body !== undefined) {
      updateData.body = validatedData.body || null;
    }
    if (validatedData.url !== undefined) {
      updateData.url = validatedData.url || null;
    }
    if (validatedData.metadata !== undefined) {
      // Merge new metadata with existing metadata
      const existingMeta = (currentContent as unknown as { metadata?: Record<string, unknown> }).metadata || {};
      updateData.metadata = { ...existingMeta, ...validatedData.metadata };
    }

    // Update the content
    await db.update(content).set(updateData).where(eq(content.id, contentId));

    // Check if body changed significantly to regenerate auto-tags and embeddings
    const bodyChanged =
      validatedData.body !== undefined && validatedData.body !== currentContent.body;

    if (bodyChanged) {
      // Regenerate auto-tags and summary asynchronously (non-blocking)
      (async () => {
        try {
          const aiInput = {
            title: validatedData.title || currentContent.title,
            body: validatedData.body,
            url: validatedData.url || currentContent.url || undefined,
            type: currentContent.type,
          };

          const [newAutoTags, newSummary] = await Promise.all([
            generateTags(aiInput).catch((err) => {
              console.error('Failed to regenerate auto-tags:', contentId, err);
              return null;
            }),
            generateSummary(aiInput).catch((err) => {
              console.error('Failed to regenerate summary:', contentId, err);
              return undefined; // Use undefined to distinguish from "no summary"
            }),
          ]);

          const updateData: { autoTags?: string[]; summary?: string | null } = {};
          if (newAutoTags !== null) {
            updateData.autoTags = newAutoTags;
          }
          if (newSummary !== undefined) {
            updateData.summary = newSummary;
          }

          if (Object.keys(updateData).length > 0) {
            await db.update(content).set(updateData).where(eq(content.id, contentId));
          }
        } catch (error) {
          console.error('Failed to regenerate AI content:', contentId, error);
        }
      })();

      // Regenerate embedding asynchronously (non-blocking)
      upsertContentEmbedding(contentId).catch((error) => {
        console.error('Failed to regenerate embedding:', contentId, error);
      });
    }

    // Revalidate relevant pages and cache tags
    revalidatePath('/dashboard/library');
    revalidateTag(CacheTags.ANALYTICS);
    
    return {
      success: true,
      message: 'Content updated successfully!',
      data: { id: contentId },
    };
  } catch (error) {
    console.error('Error updating content:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: 'Validation error',
        errors: error.flatten().fieldErrors,
      };
    }

    return {
      success: false,
      message: 'Failed to update content. Please try again.',
    };
  }
}

export async function deleteContentAction(contentId: string): Promise<ActionResult> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: 'Unauthorized. Please log in.',
      };
    }

    // Rate limit
    const rateCheck = checkServerActionRateLimit(session.user.id, 'deleteContent', RATE_LIMITS.serverAction);
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    // Validate content ID
    if (!contentId || typeof contentId !== 'string') {
      return {
        success: false,
        message: 'Invalid content ID.',
      };
    }

    // Verify content exists and belongs to the user (fetch metadata for GCS cleanup)
    const existingContent = await db
      .select({ id: content.id, metadata: content.metadata })
      .from(content)
      .where(and(eq(content.id, contentId), eq(content.userId, session.user.id)))
      .limit(1);

    if (existingContent.length === 0) {
      return {
        success: false,
        message: 'Content not found or access denied.',
      };
    }

    // Delete the content (embeddings cascade automatically via FK)
    await db.delete(content).where(eq(content.id, contentId));

    // Clean up GCS object if applicable (non-blocking)
    if (isGCSConfigured()) {
      const meta = existingContent[0].metadata as Record<string, unknown> | null;
      const filePath = meta?.filePath as string | undefined;
      if (filePath) {
        const objectPath = extractGCSObjectPath(filePath);
        if (objectPath) {
          deleteFromGCS(objectPath).catch((err) => {
            console.error('Failed to delete GCS object:', objectPath, err);
          });
        }
      }
    }

    // Revalidate relevant pages and cache tags
    revalidatePath('/dashboard/library');
    revalidateTag(CacheTags.ANALYTICS);
    revalidateTag(CacheTags.CONTENT);

    return {
      success: true,
      message: 'Content deleted successfully!',
    };
  } catch (error) {
    console.error('Error deleting content:', error);
    return {
      success: false,
      message: 'Failed to delete content. Please try again.',
    };
  }
}

export async function getContentAction(
  params: GetContentParams = {}
): Promise<GetContentResult> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        items: [],
        allTags: [],
      };
    }

    const {
      type: typeFilter,
      tag: tagFilter,
      query: searchQuery,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      collectionId,
      favoritesOnly,
      cursor,
      limit = 20, // Default page size
    } = params;

    const pageLimit = Math.min(Math.max(limit, 1), 100); // Clamp between 1 and 100

    // Build where conditions
    const conditions: SQL[] = [eq(content.userId, session.user.id)];

    if (typeFilter) {
      conditions.push(eq(content.type, typeFilter));
    }

    if (tagFilter) {
      // Check if tag exists in either tags or autoTags array
      conditions.push(
        or(
          sql`${content.tags} @> ARRAY[${tagFilter}]::text[]`,
          sql`${content.autoTags} @> ARRAY[${tagFilter}]::text[]`
        )!
      );
    }

    if (searchQuery && searchQuery.trim()) {
      // Search across title, body, tags, and autoTags using ILIKE (case-insensitive)
      const searchPattern = `%${searchQuery.trim()}%`;
      conditions.push(
        or(
          sql`${content.title} ILIKE ${searchPattern}`,
          sql`${content.body} ILIKE ${searchPattern}`,
          sql`EXISTS (
            SELECT 1 FROM unnest(${content.tags}) as tag
            WHERE tag ILIKE ${searchPattern}
          )`,
          sql`EXISTS (
            SELECT 1 FROM unnest(${content.autoTags}) as tag
            WHERE tag ILIKE ${searchPattern}
          )`
        )!
      );
    }

    // Filter favorites only if specified
    if (favoritesOnly) {
      conditions.push(eq(content.isFavorite, true));
    }

    // Cursor-based pagination (only for createdAt sorting)
    if (cursor && sortBy === 'createdAt') {
      const cursorDate = new Date(cursor);
      if (!isNaN(cursorDate.getTime())) {
        if (sortOrder === 'desc') {
          conditions.push(sql`${content.createdAt} < ${cursorDate}`);
        } else {
          conditions.push(sql`${content.createdAt} > ${cursorDate}`);
        }
      }
    }

    // Filter by collection if specified
    if (collectionId) {
      const collectionContentIds = await db
        .select({ contentId: contentCollections.contentId })
        .from(contentCollections)
        .where(eq(contentCollections.collectionId, collectionId));

      const contentIds = collectionContentIds.map((c) => c.contentId);
      if (contentIds.length > 0) {
        conditions.push(inArray(content.id, contentIds));
      } else {
        // No content in collection, return empty result
        return {
          success: true,
          items: [],
          allTags: [],
        };
      }
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    // Determine sort order
    const orderByClause =
      sortBy === 'title'
        ? sortOrder === 'asc'
          ? asc(content.title)
          : desc(content.title)
        : sortOrder === 'asc'
          ? asc(content.createdAt)
          : desc(content.createdAt);

    // Fetch content with filters and sorting (fetch one extra to check if there are more)
    const items = await db
      .select({
        id: content.id,
        type: content.type,
        title: content.title,
        body: content.body,
        url: content.url,
        tags: content.tags,
        autoTags: content.autoTags,
        createdAt: content.createdAt,
        metadata: content.metadata,
        isShared: content.isShared,
        shareId: content.shareId,
        isFavorite: content.isFavorite,
        summary: content.summary,
      })
      .from(content)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(pageLimit + 1); // Fetch one extra to check hasMore

    // Check if there are more items
    const hasMore = items.length > pageLimit;
    const paginatedItems = hasMore ? items.slice(0, pageLimit) : items;

    // Get next cursor from last item
    const lastItem = paginatedItems[paginatedItems.length - 1];
    const nextCursor = lastItem && hasMore ? lastItem.createdAt.toISOString() : null;

    // Fetch all unique tags for the user using efficient SQL UNNEST
    const tagsResult = await db.execute<{ tag: string }>(sql`
      SELECT DISTINCT unnest(tags || auto_tags) as tag
      FROM ${content}
      WHERE user_id = ${session.user.id}
      ORDER BY tag
    `);

    const allTags = (tagsResult as unknown as { tag: string }[])
      .map((row) => row.tag)
      .filter((tag) => tag !== null && tag !== '');

    return {
      success: true,
      items: paginatedItems,
      allTags,
      nextCursor,
      hasMore,
    };
  } catch (error) {
    console.error('Error fetching content:', error);
    return {
      success: false,
      items: [],
      allTags: [],
      nextCursor: null,
      hasMore: false,
    };
  }
}

// Generate a cryptographically secure share ID
// SECURITY: Uses crypto.randomBytes instead of Math.random for unpredictable IDs
function generateShareId(): string {
  // Generate 12 random bytes (96 bits of entropy) and encode as base64url
  // This gives us a 16-character URL-safe string
  return randomBytes(12).toString('base64url');
}

export type ShareContentResult = {
  success: boolean;
  message: string;
  shareUrl?: string;
  shareId?: string;
};

export async function shareContentAction(
  contentId: string
): Promise<ShareContentResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: 'Unauthorized. Please log in.',
      };
    }

    // Rate limit
    const rateCheck = checkServerActionRateLimit(session.user.id, 'shareContent', RATE_LIMITS.serverAction);
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    // Verify the content belongs to the user
    const existingContent = await db
      .select({ id: content.id, isShared: content.isShared, shareId: content.shareId })
      .from(content)
      .where(
        and(eq(content.id, contentId), eq(content.userId, session.user.id))
      )
      .limit(1);

    if (existingContent.length === 0) {
      return {
        success: false,
        message: 'Content not found or access denied.',
      };
    }

    // If already shared, return the existing share URL
    if (existingContent[0].isShared && existingContent[0].shareId) {
      const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/share/${existingContent[0].shareId}`;
      return {
        success: true,
        message: 'Content is already shared.',
        shareUrl,
        shareId: existingContent[0].shareId,
      };
    }

    // Generate a new share ID
    const shareId = generateShareId();

    // Update the content to be shared
    await db
      .update(content)
      .set({
        isShared: true,
        shareId,
        updatedAt: new Date(),
      })
      .where(eq(content.id, contentId));

    revalidatePath('/dashboard/library');

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/share/${shareId}`;

    return {
      success: true,
      message: 'Content shared successfully.',
      shareUrl,
      shareId,
    };
  } catch (error) {
    console.error('Error sharing content:', error);
    return {
      success: false,
      message: 'Failed to share content. Please try again.',
    };
  }
}

export async function unshareContentAction(
  contentId: string
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: 'Unauthorized. Please log in.',
      };
    }

    // Rate limit
    const rateCheck = checkServerActionRateLimit(session.user.id, 'unshareContent', RATE_LIMITS.serverAction);
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    // Verify the content belongs to the user
    const existingContent = await db
      .select({ id: content.id })
      .from(content)
      .where(
        and(eq(content.id, contentId), eq(content.userId, session.user.id))
      )
      .limit(1);

    if (existingContent.length === 0) {
      return {
        success: false,
        message: 'Content not found or access denied.',
      };
    }

    // Update the content to be unshared
    await db
      .update(content)
      .set({
        isShared: false,
        shareId: null,
        updatedAt: new Date(),
      })
      .where(eq(content.id, contentId));

    revalidatePath('/dashboard/library');

    return {
      success: true,
      message: 'Content is no longer shared.',
    };
  } catch (error) {
    console.error('Error unsharing content:', error);
    return {
      success: false,
      message: 'Failed to unshare content. Please try again.',
    };
  }
}

export type SharedContentResult = {
  success: boolean;
  message?: string;
  content?: {
    id: string;
    type: ContentType;
    title: string;
    body: string | null;
    url: string | null;
    tags: string[];
    autoTags: string[];
    createdAt: Date;
    metadata: {
      fileType?: string;
      fileSize?: number;
      filePath?: string;
      fileName?: string;
      [key: string]: unknown;
    } | null;
    userName: string | null;
  };
};

export async function getSharedContentAction(
  shareId: string
): Promise<SharedContentResult> {
  try {
    if (!shareId || typeof shareId !== 'string') {
      return {
        success: false,
        message: 'Invalid share ID.',
      };
    }

    // Fetch the shared content
    const result = await db
      .select({
        id: content.id,
        type: content.type,
        title: content.title,
        body: content.body,
        url: content.url,
        tags: content.tags,
        autoTags: content.autoTags,
        createdAt: content.createdAt,
        metadata: content.metadata,
        isShared: content.isShared,
      })
      .from(content)
      .where(and(eq(content.shareId, shareId), eq(content.isShared, true)))
      .limit(1);

    if (result.length === 0) {
      return {
        success: false,
        message: 'Shared content not found or has been unshared.',
      };
    }

    const item = result[0];

    return {
      success: true,
      content: {
        id: item.id,
        type: item.type as ContentType,
        title: item.title,
        body: item.body,
        url: item.url,
        tags: item.tags,
        autoTags: item.autoTags,
        createdAt: item.createdAt,
        metadata: item.metadata,
        userName: null, // We don't expose the user name for privacy
      },
    };
  } catch (error) {
    console.error('Error fetching shared content:', error);
    return {
      success: false,
      message: 'Failed to load shared content.',
    };
  }
}

// Bulk Operations

export type BulkActionResult = {
  success: boolean;
  message: string;
  successCount?: number;
  failedCount?: number;
};

export async function bulkDeleteContentAction(
  contentIds: string[]
): Promise<BulkActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: 'Unauthorized. Please log in.',
      };
    }

    const rateCheck = checkServerActionRateLimit(session.user.id, 'bulkDelete', RATE_LIMITS.serverActionBulk);
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    if (!contentIds || contentIds.length === 0) {
      return {
        success: false,
        message: 'No content selected for deletion.',
      };
    }

    // Fetch metadata before deleting (for GCS cleanup)
    let fileMetadata: { id: string; metadata: unknown }[] = [];
    if (isGCSConfigured()) {
      fileMetadata = await db
        .select({ id: content.id, metadata: content.metadata })
        .from(content)
        .where(
          and(
            inArray(content.id, contentIds),
            eq(content.userId, session.user.id)
          )
        );
    }

    // Delete all matching content in a single batch query
    const result = await db
      .delete(content)
      .where(
        and(
          inArray(content.id, contentIds),
          eq(content.userId, session.user.id)
        )
      )
      .returning({ id: content.id });

    const successCount = result.length;
    const failedCount = contentIds.length - successCount;

    // Clean up GCS objects for deleted items (non-blocking)
    if (isGCSConfigured() && fileMetadata.length > 0) {
      const deletedIds = new Set(result.map((r) => r.id));
      for (const item of fileMetadata) {
        if (!deletedIds.has(item.id)) continue;
        const meta = item.metadata as Record<string, unknown> | null;
        const filePath = meta?.filePath as string | undefined;
        if (filePath) {
          const objectPath = extractGCSObjectPath(filePath);
          if (objectPath) {
            deleteFromGCS(objectPath).catch((err) => {
              console.error('Failed to delete GCS object:', objectPath, err);
            });
          }
        }
      }
    }

    revalidatePath('/dashboard/library');

    if (successCount === 0) {
      return {
        success: false,
        message: 'Failed to delete any content.',
        successCount,
        failedCount,
      };
    }

    return {
      success: true,
      message: `Successfully deleted ${successCount} item${successCount !== 1 ? 's' : ''}.${failedCount > 0 ? ` ${failedCount} item${failedCount !== 1 ? 's' : ''} could not be deleted.` : ''}`,
      successCount,
      failedCount,
    };
  } catch (error) {
    console.error('Error bulk deleting content:', error);
    return {
      success: false,
      message: 'Failed to delete content. Please try again.',
    };
  }
}

export async function bulkAddTagsAction(
  contentIds: string[],
  tags: string[]
): Promise<BulkActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: 'Unauthorized. Please log in.',
      };
    }

    // Rate limit
    const rateCheck = checkServerActionRateLimit(session.user.id, 'bulkAddTags', RATE_LIMITS.serverActionBulk);
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    if (!contentIds || contentIds.length === 0) {
      return {
        success: false,
        message: 'No content selected.',
      };
    }

    if (!tags || tags.length === 0) {
      return {
        success: false,
        message: 'No tags provided.',
      };
    }

    // Batch fetch all items that belong to user
    const existingItems = await db
      .select({ id: content.id, tags: content.tags })
      .from(content)
      .where(
        and(
          inArray(content.id, contentIds),
          eq(content.userId, session.user.id)
        )
      );

    const existingIds = new Set(existingItems.map((item) => item.id));
    let failedCount = contentIds.filter((id) => !existingIds.has(id)).length;
    let successCount = 0;

    // Update tags in parallel
    if (existingItems.length > 0) {
      const updatePromises = existingItems.map(async (item) => {
        try {
          const existingTags = new Set(item.tags || []);
          const newTags = [...existingTags, ...tags.filter((t) => !existingTags.has(t))];

          await db
            .update(content)
            .set({ tags: newTags, updatedAt: new Date() })
            .where(eq(content.id, item.id));
          return true;
        } catch {
          return false;
        }
      });

      const results = await Promise.all(updatePromises);
      successCount = results.filter(Boolean).length;
      failedCount += results.filter((r) => !r).length;
    }

    revalidatePath('/dashboard/library');

    if (successCount === 0) {
      return {
        success: false,
        message: 'Failed to add tags to any content.',
        successCount,
        failedCount,
      };
    }

    return {
      success: true,
      message: `Successfully added tags to ${successCount} item${successCount !== 1 ? 's' : ''}.`,
      successCount,
      failedCount,
    };
  } catch (error) {
    console.error('Error bulk adding tags:', error);
    return {
      success: false,
      message: 'Failed to add tags. Please try again.',
    };
  }
}

export async function bulkShareContentAction(
  contentIds: string[]
): Promise<BulkActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: 'Unauthorized. Please log in.',
      };
    }

    // Rate limit
    const rateCheck = checkServerActionRateLimit(session.user.id, 'bulkShareContent', RATE_LIMITS.serverActionBulk);
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    if (!contentIds || contentIds.length === 0) {
      return {
        success: false,
        message: 'No content selected.',
      };
    }

    // Batch fetch all items that belong to user
    const existingItems = await db
      .select({ id: content.id, isShared: content.isShared })
      .from(content)
      .where(
        and(
          inArray(content.id, contentIds),
          eq(content.userId, session.user.id)
        )
      );

    const existingIds = new Set(existingItems.map((item) => item.id));
    const alreadyShared = existingItems.filter((item) => item.isShared);
    const toShare = existingItems.filter((item) => !item.isShared);

    // Count items not found as failed
    let failedCount = contentIds.filter((id) => !existingIds.has(id)).length;
    let successCount = alreadyShared.length;

    // Share unshared items in parallel
    if (toShare.length > 0) {
      const sharePromises = toShare.map(async (item) => {
        try {
          const shareId = generateShareId();
          await db
            .update(content)
            .set({ isShared: true, shareId, updatedAt: new Date() })
            .where(eq(content.id, item.id));
          return true;
        } catch {
          return false;
        }
      });

      const results = await Promise.all(sharePromises);
      successCount += results.filter(Boolean).length;
      failedCount += results.filter((r) => !r).length;
    }

    revalidatePath('/dashboard/library');

    if (successCount === 0) {
      return {
        success: false,
        message: 'Failed to share any content.',
        successCount,
        failedCount,
      };
    }

    return {
      success: true,
      message: `Successfully shared ${successCount} item${successCount !== 1 ? 's' : ''}.`,
      successCount,
      failedCount,
    };
  } catch (error) {
    console.error('Error bulk sharing content:', error);
    return {
      success: false,
      message: 'Failed to share content. Please try again.',
    };
  }
}

export async function bulkUnshareContentAction(
  contentIds: string[]
): Promise<BulkActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: 'Unauthorized. Please log in.',
      };
    }

    // Rate limit
    const rateCheck = checkServerActionRateLimit(session.user.id, 'bulkUnshareContent', RATE_LIMITS.serverActionBulk);
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    if (!contentIds || contentIds.length === 0) {
      return {
        success: false,
        message: 'No content selected.',
      };
    }

    // Batch update all matching content in a single query
    const result = await db
      .update(content)
      .set({ isShared: false, shareId: null, updatedAt: new Date() })
      .where(
        and(
          inArray(content.id, contentIds),
          eq(content.userId, session.user.id)
        )
      )
      .returning({ id: content.id });

    const successCount = result.length;
    const failedCount = contentIds.length - successCount;

    revalidatePath('/dashboard/library');

    if (successCount === 0) {
      return {
        success: false,
        message: 'Failed to unshare any content.',
        successCount,
        failedCount,
      };
    }

    return {
      success: true,
      message: `Successfully unshared ${successCount} item${successCount !== 1 ? 's' : ''}.`,
      successCount,
      failedCount,
    };
  } catch (error) {
    console.error('Error bulk unsharing content:', error);
    return {
      success: false,
      message: 'Failed to unshare content. Please try again.',
    };
  }
}

// Toggle favorite status
export type ToggleFavoriteResult = {
  success: boolean;
  message: string;
  isFavorite?: boolean;
};

export async function toggleFavoriteAction(
  contentId: string
): Promise<ToggleFavoriteResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: 'Unauthorized. Please log in.',
      };
    }

    // Rate limit
    const rateCheck = checkServerActionRateLimit(session.user.id, 'toggleFavorite', RATE_LIMITS.serverAction);
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    // Get the current favorite status
    const [existingContent] = await db
      .select({ id: content.id, isFavorite: content.isFavorite })
      .from(content)
      .where(
        and(eq(content.id, contentId), eq(content.userId, session.user.id))
      );

    if (!existingContent) {
      return {
        success: false,
        message: 'Content not found or access denied.',
      };
    }

    const newFavoriteStatus = !existingContent.isFavorite;

    // Toggle the favorite status
    await db
      .update(content)
      .set({
        isFavorite: newFavoriteStatus,
        updatedAt: new Date(),
      })
      .where(eq(content.id, contentId));

    revalidatePath('/dashboard/library');

    return {
      success: true,
      message: newFavoriteStatus ? 'Added to favorites.' : 'Removed from favorites.',
      isFavorite: newFavoriteStatus,
    };
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return {
      success: false,
      message: 'Failed to toggle favorite. Please try again.',
    };
  }
}
