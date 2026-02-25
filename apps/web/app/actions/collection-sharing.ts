'use server';

import crypto from 'crypto';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { collections, collectionMembers, collectionInvitations, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { checkServerActionRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import {
  inviteToCollectionSchema,
  updateMemberRoleSchema,
  removeMemberSchema,
} from '@/lib/validations';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

type ActionResult = {
  success: boolean;
  message: string;
};

/**
 * Check a user's access level for a collection.
 * Returns 'owner' | 'editor' | 'viewer' | null
 */
export async function checkCollectionAccess(
  collectionId: string,
  userId: string
): Promise<'owner' | 'editor' | 'viewer' | null> {
  // Check if user is the canonical owner
  const [collection] = await db
    .select({ userId: collections.userId })
    .from(collections)
    .where(eq(collections.id, collectionId));

  if (!collection) return null;

  if (collection.userId === userId) {
    return 'owner';
  }

  // Check membership
  const [membership] = await db
    .select({ role: collectionMembers.role })
    .from(collectionMembers)
    .where(
      and(
        eq(collectionMembers.collectionId, collectionId),
        eq(collectionMembers.userId, userId)
      )
    );

  if (membership) {
    return membership.role as 'owner' | 'editor' | 'viewer';
  }

  return null;
}

/**
 * Invite a user to a collection by email.
 */
export async function inviteToCollectionAction(
  params: z.infer<typeof inviteToCollectionSchema>
): Promise<ActionResult & { token?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const rateCheck = checkServerActionRateLimit(session.user.id, 'inviteToCollection', RATE_LIMITS.serverAction);
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    const validated = inviteToCollectionSchema.parse(params);

    // Verify the user is the owner
    const access = await checkCollectionAccess(validated.collectionId, session.user.id);
    if (access !== 'owner') {
      return { success: false, message: 'Only the collection owner can invite members' };
    }

    // Don't allow self-invite
    if (session.user.email === validated.email) {
      return { success: false, message: 'You cannot invite yourself' };
    }

    // Check for existing pending invitation
    const [existingInvite] = await db
      .select({ id: collectionInvitations.id })
      .from(collectionInvitations)
      .where(
        and(
          eq(collectionInvitations.collectionId, validated.collectionId),
          eq(collectionInvitations.email, validated.email),
          eq(collectionInvitations.status, 'pending')
        )
      );

    if (existingInvite) {
      return { success: false, message: 'An invitation has already been sent to this email' };
    }

    // Check if user is already a member
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, validated.email));

    if (existingUser) {
      const [existingMember] = await db
        .select({ userId: collectionMembers.userId })
        .from(collectionMembers)
        .where(
          and(
            eq(collectionMembers.collectionId, validated.collectionId),
            eq(collectionMembers.userId, existingUser.id)
          )
        );

      if (existingMember) {
        return { success: false, message: 'This user is already a member' };
      }
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.insert(collectionInvitations).values({
      collectionId: validated.collectionId,
      email: validated.email,
      role: validated.role,
      token,
      invitedBy: session.user.id,
      expiresAt,
    });

    revalidatePath('/dashboard/library');
    return { success: true, message: 'Invitation sent', token };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.error('Invite to collection error:', error);
    return { success: false, message: 'Failed to send invitation' };
  }
}

/**
 * Accept a collection invitation by token.
 */
