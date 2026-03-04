'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import {
  marketplaceListings,
  collections,
  contentCollections,
  content,
  users,
  collectionMembers,
} from '@/lib/db/schema';
import { eq, and, sql, ilike, or, desc, asc } from 'drizzle-orm';
import { z } from 'zod';
import { checkServerActionRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { publishToMarketplaceSchema, browseMarketplaceSchema } from '@/lib/validations';
import type {
  MarketplaceActionResult,
  BrowseMarketplaceResult,
  CloneResult,
  MarketplaceStatsResult,
  GetMarketplaceListingResult,
  MarketplaceListingWithDetails,
} from '@/types/marketplace';
import { checkAndUnlockBadgesAction } from './badges';

// Publish a collection to the marketplace
export async function publishToMarketplaceAction(
  params: z.infer<typeof publishToMarketplaceSchema>
): Promise<MarketplaceActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const rateCheck = checkServerActionRateLimit(
      session.user.id,
      'publishToMarketplace',
      RATE_LIMITS.serverAction
    );
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    const validatedData = publishToMarketplaceSchema.parse(params);

    // Verify ownership
    const [collection] = await db
      .select()
      .from(collections)
      .where(
        and(
          eq(collections.id, validatedData.collectionId),
          eq(collections.userId, session.user.id)
        )
      );

    if (!collection) {
      return { success: false, message: 'Collection not found' };
    }

    // Verify collection has at least 1 item
    const [countResult] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(contentCollections)
      .where(eq(contentCollections.collectionId, validatedData.collectionId));

    if (!countResult || countResult.count === 0) {
      return { success: false, message: 'Collection must have at least 1 item' };
    }

    // Auto-set collection to public
    await db
      .update(collections)
      .set({ isPublic: true, updatedAt: new Date() })
      .where(eq(collections.id, validatedData.collectionId));

    // Upsert: insert or update existing listing
    const existing = await db
      .select()
      .from(marketplaceListings)
      .where(eq(marketplaceListings.collectionId, validatedData.collectionId));

    if (existing.length > 0) {
      await db
        .update(marketplaceListings)
        .set({
          category: validatedData.category,
          description: validatedData.description || null,
          updatedAt: new Date(),
        })
        .where(eq(marketplaceListings.collectionId, validatedData.collectionId));
    } else {
      await db.insert(marketplaceListings).values({
        collectionId: validatedData.collectionId,
        userId: session.user.id,
        category: validatedData.category,
        description: validatedData.description || null,
      });
    }

    // Check for badge unlocks (non-blocking)
    checkAndUnlockBadgesAction('marketplace_published').catch(console.error);

    revalidatePath('/marketplace');
    revalidatePath('/dashboard/library');

    return { success: true, message: 'Collection published to marketplace' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.error('Publish to marketplace error:', error);
    return { success: false, message: 'Failed to publish to marketplace' };
  }
}

// Unpublish a collection from the marketplace
export async function unpublishFromMarketplaceAction(
  collectionId: string
): Promise<MarketplaceActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const rateCheck = checkServerActionRateLimit(
      session.user.id,
      'unpublishFromMarketplace',
      RATE_LIMITS.serverAction
    );
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    // Verify listing exists and user owns it
    const [listing] = await db
      .select()
      .from(marketplaceListings)
      .where(
        and(
          eq(marketplaceListings.collectionId, collectionId),
          eq(marketplaceListings.userId, session.user.id)
        )
      );

    if (!listing) {
      return { success: false, message: 'Listing not found' };
    }

    await db
      .delete(marketplaceListings)
      .where(eq(marketplaceListings.id, listing.id));

    revalidatePath('/marketplace');
    revalidatePath('/dashboard/library');

    return { success: true, message: 'Collection removed from marketplace' };
  } catch (error) {
    console.error('Unpublish from marketplace error:', error);
    return { success: false, message: 'Failed to unpublish from marketplace' };
  }
}

