'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { tilPosts, tilUpvotes, content, users } from '@/lib/db/schema';
import { eq, and, sql, ilike, or, desc } from 'drizzle-orm';
import { z } from 'zod';
import { checkServerActionRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { publishTilSchema, browseTilSchema } from '@/lib/validations';
import type {
  TilActionResult,
  BrowseTilResult,
  TilDetailResult,
  TilPostWithDetails,
} from '@/types/til';
import crypto from 'crypto';

// Publish content as a TIL post
export async function publishTilAction(
  params: z.infer<typeof publishTilSchema>
): Promise<TilActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const rateCheck = checkServerActionRateLimit(
      session.user.id,
      'tilPublish',
      RATE_LIMITS.tilPublish
    );
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    const validatedData = publishTilSchema.parse(params);

    // Verify ownership of content
    const [contentItem] = await db
      .select({
        id: content.id,
        userId: content.userId,
        isShared: content.isShared,
        shareId: content.shareId,
      })
      .from(content)
      .where(
        and(
          eq(content.id, validatedData.contentId),
          eq(content.userId, session.user.id)
        )
      );

    if (!contentItem) {
      return { success: false, message: 'Content not found' };
    }

    // Check for duplicate TIL
    const [existing] = await db
      .select({ id: tilPosts.id })
      .from(tilPosts)
      .where(eq(tilPosts.contentId, validatedData.contentId));

    if (existing) {
      return { success: false, message: 'This content is already published as a TIL' };
    }

    // Auto-share content if not already shared
    if (!contentItem.isShared) {
      const shareId = crypto.randomBytes(16).toString('hex');
      await db
        .update(content)
        .set({ isShared: true, shareId, updatedAt: new Date() })
        .where(eq(content.id, validatedData.contentId));
    }

    // Create TIL post
    const [tilPost] = await db
      .insert(tilPosts)
      .values({
        contentId: validatedData.contentId,
        userId: session.user.id,
        title: validatedData.title,
        body: validatedData.body || null,
        tags: validatedData.tags,
      })
      .returning({ id: tilPosts.id });

    revalidatePath('/til');
    revalidatePath('/dashboard/library');

    return { success: true, message: 'Published as TIL!', tilId: tilPost.id };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.error('Publish TIL error:', error);
    return { success: false, message: 'Failed to publish TIL' };
  }
}

// Unpublish a TIL post
export async function unpublishTilAction(tilId: string): Promise<TilActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    // Verify ownership
    const [tilPost] = await db
      .select({ id: tilPosts.id, userId: tilPosts.userId })
      .from(tilPosts)
      .where(eq(tilPosts.id, tilId));

    if (!tilPost) {
      return { success: false, message: 'TIL not found' };
    }

    if (tilPost.userId !== session.user.id) {
      return { success: false, message: 'Unauthorized' };
    }

    // Delete TIL (cascade deletes upvotes)
    await db.delete(tilPosts).where(eq(tilPosts.id, tilId));

    revalidatePath('/til');

    return { success: true, message: 'TIL unpublished' };
  } catch (error) {
    console.error('Unpublish TIL error:', error);
    return { success: false, message: 'Failed to unpublish TIL' };
  }
}

// Browse TIL posts (no auth required)
export async function browseTilAction(
  params?: z.input<typeof browseTilSchema>
): Promise<BrowseTilResult> {
  try {
    const validatedData = browseTilSchema.parse(params || {});
    const { query, tag, sort, page, perPage } = validatedData;
    const offset = (page - 1) * perPage;

    // Get current user for hasUpvoted
    const session = await auth();
    const userId = session?.user?.id;

    // Build where conditions
    const conditions = [];
    if (query) {
      conditions.push(
        or(
          ilike(tilPosts.title, `%${query}%`),
          ilike(sql`coalesce(${tilPosts.body}, '')`, `%${query}%`)
        )!
      );
    }
    if (tag) {
      conditions.push(sql`${tag} = ANY(${tilPosts.tags})`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions)! : sql`true`;

    // Sort
    let orderBy;
    switch (sort) {
      case 'newest':
        orderBy = desc(tilPosts.publishedAt);
        break;
      case 'most-upvoted':
        orderBy = desc(tilPosts.upvoteCount);
        break;
      case 'trending':
      default:
        // trending = (upvotes * 3 + views) / (age_hours / 24 + 1)
        orderBy = desc(
          sql`(${tilPosts.upvoteCount} * 3 + ${tilPosts.viewCount}) / (extract(epoch from now() - ${tilPosts.publishedAt}) / 3600 / 24 + 1)`
        );
        break;
    }

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(tilPosts)
      .where(whereClause);

    const total = countResult?.count || 0;

    // Get posts with creator info
    const rows = await db
      .select({
        id: tilPosts.id,
        contentId: tilPosts.contentId,
        title: tilPosts.title,
        body: tilPosts.body,
        tags: tilPosts.tags,
        upvoteCount: tilPosts.upvoteCount,
        viewCount: tilPosts.viewCount,
        publishedAt: tilPosts.publishedAt,
        creatorId: users.id,
        creatorName: users.name,
        creatorUsername: users.username,
        creatorImage: users.image,
        shareId: content.shareId,
      })
      .from(tilPosts)
      .innerJoin(users, eq(tilPosts.userId, users.id))
      .innerJoin(content, eq(tilPosts.contentId, content.id))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(perPage)
      .offset(offset);

    // Check upvotes for current user
    let upvotedTilIds = new Set<string>();
    if (userId && rows.length > 0) {
      const tilIds = rows.map((r) => r.id);
      const upvotes = await db
        .select({ tilId: tilUpvotes.tilId })
        .from(tilUpvotes)
        .where(
          and(
            eq(tilUpvotes.userId, userId),
            sql`${tilUpvotes.tilId} IN (${sql.join(
              tilIds.map((id) => sql`${id}`),
              sql`, `
            )})`
          )
        );
      upvotedTilIds = new Set(upvotes.map((u) => u.tilId));
    }

    const posts: TilPostWithDetails[] = rows.map((row) => ({
      id: row.id,
      contentId: row.contentId,
      title: row.title,
      body: row.body,
      tags: row.tags,
      upvoteCount: row.upvoteCount,
      viewCount: row.viewCount,
      publishedAt: row.publishedAt,
      creator: {
        id: row.creatorId,
        name: row.creatorName,
        username: row.creatorUsername,
        image: row.creatorImage,
      },
      hasUpvoted: upvotedTilIds.has(row.id),
      shareId: row.shareId,
    }));

    // Get popular tags
    const tagResults = await db
      .select({ tags: tilPosts.tags })
      .from(tilPosts)
      .limit(100);

    const tagCounts = new Map<string, number>();
    for (const row of tagResults) {
      for (const t of row.tags) {
        tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
      }
    }
    const popularTags = [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([t]) => t);

    return {
      success: true,
      posts,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
      popularTags,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        posts: [],
        pagination: { page: 1, perPage: 20, total: 0, totalPages: 0 },
        popularTags: [],
        message: error.errors[0].message,
      };
    }
    console.error('Browse TIL error:', error);
    return {
      success: false,
      posts: [],
      pagination: { page: 1, perPage: 20, total: 0, totalPages: 0 },
      popularTags: [],
      message: 'Failed to browse TIL posts',
    };
  }
}

