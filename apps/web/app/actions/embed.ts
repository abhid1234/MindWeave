'use server';

import { db } from '@/lib/db/client';
import { content, collections, contentCollections, users } from '@/lib/db/schema';
import { eq, and, count } from 'drizzle-orm';

export interface EmbedContentResult {
  success: boolean;
  data?: {
    id: string;
    title: string;
    body: string | null;
    type: string;
    tags: string[];
    autoTags: string[];
    createdAt: Date;
    shareId: string;
  };
  message?: string;
}

export interface EmbedCollectionResult {
  success: boolean;
  data?: {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
    itemCount: number;
    tags: string[];
    creator: {
      name: string | null;
      username: string | null;
      image: string | null;
    };
  };
  message?: string;
}

export async function getEmbedDataAction(shareId: string): Promise<EmbedContentResult> {
  try {
    if (!shareId || typeof shareId !== 'string') {
      return { success: false, message: 'Invalid share ID.' };
    }

    const result = await db
      .select({
        id: content.id,
        title: content.title,
        body: content.body,
        type: content.type,
        tags: content.tags,
        autoTags: content.autoTags,
        createdAt: content.createdAt,
        shareId: content.shareId,
      })
      .from(content)
      .where(and(eq(content.shareId, shareId), eq(content.isShared, true)))
      .limit(1);

    if (result.length === 0) {
      return { success: false, message: 'Content not found or not shared.' };
    }

    return {
      success: true,
      data: {
        ...result[0],
        shareId: result[0].shareId!,
      },
    };
  } catch {
    return { success: false, message: 'Failed to load embed data.' };
  }
}

export async function getEmbedCollectionAction(collectionId: string): Promise<EmbedCollectionResult> {
  try {
    if (!collectionId || typeof collectionId !== 'string') {
      return { success: false, message: 'Invalid collection ID.' };
    }

    const result = await db
      .select({
        id: collections.id,
        name: collections.name,
        description: collections.description,
        color: collections.color,
        creatorName: users.name,
        creatorUsername: users.username,
        creatorImage: users.image,
      })
      .from(collections)
      .innerJoin(users, eq(collections.userId, users.id))
      .where(and(eq(collections.id, collectionId), eq(collections.isPublic, true)))
      .limit(1);

    if (result.length === 0) {
      return { success: false, message: 'Collection not found or not public.' };
    }

    const [itemCountResult] = await db
      .select({ count: count() })
      .from(contentCollections)
      .where(eq(contentCollections.collectionId, collectionId));

    // Gather tags from collection items
    const items = await db
      .select({ tags: content.tags })
      .from(content)
      .innerJoin(contentCollections, eq(content.id, contentCollections.contentId))
      .where(eq(contentCollections.collectionId, collectionId))
      .limit(50);

    const tagCounts = new Map<string, number>();
    for (const item of items) {
      for (const tag of item.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }
    const topTags = [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag);

    const col = result[0];
    return {
      success: true,
      data: {
        id: col.id,
        name: col.name,
        description: col.description,
        color: col.color,
        itemCount: itemCountResult.count,
        tags: topTags,
        creator: {
          name: col.creatorName,
          username: col.creatorUsername,
          image: col.creatorImage,
        },
      },
    };
  } catch {
    return { success: false, message: 'Failed to load collection embed data.' };
  }
}