export async function acceptInvitationAction(token: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return { success: false, message: 'Unauthorized' };
    }

    const rateCheck = checkServerActionRateLimit(session.user.id, 'acceptInvitation', RATE_LIMITS.serverAction);
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    // Find the invitation
    const [invitation] = await db
      .select()
      .from(collectionInvitations)
      .where(
        and(
          eq(collectionInvitations.token, token),
          eq(collectionInvitations.status, 'pending')
        )
      );

    if (!invitation) {
      return { success: false, message: 'Invitation not found or already used' };
    }

    // Check expiry
    if (new Date(invitation.expiresAt) < new Date()) {
      return { success: false, message: 'Invitation has expired' };
    }

    // Verify email matches
    if (invitation.email !== session.user.email) {
      return { success: false, message: 'This invitation was sent to a different email address' };
    }

    // Insert member
    await db.insert(collectionMembers).values({
      collectionId: invitation.collectionId,
      userId: session.user.id,
      role: invitation.role,
    });

    // Mark invitation as accepted
    await db
      .update(collectionInvitations)
      .set({ status: 'accepted' })
      .where(eq(collectionInvitations.id, invitation.id));

    revalidatePath('/dashboard/library');
    return { success: true, message: 'You have joined the collection' };
  } catch (error) {
    console.error('Accept invitation error:', error);
    return { success: false, message: 'Failed to accept invitation' };
  }
}

/**
 * Get all members and pending invitations for a collection.
 */
export async function getCollectionMembersAction(
  collectionId: string
): Promise<{
  success: boolean;
  members: Array<{
    userId: string;
    name: string | null;
    email: string;
    role: string;
    joinedAt: Date;
  }>;
  invitations: Array<{
    id: string;
    email: string;
    role: string;
    status: string;
    createdAt: Date;
  }>;
  message?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, members: [], invitations: [], message: 'Unauthorized' };
    }

    const rateCheck = checkServerActionRateLimit(session.user.id, 'getCollectionMembers', RATE_LIMITS.serverAction);
    if (!rateCheck.success) {
      return { success: false, members: [], invitations: [], message: rateCheck.message! };
    }

    // Need owner or editor access
    const access = await checkCollectionAccess(collectionId, session.user.id);
    if (!access || access === 'viewer') {
      return { success: false, members: [], invitations: [], message: 'Access denied' };
    }

    const members = await db
      .select({
        userId: collectionMembers.userId,
        name: users.name,
        email: users.email,
        role: collectionMembers.role,
        joinedAt: collectionMembers.joinedAt,
      })
      .from(collectionMembers)
      .innerJoin(users, eq(collectionMembers.userId, users.id))
      .where(eq(collectionMembers.collectionId, collectionId));

    // Also include the canonical owner if they're not in the members table
    const [collection] = await db
      .select({ userId: collections.userId })
      .from(collections)
      .where(eq(collections.id, collectionId));

    const ownerInMembers = members.some((m) => m.userId === collection?.userId);

    let allMembers = members;
    if (collection && !ownerInMembers) {
      const [owner] = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, collection.userId));

      if (owner) {
        allMembers = [
          {
            userId: collection.userId,
            name: owner.name,
            email: owner.email,
            role: 'owner',
            joinedAt: new Date(),
          },
          ...members,
        ];
      }
    }

    const invitations = await db
      .select({
        id: collectionInvitations.id,
        email: collectionInvitations.email,
        role: collectionInvitations.role,
        status: collectionInvitations.status,
        createdAt: collectionInvitations.createdAt,
      })
      .from(collectionInvitations)
      .where(
        and(
          eq(collectionInvitations.collectionId, collectionId),
          eq(collectionInvitations.status, 'pending')
        )
      );

    return { success: true, members: allMembers, invitations };
  } catch (error) {
    console.error('Get collection members error:', error);
    return { success: false, members: [], invitations: [], message: 'Failed to fetch members' };
  }
}

/**
 * Remove a member from a collection.
 */
export async function removeMemberAction(
  params: z.infer<typeof removeMemberSchema>
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const rateCheck = checkServerActionRateLimit(session.user.id, 'removeMember', RATE_LIMITS.serverAction);
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    const validated = removeMemberSchema.parse(params);

    // Must be owner
    const access = await checkCollectionAccess(validated.collectionId, session.user.id);
    if (access !== 'owner') {
      return { success: false, message: 'Only the collection owner can remove members' };
    }

    // Cannot remove self
    if (validated.userId === session.user.id) {
      return { success: false, message: 'Cannot remove yourself from your own collection' };
    }

    await db
      .delete(collectionMembers)
      .where(
        and(
          eq(collectionMembers.collectionId, validated.collectionId),
          eq(collectionMembers.userId, validated.userId)
        )
      );

    revalidatePath('/dashboard/library');
    return { success: true, message: 'Member removed' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.error('Remove member error:', error);
    return { success: false, message: 'Failed to remove member' };
  }
}