// Toggle upvote on a TIL post
export async function upvoteTilAction(tilId: string): Promise<TilActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Sign in to upvote' };
    }

    const rateCheck = checkServerActionRateLimit(
      session.user.id,
      'tilUpvote',
      RATE_LIMITS.tilUpvote
    );
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    // Check if already upvoted
    const [existing] = await db
      .select()
      .from(tilUpvotes)
      .where(
        and(
          eq(tilUpvotes.tilId, tilId),
          eq(tilUpvotes.userId, session.user.id)
        )
      );

    if (existing) {
      // Remove upvote
      await db
        .delete(tilUpvotes)
        .where(
          and(
            eq(tilUpvotes.tilId, tilId),
            eq(tilUpvotes.userId, session.user.id)
          )
        );

      // Atomic decrement
      await db
        .update(tilPosts)
        .set({ upvoteCount: sql`${tilPosts.upvoteCount} - 1` })
        .where(eq(tilPosts.id, tilId));

      return { success: true, message: 'Upvote removed' };
    } else {
      // Add upvote
      await db.insert(tilUpvotes).values({
        tilId,
        userId: session.user.id,
      });

      // Atomic increment
      await db
        .update(tilPosts)
        .set({ upvoteCount: sql`${tilPosts.upvoteCount} + 1` })
        .where(eq(tilPosts.id, tilId));

      return { success: true, message: 'Upvoted!' };
    }
  } catch (error) {
    console.error('Upvote TIL error:', error);
    return { success: false, message: 'Failed to toggle upvote' };
  }
}

// Track a view on a TIL post (fire-and-forget)
export async function trackTilViewAction(tilId: string): Promise<void> {
  try {
    await db
      .update(tilPosts)
      .set({ viewCount: sql`${tilPosts.viewCount} + 1` })
      .where(eq(tilPosts.id, tilId));
  } catch {
    // Fire-and-forget, silently fail
  }
}

// Get full TIL detail
export async function getTilDetailAction(tilId: string): Promise<TilDetailResult> {
  try {
    if (!tilId || typeof tilId !== 'string') {
      return { success: false, message: 'Invalid TIL ID' };
    }

    const session = await auth();
    const userId = session?.user?.id;

    const rows = await db
      .select({
        id: tilPosts.id,
        contentId: tilPosts.contentId,
        title: tilPosts.title,
        body: tilPosts.body,
        tags: tilPosts.tags,
        upvoteCount: tilPosts.upvoteCount,
        viewCount: tilPosts.viewCount,
        publishedAt: tilPosts.publishedAt,
        creatorId: users.id,
        creatorName: users.name,
        creatorUsername: users.username,
        creatorImage: users.image,
        shareId: content.shareId,
      })
      .from(tilPosts)
      .innerJoin(users, eq(tilPosts.userId, users.id))
      .innerJoin(content, eq(tilPosts.contentId, content.id))
      .where(eq(tilPosts.id, tilId))
      .limit(1);

    if (rows.length === 0) {
      return { success: false, message: 'TIL not found' };
    }

    const row = rows[0];

    // Check if current user upvoted
    let hasUpvoted = false;
    if (userId) {
      const [upvote] = await db
        .select()
        .from(tilUpvotes)
        .where(
          and(
            eq(tilUpvotes.tilId, tilId),
            eq(tilUpvotes.userId, userId)
          )
        );
      hasUpvoted = !!upvote;
    }

    return {
      success: true,
      post: {
        id: row.id,
        contentId: row.contentId,
        title: row.title,
        body: row.body,
        tags: row.tags,
        upvoteCount: row.upvoteCount,
        viewCount: row.viewCount,
        publishedAt: row.publishedAt,
        creator: {
          id: row.creatorId,
          name: row.creatorName,
          username: row.creatorUsername,
          image: row.creatorImage,
        },
        hasUpvoted,
        shareId: row.shareId,
      },
    };
  } catch (error) {
    console.error('Get TIL detail error:', error);
    return { success: false, message: 'Failed to load TIL' };
  }
}