// Browse marketplace listings (no auth required)
export async function browseMarketplaceAction(
  params?: z.input<typeof browseMarketplaceSchema>
): Promise<BrowseMarketplaceResult> {
  try {
    const validatedData = browseMarketplaceSchema.parse(params || {});
    const { query, category, sort, page, perPage } = validatedData;
    const offset = (page - 1) * perPage;

    // Build where conditions
    const conditions = [];
    if (category) {
      conditions.push(eq(marketplaceListings.category, category));
    }
    if (query) {
      conditions.push(
        or(
          ilike(collections.name, `%${query}%`),
          ilike(sql`coalesce(${marketplaceListings.description}, '')`, `%${query}%`)
        )!
      );
    }

    // Always build a where clause (use sql`true` as default) for consistent query chain
    const whereClause = conditions.length > 0 ? and(...conditions)! : sql`true`;

    // Sort
    let orderBy;
    switch (sort) {
      case 'newest':
        orderBy = desc(marketplaceListings.publishedAt);
        break;
      case 'most-cloned':
        orderBy = desc(marketplaceListings.cloneCount);
        break;
      case 'trending':
      default:
        // trending = (clones*3 + views) / (age_days + 1)
        orderBy = desc(
          sql`(${marketplaceListings.cloneCount} * 3 + ${marketplaceListings.viewCount}) / (extract(epoch from now() - ${marketplaceListings.publishedAt}) / 86400 + 1)`
        );
        break;
    }

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(marketplaceListings)
      .innerJoin(collections, eq(marketplaceListings.collectionId, collections.id))
      .innerJoin(users, eq(marketplaceListings.userId, users.id))
      .where(whereClause);

    const total = countResult?.count || 0;

    // Get listings with details
    const rows = await db
      .select({
        id: marketplaceListings.id,
        collectionId: marketplaceListings.collectionId,
        category: marketplaceListings.category,
        description: marketplaceListings.description,
        isFeatured: marketplaceListings.isFeatured,
        viewCount: marketplaceListings.viewCount,
        cloneCount: marketplaceListings.cloneCount,
        publishedAt: marketplaceListings.publishedAt,
        collectionName: collections.name,
        collectionColor: collections.color,
        collectionDescription: collections.description,
        creatorId: users.id,
        creatorName: users.name,
        creatorUsername: users.username,
        creatorImage: users.image,
      })
      .from(marketplaceListings)
      .innerJoin(collections, eq(marketplaceListings.collectionId, collections.id))
      .innerJoin(users, eq(marketplaceListings.userId, users.id))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(perPage)
      .offset(offset);

    // Get content counts and tags for each listing
    const listings: MarketplaceListingWithDetails[] = await Promise.all(
      rows.map(async (row) => {
        const [contentCountResult] = await db
          .select({ count: sql<number>`cast(count(*) as int)` })
          .from(contentCollections)
          .where(eq(contentCollections.collectionId, row.collectionId));

        // Aggregate tags from content in this collection
        const tagResults = await db
          .select({ tags: content.tags, autoTags: content.autoTags })
          .from(content)
          .innerJoin(contentCollections, eq(content.id, contentCollections.contentId))
          .where(eq(contentCollections.collectionId, row.collectionId));

        const allTags = new Set<string>();
        tagResults.forEach((r) => {
          r.tags.forEach((t) => allTags.add(t));
          r.autoTags.forEach((t) => allTags.add(t));
        });

        return {
          id: row.id,
          collectionId: row.collectionId,
          category: row.category,
          description: row.description,
          isFeatured: row.isFeatured,
          viewCount: row.viewCount,
          cloneCount: row.cloneCount,
          publishedAt: row.publishedAt,
          collection: {
            name: row.collectionName,
            color: row.collectionColor,
            description: row.collectionDescription,
          },
          creator: {
            id: row.creatorId,
            name: row.creatorName,
            username: row.creatorUsername,
            image: row.creatorImage,
          },
          contentCount: contentCountResult?.count || 0,
          tags: Array.from(allTags).slice(0, 10),
        };
      })
    );

    return {
      success: true,
      listings,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        listings: [],
        pagination: { page: 1, perPage: 12, total: 0, totalPages: 0 },
        message: error.errors[0].message,
      };
    }
    console.error('Browse marketplace error:', error);
    return {
      success: false,
      listings: [],
      pagination: { page: 1, perPage: 12, total: 0, totalPages: 0 },
      message: 'Failed to browse marketplace',
    };
  }
}

