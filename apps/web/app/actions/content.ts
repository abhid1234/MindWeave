'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { content, type ContentType } from '@/lib/db/schema';
import { createContentSchema } from '@/lib/validations';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { eq, desc, asc, and, or, sql, type SQL } from 'drizzle-orm';

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

    // Parse and prepare data
    const tagsInput = formData.get('tags') as string | null;
    const rawData = {
      type: formData.get('type'),
      title: formData.get('title'),
      body: formData.get('body') || '',
      url: formData.get('url') || '',
      tags: tagsInput
        ? tagsInput.split(',').map((tag) => tag.trim()).filter(Boolean)
        : [],
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
        autoTags: [], // TODO: Generate with Claude API
        metadata: validatedData.metadata || {},
      })
      .returning({ id: content.id });

    // Revalidate relevant pages
    revalidatePath('/dashboard/library');
    revalidatePath('/dashboard');

    return {
      success: true,
      message: 'Content saved successfully!',
      data: { id: newContent.id },
    };
  } catch (error) {
    console.error('Error creating content:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: 'Validation error',
        errors: error.flatten().fieldErrors,
      };
    }

    return {
      success: false,
      message: 'Failed to save content. Please try again.',
    };
  }
}

export type GetContentParams = {
  type?: ContentType;
  tag?: string;
  query?: string;
  sortBy?: 'createdAt' | 'title';
  sortOrder?: 'asc' | 'desc';
};

export type GetContentResult = {
  success: boolean;
  items: Array<{
    id: string;
    type: ContentType;
    title: string;
    body: string | null;
    url: string | null;
    tags: string[];
    autoTags: string[];
    createdAt: Date;
  }>;
  allTags: string[];
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
      .set({ tags: cleanedTags })
      .where(eq(content.id, contentId));

    // Revalidate relevant pages
    revalidatePath('/dashboard/library');
    revalidatePath('/dashboard');

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
    } = params;

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

    // Fetch content with filters and sorting
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
      })
      .from(content)
      .where(whereClause)
      .orderBy(orderByClause);

    // Fetch all unique tags for the user
    const allContent = await db
      .select({
        tags: content.tags,
        autoTags: content.autoTags,
      })
      .from(content)
      .where(eq(content.userId, session.user.id));

    const allTagsSet = new Set<string>();
    allContent.forEach((item) => {
      item.tags.forEach((tag) => allTagsSet.add(tag));
      item.autoTags.forEach((tag) => allTagsSet.add(tag));
    });

    const allTags = Array.from(allTagsSet).sort();

    return {
      success: true,
      items,
      allTags,
    };
  } catch (error) {
    console.error('Error fetching content:', error);
    return {
      success: false,
      items: [],
      allTags: [],
    };
  }
}