/**
 * Update a member's role in a collection.
 */
export async function updateMemberRoleAction(
  params: z.infer<typeof updateMemberRoleSchema>
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const rateCheck = checkServerActionRateLimit(session.user.id, 'updateMemberRole', RATE_LIMITS.serverAction);
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    const validated = updateMemberRoleSchema.parse(params);

    // Must be owner
    const access = await checkCollectionAccess(validated.collectionId, session.user.id);
    if (access !== 'owner') {
      return { success: false, message: 'Only the collection owner can change roles' };
    }

    // Cannot change own role
    if (validated.userId === session.user.id) {
      return { success: false, message: 'Cannot change your own role' };
    }

    await db
      .update(collectionMembers)
      .set({ role: validated.role })
      .where(
        and(
          eq(collectionMembers.collectionId, validated.collectionId),
          eq(collectionMembers.userId, validated.userId)
        )
      );

    revalidatePath('/dashboard/library');
    return { success: true, message: 'Role updated' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.error('Update member role error:', error);
    return { success: false, message: 'Failed to update role' };
  }
}

/**
 * Revoke a pending invitation.
 */
export async function revokeInvitationAction(invitationId: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const rateCheck = checkServerActionRateLimit(session.user.id, 'revokeInvitation', RATE_LIMITS.serverAction);
    if (!rateCheck.success) {
      return { success: false, message: rateCheck.message! };
    }

    // Find invitation and verify ownership
    const [invitation] = await db
      .select({
        id: collectionInvitations.id,
        collectionId: collectionInvitations.collectionId,
      })
      .from(collectionInvitations)
      .where(eq(collectionInvitations.id, invitationId));

    if (!invitation) {
      return { success: false, message: 'Invitation not found' };
    }

    const access = await checkCollectionAccess(invitation.collectionId, session.user.id);
    if (access !== 'owner') {
      return { success: false, message: 'Only the collection owner can revoke invitations' };
    }

    await db
      .update(collectionInvitations)
      .set({ status: 'declined' })
      .where(eq(collectionInvitations.id, invitationId));

    revalidatePath('/dashboard/library');
    return { success: true, message: 'Invitation revoked' };
  } catch (error) {
    console.error('Revoke invitation error:', error);
    return { success: false, message: 'Failed to revoke invitation' };
  }
}

/**
 * Get pending invitations for the current user.
 */
export async function getPendingInvitationsAction(): Promise<{
  success: boolean;
  invitations: Array<{
    id: string;
    collectionName: string;
    inviterName: string | null;
    role: string;
    token: string;
    createdAt: Date;
  }>;
  message?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return { success: false, invitations: [], message: 'Unauthorized' };
    }

    const invitations = await db
      .select({
        id: collectionInvitations.id,
        collectionName: collections.name,
        inviterName: users.name,
        role: collectionInvitations.role,
        token: collectionInvitations.token,
        createdAt: collectionInvitations.createdAt,
      })
      .from(collectionInvitations)
      .innerJoin(collections, eq(collectionInvitations.collectionId, collections.id))
      .innerJoin(users, eq(collectionInvitations.invitedBy, users.id))
      .where(
        and(
          eq(collectionInvitations.email, session.user.email),
          eq(collectionInvitations.status, 'pending')
        )
      );

    return { success: true, invitations };
  } catch (error) {
    console.error('Get pending invitations error:', error);
    return { success: false, invitations: [], message: 'Failed to fetch invitations' };
  }
}