// Clone a marketplace listing into user's library
export async function cloneCollectionAction(
  listingId: string
): Promise<CloneResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const rateCheck = checkServerActionRateLimit(
      session.user.id,
      'marketplaceClone',
      RATE_LIMITS.marketplaceClone
    );
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    // Get the listing
    const [listing] = await db
      .select()
      .from(marketplaceListings)
      .where(eq(marketplaceListings.id, listingId));

    if (!listing) {
      return { success: false, message: 'Listing not found' };
    }

    // Prevent self-clone
    if (listing.userId === session.user.id) {
      return { success: false, message: 'Cannot clone your own collection' };
    }

    // Get source collection
    const [sourceCollection] = await db
      .select()
      .from(collections)
      .where(eq(collections.id, listing.collectionId));

    if (!sourceCollection) {
      return { success: false, message: 'Source collection not found' };
    }

    // Get content items from source collection
    const sourceContent = await db
      .select({
        id: content.id,
        type: content.type,
        title: content.title,
        body: content.body,
        url: content.url,
        tags: content.tags,
        autoTags: content.autoTags,
        summary: content.summary,
        metadata: content.metadata,
      })
      .from(content)
      .innerJoin(contentCollections, eq(content.id, contentCollections.contentId))
      .where(eq(contentCollections.collectionId, listing.collectionId));

    // Create new collection
    const [newCollection] = await db
      .insert(collections)
      .values({
        userId: session.user.id,
        name: `${sourceCollection.name} (cloned)`,
        description: sourceCollection.description,
        color: sourceCollection.color,
      })
      .returning();

    // Add user as owner
    await db.insert(collectionMembers).values({
      collectionId: newCollection.id,
      userId: session.user.id,
      role: 'owner',
    });

    // Copy content items
    const userId = session.user.id;
    if (sourceContent.length > 0) {
      const newContentRows = await db
        .insert(content)
        .values(
          sourceContent.map((item) => ({
            userId,
            type: item.type,
            title: item.title,
            body: item.body,
            url: item.url,
            tags: item.tags,
            autoTags: item.autoTags,
            summary: item.summary,
            metadata: item.metadata,
          }))
        )
        .returning({ id: content.id });

      // Link new content to new collection
      await db.insert(contentCollections).values(
        newContentRows.map((row) => ({
          contentId: row.id,
          collectionId: newCollection.id,
        }))
      );
    }

    // Increment clone count atomically
    await db
      .update(marketplaceListings)
      .set({
        cloneCount: sql`${marketplaceListings.cloneCount} + 1`,
      })
      .where(eq(marketplaceListings.id, listingId));

    // Check badge for listing owner (non-blocking)
    checkAndUnlockBadgesAction('clone_received', listing.userId).catch(console.error);

    revalidatePath('/marketplace');
    revalidatePath('/dashboard/library');

    return {
      success: true,
      message: 'Collection cloned to your library',
      collectionId: newCollection.id,
    };
  } catch (error) {
    console.error('Clone collection error:', error);
    return { success: false, message: 'Failed to clone collection' };
  }
}

// Track a marketplace listing view (fire-and-forget)
export async function trackMarketplaceViewAction(
  listingId: string
): Promise<MarketplaceActionResult> {
  try {
    if (!listingId) {
      return { success: false, message: 'Invalid listing ID' };
    }

    await db
      .update(marketplaceListings)
      .set({
        viewCount: sql`${marketplaceListings.viewCount} + 1`,
      })
      .where(eq(marketplaceListings.id, listingId));

    return { success: true, message: 'View tracked' };
  } catch (error) {
    console.error('Track marketplace view error:', error);
    return { success: false, message: 'Failed to track view' };
  }
}

