'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { content, generatedPosts } from '@/lib/db/schema';
import { eq, desc, and, inArray, ilike, or } from 'drizzle-orm';
import { generateLinkedInPost } from '@/lib/ai/gemini';
import { generatePostSchema } from '@/lib/validations';
import { checkServerActionRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export type GeneratePostResponse = {
  success: boolean;
  message?: string;
  post?: {
    id: string;
    postContent: string;
    tone: string;
    length: string;
    includeHashtags: boolean;
    sourceContentTitles: string[];
    createdAt: Date;
  };
};

export type PostHistoryResponse = {
  success: boolean;
  message?: string;
  posts: Array<{
    id: string;
    postContent: string;
    tone: string;
    length: string;
    includeHashtags: boolean;
    sourceContentTitles: string[];
    createdAt: Date;
  }>;
};

export type ContentForSelectionResponse = {
  success: boolean;
  message?: string;
  items: Array<{
    id: string;
    title: string;
    type: string;
    tags: string[];
    createdAt: Date;
  }>;
};

/**
 * Generate a LinkedIn post from selected content
 */
export async function generatePostAction(
  input: unknown
): Promise<GeneratePostResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized.' };
    }

    const rateCheck = checkServerActionRateLimit(
      session.user.id,
      'generatePost',
      RATE_LIMITS.serverActionAI
    );
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message };
    }

    const parsed = generatePostSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.errors[0].message,
      };
    }

    const { contentIds, tone, length, includeHashtags } = parsed.data;
    const userId = session.user.id;

    // Fetch selected content and verify ownership
    const selectedContent = await db
      .select({
        id: content.id,
        title: content.title,
        body: content.body,
        url: content.url,
        type: content.type,
        tags: content.tags,
      })
      .from(content)
      .where(and(inArray(content.id, contentIds), eq(content.userId, userId)));

    if (selectedContent.length === 0) {
      return {
        success: false,
        message: 'No content found. Make sure you own the selected items.',
      };
    }

    // Generate post via AI
    const postText = await generateLinkedInPost({
      content: selectedContent.map((c) => ({
        title: c.title,
        body: c.body ?? undefined,
        url: c.url ?? undefined,
        type: c.type as 'note' | 'link' | 'file',
        tags: c.tags,
      })),
      tone,
      length,
      includeHashtags,
    });

    // Save to database
    const [saved] = await db
      .insert(generatedPosts)
      .values({
        userId,
        postContent: postText,
        tone,
        length,
        includeHashtags,
        sourceContentIds: contentIds,
        sourceContentTitles: selectedContent.map((c) => c.title),
      })
      .returning();

    return {
      success: true,
      post: {
        id: saved.id,
        postContent: saved.postContent,
        tone: saved.tone,
        length: saved.length,
        includeHashtags: saved.includeHashtags,
        sourceContentTitles: saved.sourceContentTitles,
        createdAt: saved.createdAt,
      },
    };
  } catch (error) {
    console.error('Error generating post:', error);
    return {
      success: false,
      message: 'Failed to generate post. Please try again.',
    };
  }
}

/**
 * Get the user's post generation history
 */
export async function getPostHistoryAction(
  limit: number = 20
): Promise<PostHistoryResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized.', posts: [] };
    }

    const rateCheck = checkServerActionRateLimit(
      session.user.id,
      'postHistory',
      RATE_LIMITS.serverAction
    );
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message, posts: [] };
    }

    const safeLimit = Math.min(Math.max(1, limit), 50);

    const posts = await db
      .select({
        id: generatedPosts.id,
        postContent: generatedPosts.postContent,
        tone: generatedPosts.tone,
        length: generatedPosts.length,
        includeHashtags: generatedPosts.includeHashtags,
        sourceContentTitles: generatedPosts.sourceContentTitles,
        createdAt: generatedPosts.createdAt,
      })
      .from(generatedPosts)
      .where(eq(generatedPosts.userId, session.user.id))
      .orderBy(desc(generatedPosts.createdAt))
      .limit(safeLimit);

    return { success: true, posts };
  } catch (error) {
    console.error('Error fetching post history:', error);
    return {
      success: false,
      message: 'Failed to fetch post history.',
      posts: [],
    };
  }
}

/**
 * Delete a generated post
 */
export async function deletePostAction(
  postId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized.' };
    }

    const rateCheck = checkServerActionRateLimit(
      session.user.id,
      'deletePost',
      RATE_LIMITS.serverAction
    );
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message };
    }

    // Verify ownership before deleting
    const [existing] = await db
      .select({ id: generatedPosts.id })
      .from(generatedPosts)
      .where(
        and(
          eq(generatedPosts.id, postId),
          eq(generatedPosts.userId, session.user.id)
        )
      );

    if (!existing) {
      return { success: false, message: 'Post not found.' };
    }

    await db
      .delete(generatedPosts)
      .where(eq(generatedPosts.id, postId));

    return { success: true };
  } catch (error) {
    console.error('Error deleting post:', error);
    return { success: false, message: 'Failed to delete post.' };
  }
}

/**
 * Get user's content for the selection picker
 */
export async function getContentForSelectionAction(
  query?: string
): Promise<ContentForSelectionResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized.', items: [] };
    }

    const rateCheck = checkServerActionRateLimit(
      session.user.id,
      'contentSelection',
      RATE_LIMITS.serverAction
    );
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message, items: [] };
    }

    const userId = session.user.id;

    const conditions = [eq(content.userId, userId)];

    if (query && query.trim().length > 0) {
      const searchTerm = `%${query.trim()}%`;
      conditions.push(
        or(
          ilike(content.title, searchTerm),
          ilike(content.body, searchTerm)
        )!
      );
    }

    const items = await db
      .select({
        id: content.id,
        title: content.title,
        type: content.type,
        tags: content.tags,
        createdAt: content.createdAt,
      })
      .from(content)
      .where(and(...conditions))
      .orderBy(desc(content.createdAt))
      .limit(50);

    return { success: true, items };
  } catch (error) {
    console.error('Error fetching content for selection:', error);
    return {
      success: false,
      message: 'Failed to fetch content.',
      items: [],
    };
  }
}
