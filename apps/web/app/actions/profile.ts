'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { users, collections, contentCollections, content } from '@/lib/db/schema';
import { updateProfileSchema } from '@/lib/validations';
import { eq, and, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { checkServerActionRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

type ActionResult = {
  success: boolean;
  message: string;
  errors?: Partial<Record<string, string[]>>;
};

type ProfileData = {
  id: string;
  name: string | null;
  image: string | null;
  username: string | null;
  bio: string | null;
  isProfilePublic: boolean;
};

type ProfileResult = ActionResult & {
  profile?: ProfileData;
};

export async function getProfile(): Promise<ProfileResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: 'Unauthorized' };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: {
      id: true,
      name: true,
      image: true,
      username: true,
      bio: true,
      isProfilePublic: true,
    },
  });

  if (!user) {
    return { success: false, message: 'User not found' };
  }

  return { success: true, message: 'OK', profile: user };
}

export async function updateProfile(data: {
  username?: string | null;
  bio?: string | null;
  isProfilePublic?: boolean;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: 'Unauthorized' };
  }

  const rateCheck = checkServerActionRateLimit(session.user.id, 'updateProfile', RATE_LIMITS.serverAction);
  if (!rateCheck.success) {
    return { success: false, message: rateCheck.message! };
  }

  const parsed = updateProfileSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Validation failed',
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { username, bio, isProfilePublic } = parsed.data;

  // Check username uniqueness if provided
  if (username) {
    const existing = await db.query.users.findFirst({
      where: and(eq(users.username, username)),
      columns: { id: true },
    });

    if (existing && existing.id !== session.user.id) {
      return {
        success: false,
        message: 'Username is already taken',
        errors: { username: ['Username is already taken'] },
      };
    }
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (username !== undefined) updateData.username = username;
  if (bio !== undefined) updateData.bio = bio;
  if (isProfilePublic !== undefined) updateData.isProfilePublic = isProfilePublic;

  await db.update(users).set(updateData).where(eq(users.id, session.user.id));

  revalidatePath('/dashboard/profile');
  return { success: true, message: 'Profile updated' };
}

type PublicProfileResult = {
  success: boolean;
  message: string;
  profile?: {
    name: string | null;
    image: string | null;
    username: string;
    bio: string | null;
    createdAt: Date;
    publicCollections: {
      id: string;
      name: string;
      description: string | null;
      color: string | null;
      contentCount: number;
    }[];
  };
};

export async function getPublicProfile(username: string): Promise<PublicProfileResult> {
  const user = await db.query.users.findFirst({
    where: and(eq(users.username, username), eq(users.isProfilePublic, true)),
    columns: {
      id: true,
      name: true,
      image: true,
      username: true,
      bio: true,
      createdAt: true,
    },
  });

  if (!user || !user.username) {
    return { success: false, message: 'Profile not found' };
  }

  // Get public collections with content counts
  const publicCollections = await db
    .select({
      id: collections.id,
      name: collections.name,
      description: collections.description,
      color: collections.color,
      contentCount: sql<number>`count(${contentCollections.contentId})::int`,
    })
    .from(collections)
    .leftJoin(contentCollections, eq(collections.id, contentCollections.collectionId))
    .where(and(eq(collections.userId, user.id), eq(collections.isPublic, true)))
    .groupBy(collections.id);

  return {
    success: true,
    message: 'OK',
    profile: {
      name: user.name,
      image: user.image,
      username: user.username,
      bio: user.bio,
      createdAt: user.createdAt,
      publicCollections,
    },
  };
}

type PublicCollectionResult = {
  success: boolean;
  message: string;
  collection?: {
    name: string;
    description: string | null;
    color: string | null;
    ownerName: string | null;
    ownerUsername: string;
    items: {
      id: string;
      type: string;
      title: string;
      body: string | null;
      url: string | null;
      tags: string[];
      createdAt: Date;
    }[];
  };
};

export async function getPublicCollectionContent(
  username: string,
  collectionId: string
): Promise<PublicCollectionResult> {
  // Verify user is public
  const user = await db.query.users.findFirst({
    where: and(eq(users.username, username), eq(users.isProfilePublic, true)),
    columns: { id: true, name: true, username: true },
  });

  if (!user || !user.username) {
    return { success: false, message: 'Profile not found' };
  }

  // Verify collection is public and belongs to user
  const collection = await db.query.collections.findFirst({
    where: and(
      eq(collections.id, collectionId),
      eq(collections.userId, user.id),
      eq(collections.isPublic, true)
    ),
  });

  if (!collection) {
    return { success: false, message: 'Collection not found' };
  }

  // Get shared content in this collection
  const items = await db
    .select({
      id: content.id,
      type: content.type,
      title: content.title,
      body: content.body,
      url: content.url,
      tags: content.tags,
      createdAt: content.createdAt,
    })
    .from(contentCollections)
    .innerJoin(content, eq(contentCollections.contentId, content.id))
    .where(
      and(
        eq(contentCollections.collectionId, collectionId),
        eq(content.isShared, true)
      )
    );

  return {
    success: true,
    message: 'OK',
    collection: {
      name: collection.name,
      description: collection.description,
      color: collection.color,
      ownerName: user.name,
      ownerUsername: user.username,
      items,
    },
  };
}

export async function toggleCollectionPublic(collectionId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: 'Unauthorized' };
  }

  const rateCheck = checkServerActionRateLimit(session.user.id, 'toggleCollectionPublic', RATE_LIMITS.serverAction);
  if (!rateCheck.success) {
    return { success: false, message: rateCheck.message! };
  }

  const collection = await db.query.collections.findFirst({
    where: and(eq(collections.id, collectionId), eq(collections.userId, session.user.id)),
  });

  if (!collection) {
    return { success: false, message: 'Collection not found' };
  }

  await db
    .update(collections)
    .set({ isPublic: !collection.isPublic, updatedAt: new Date() })
    .where(eq(collections.id, collectionId));

  revalidatePath('/dashboard/library');
  return {
    success: true,
    message: collection.isPublic ? 'Collection is now private' : 'Collection is now public',
  };
}