// Get marketplace stats for the current user
export async function getMarketplaceStatsAction(): Promise<MarketplaceStatsResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const userListings = await db
      .select({
        id: marketplaceListings.id,
        collectionName: collections.name,
        viewCount: marketplaceListings.viewCount,
        cloneCount: marketplaceListings.cloneCount,
      })
      .from(marketplaceListings)
      .innerJoin(collections, eq(marketplaceListings.collectionId, collections.id))
      .where(eq(marketplaceListings.userId, session.user.id))
      .orderBy(desc(marketplaceListings.cloneCount));

    const stats = {
      totalListings: userListings.length,
      totalViews: userListings.reduce((sum, l) => sum + l.viewCount, 0),
      totalClones: userListings.reduce((sum, l) => sum + l.cloneCount, 0),
    };

    return {
      success: true,
      stats,
      listings: userListings,
    };
  } catch (error) {
    console.error('Get marketplace stats error:', error);
    return { success: false, message: 'Failed to get marketplace stats' };
  }
}

// Get a single marketplace listing with content preview
export async function getMarketplaceListingAction(
  listingId: string
): Promise<GetMarketplaceListingResult> {
  try {
    if (!listingId) {
      return { success: false, message: 'Invalid listing ID' };
    }

    const [row] = await db
      .select({
        id: marketplaceListings.id,
        collectionId: marketplaceListings.collectionId,
        category: marketplaceListings.category,
        description: marketplaceListings.description,
        isFeatured: marketplaceListings.isFeatured,
        viewCount: marketplaceListings.viewCount,
        cloneCount: marketplaceListings.cloneCount,
        publishedAt: marketplaceListings.publishedAt,
        collectionName: collections.name,
        collectionColor: collections.color,
        collectionDescription: collections.description,
        creatorId: users.id,
        creatorName: users.name,
        creatorUsername: users.username,
        creatorImage: users.image,
      })
      .from(marketplaceListings)
      .innerJoin(collections, eq(marketplaceListings.collectionId, collections.id))
      .innerJoin(users, eq(marketplaceListings.userId, users.id))
      .where(eq(marketplaceListings.id, listingId));

    if (!row) {
      return { success: false, message: 'Listing not found' };
    }

    // Get content count
    const [contentCountResult] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(contentCollections)
      .where(eq(contentCollections.collectionId, row.collectionId));

    // Get content preview (titles only)
    const contentPreview = await db
      .select({
        id: content.id,
        title: content.title,
        type: content.type,
      })
      .from(content)
      .innerJoin(contentCollections, eq(content.id, contentCollections.contentId))
      .where(eq(contentCollections.collectionId, row.collectionId))
      .orderBy(asc(content.title))
      .limit(20);

    // Aggregate tags
    const tagResults = await db
      .select({ tags: content.tags, autoTags: content.autoTags })
      .from(content)
      .innerJoin(contentCollections, eq(content.id, contentCollections.contentId))
      .where(eq(contentCollections.collectionId, row.collectionId));

    const allTags = new Set<string>();
    tagResults.forEach((r) => {
      r.tags.forEach((t) => allTags.add(t));
      r.autoTags.forEach((t) => allTags.add(t));
    });

    return {
      success: true,
      listing: {
        id: row.id,
        collectionId: row.collectionId,
        category: row.category,
        description: row.description,
        isFeatured: row.isFeatured,
        viewCount: row.viewCount,
        cloneCount: row.cloneCount,
        publishedAt: row.publishedAt,
        collection: {
          name: row.collectionName,
          color: row.collectionColor,
          description: row.collectionDescription,
        },
        creator: {
          id: row.creatorId,
          name: row.creatorName,
          username: row.creatorUsername,
          image: row.creatorImage,
        },
        contentCount: contentCountResult?.count || 0,
        tags: Array.from(allTags).slice(0, 10),
        contentPreview,
      },
    };
  } catch (error) {
    console.error('Get marketplace listing error:', error);
    return { success: false, message: 'Failed to get listing' };
  }
}
