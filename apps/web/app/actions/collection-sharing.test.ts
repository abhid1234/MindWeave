import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockAuth, mockDbSelect, mockDbInsert, mockDbUpdate, mockDbDelete } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDbSelect: vi.fn(),
  mockDbInsert: vi.fn(),
  mockDbUpdate: vi.fn(),
  mockDbDelete: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

vi.mock('@/lib/db/client', () => {
  const makeChain = () => {
    const chain: Record<string, unknown> = {};
    chain.from = vi.fn(() => chain);
    chain.where = vi.fn(() => chain);
    chain.orderBy = vi.fn(() => chain);
    chain.limit = vi.fn(() => mockDbSelect());
    chain.innerJoin = vi.fn(() => chain);
    chain.then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) =>
      Promise.resolve(mockDbSelect()).then(resolve, reject);
    return chain;
  };

  return {
    db: {
      select: () => makeChain(),
      insert: () => ({
        values: vi.fn(() => ({
          returning: vi.fn(() => mockDbInsert()),
          then: (resolve: (v: unknown) => void, reject?: (e: unknown) => void) =>
            Promise.resolve(mockDbInsert()).then(resolve, reject),
        })),
      }),
      update: () => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            then: (resolve: (v: unknown) => void, reject?: (e: unknown) => void) =>
              Promise.resolve(mockDbUpdate()).then(resolve, reject),
          })),
        })),
      }),
      delete: () => ({
        where: vi.fn(() => ({
          then: (resolve: (v: unknown) => void, reject?: (e: unknown) => void) =>
            Promise.resolve(mockDbDelete()).then(resolve, reject),
        })),
      }),
    },
  };
});

vi.mock('@/lib/db/schema', () => ({
  collections: {
    id: 'id',
    userId: 'userId',
    name: 'name',
  },
  collectionMembers: {
    collectionId: 'collectionId',
    userId: 'userId',
    role: 'role',
    joinedAt: 'joinedAt',
  },
  collectionInvitations: {
    id: 'id',
    collectionId: 'collectionId',
    email: 'email',
    role: 'role',
    token: 'token',
    status: 'status',
    invitedBy: 'invitedBy',
    expiresAt: 'expiresAt',
    createdAt: 'createdAt',
  },
  users: {
    id: 'id',
    name: 'name',
    email: 'email',
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  checkServerActionRateLimit: () => ({ success: true }),
  RATE_LIMITS: {
    serverAction: { maxRequests: 30, windowMs: 60000 },
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: unknown[]) => ({ op: 'eq', args })),
  and: vi.fn((...args: unknown[]) => ({ op: 'and', args })),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('crypto', () => ({
  default: {
    randomBytes: vi.fn(() => ({ toString: () => 'mock-token-hex' })),
  },
}));

import {
  checkCollectionAccess,
  inviteToCollectionAction,
  acceptInvitationAction,
  removeMemberAction,
  updateMemberRoleAction,
  revokeInvitationAction,
  getPendingInvitationsAction,
} from './collection-sharing';

const VALID_UUID = '00000000-0000-0000-0000-000000000001';
const VALID_UUID_2 = '00000000-0000-0000-0000-000000000002';

describe('Collection Sharing Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ── checkCollectionAccess ─────────────────────────────────────────

  describe('checkCollectionAccess', () => {
    it('should return owner when user is collection owner', async () => {
      // First select: collection found, userId matches
      mockDbSelect.mockResolvedValueOnce([{ userId: 'user-1' }]);

      const result = await checkCollectionAccess(VALID_UUID, 'user-1');

      expect(result).toBe('owner');
    });

    it('should return editor when user is a member with editor role', async () => {
      // First select: collection found, userId does NOT match
      mockDbSelect.mockResolvedValueOnce([{ userId: 'other-user' }]);
      // Second select: membership found with editor role
      mockDbSelect.mockResolvedValueOnce([{ role: 'editor' }]);

      const result = await checkCollectionAccess(VALID_UUID, 'user-1');

      expect(result).toBe('editor');
    });

    it('should return viewer when user is a member with viewer role', async () => {
      // First select: collection found, userId does NOT match
      mockDbSelect.mockResolvedValueOnce([{ userId: 'other-user' }]);
      // Second select: membership found with viewer role
      mockDbSelect.mockResolvedValueOnce([{ role: 'viewer' }]);

      const result = await checkCollectionAccess(VALID_UUID, 'user-1');

      expect(result).toBe('viewer');
    });

    it('should return null when user has no access', async () => {
      // First select: collection found, userId does NOT match
      mockDbSelect.mockResolvedValueOnce([{ userId: 'other-user' }]);
      // Second select: no membership
      mockDbSelect.mockResolvedValueOnce([]);

      const result = await checkCollectionAccess(VALID_UUID, 'user-1');

      expect(result).toBeNull();
    });
  });

  // ── inviteToCollectionAction ──────────────────────────────────────

  describe('inviteToCollectionAction', () => {
    it('should return unauthorized when not logged in', async () => {
      mockAuth.mockResolvedValueOnce(null);

      const result = await inviteToCollectionAction({
        collectionId: VALID_UUID,
        email: 'invite@example.com',
        role: 'editor',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
    });

    it('should return error when user is not the owner', async () => {
      // checkCollectionAccess: collection found but owned by someone else
      mockDbSelect.mockResolvedValueOnce([{ userId: 'other-user' }]);
      // checkCollectionAccess: no membership
      mockDbSelect.mockResolvedValueOnce([]);

      const result = await inviteToCollectionAction({
        collectionId: VALID_UUID,
        email: 'invite@example.com',
        role: 'editor',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Only the collection owner can invite members');
    });

    it('should return error when trying to invite self', async () => {
      // checkCollectionAccess: user is owner
      mockDbSelect.mockResolvedValueOnce([{ userId: 'user-1' }]);

      const result = await inviteToCollectionAction({
        collectionId: VALID_UUID,
        email: 'test@example.com', // same as session user
        role: 'editor',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('You cannot invite yourself');
    });

    it('should return error when invitation already exists (pending)', async () => {
      // checkCollectionAccess: user is owner
      mockDbSelect.mockResolvedValueOnce([{ userId: 'user-1' }]);
      // Existing pending invitation found
      mockDbSelect.mockResolvedValueOnce([{ id: 'inv-existing' }]);

      const result = await inviteToCollectionAction({
        collectionId: VALID_UUID,
        email: 'invite@example.com',
        role: 'viewer',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('An invitation has already been sent to this email');
    });

    it('should return error when user is already a member', async () => {
      // checkCollectionAccess: user is owner
      mockDbSelect.mockResolvedValueOnce([{ userId: 'user-1' }]);
      // No pending invitation
      mockDbSelect.mockResolvedValueOnce([]);
      // User exists
      mockDbSelect.mockResolvedValueOnce([{ id: 'existing-user-id' }]);
      // User is already a member
      mockDbSelect.mockResolvedValueOnce([{ userId: 'existing-user-id' }]);

      const result = await inviteToCollectionAction({
        collectionId: VALID_UUID,
        email: 'invite@example.com',
        role: 'editor',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('This user is already a member');
    });

    it('should successfully create invitation with token', async () => {
      // checkCollectionAccess: user is owner
      mockDbSelect.mockResolvedValueOnce([{ userId: 'user-1' }]);
      // No pending invitation
      mockDbSelect.mockResolvedValueOnce([]);
      // User does not exist yet
      mockDbSelect.mockResolvedValueOnce([]);
      // Insert invitation succeeds
      mockDbInsert.mockResolvedValueOnce(undefined);

      const result = await inviteToCollectionAction({
        collectionId: VALID_UUID,
        email: 'invite@example.com',
        role: 'editor',
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Invitation sent');
      expect(result.token).toBe('mock-token-hex');
    });
  });

  // ── acceptInvitationAction ────────────────────────────────────────

  describe('acceptInvitationAction', () => {
    it('should return unauthorized when not logged in', async () => {
      mockAuth.mockResolvedValueOnce(null);

      const result = await acceptInvitationAction('some-token');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
    });

    it('should return error for invalid or used token', async () => {
      // No invitation found
      mockDbSelect.mockResolvedValueOnce([]);

      const result = await acceptInvitationAction('invalid-token');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invitation not found or already used');
    });

    it('should return error for expired invitation', async () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
      mockDbSelect.mockResolvedValueOnce([{
        id: 'inv-1',
        collectionId: VALID_UUID,
        email: 'test@example.com',
        role: 'editor',
        token: 'some-token',
        status: 'pending',
        expiresAt: pastDate,
      }]);

      const result = await acceptInvitationAction('some-token');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invitation has expired');
    });

    it('should return error when email does not match', async () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24); // 1 day from now
      mockDbSelect.mockResolvedValueOnce([{
        id: 'inv-1',
        collectionId: VALID_UUID,
        email: 'other@example.com', // different from session user
        role: 'editor',
        token: 'some-token',
        status: 'pending',
        expiresAt: futureDate,
      }]);

      const result = await acceptInvitationAction('some-token');

      expect(result.success).toBe(false);
      expect(result.message).toBe('This invitation was sent to a different email address');
    });

    it('should successfully accept invitation', async () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24);
      // Find invitation
      mockDbSelect.mockResolvedValueOnce([{
        id: 'inv-1',
        collectionId: VALID_UUID,
        email: 'test@example.com',
        role: 'editor',
        token: 'valid-token',
        status: 'pending',
        expiresAt: futureDate,
      }]);
      // Insert member
      mockDbInsert.mockResolvedValueOnce(undefined);
      // Update invitation status
      mockDbUpdate.mockResolvedValueOnce(undefined);

      const result = await acceptInvitationAction('valid-token');

      expect(result.success).toBe(true);
      expect(result.message).toBe('You have joined the collection');
    });
  });

  // ── removeMemberAction ────────────────────────────────────────────

  describe('removeMemberAction', () => {
    it('should return error when not owner', async () => {
      // checkCollectionAccess: collection found, owned by someone else
      mockDbSelect.mockResolvedValueOnce([{ userId: 'other-user' }]);
      // checkCollectionAccess: user is editor
      mockDbSelect.mockResolvedValueOnce([{ role: 'editor' }]);

      const result = await removeMemberAction({
        collectionId: VALID_UUID,
        userId: VALID_UUID_2,
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Only the collection owner can remove members');
    });

    it('should return error when trying to remove self', async () => {
      // Set session user ID to a valid UUID so Zod validation passes
      mockAuth.mockResolvedValueOnce({
        user: { id: VALID_UUID, email: 'test@example.com' },
      });
      // checkCollectionAccess: user is owner
      mockDbSelect.mockResolvedValueOnce([{ userId: VALID_UUID }]);

      const result = await removeMemberAction({
        collectionId: VALID_UUID,
        userId: VALID_UUID, // same as session user
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Cannot remove yourself from your own collection');
    });

    it('should successfully remove member', async () => {
      // checkCollectionAccess: user is owner
      mockDbSelect.mockResolvedValueOnce([{ userId: 'user-1' }]);
      // Delete succeeds
      mockDbDelete.mockResolvedValueOnce(undefined);

      const result = await removeMemberAction({
        collectionId: VALID_UUID,
        userId: VALID_UUID_2,
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Member removed');
    });
  });

  // ── updateMemberRoleAction ────────────────────────────────────────

  describe('updateMemberRoleAction', () => {
    it('should return error when not owner', async () => {
      // checkCollectionAccess: collection found, owned by someone else
      mockDbSelect.mockResolvedValueOnce([{ userId: 'other-user' }]);
      // checkCollectionAccess: user is viewer
      mockDbSelect.mockResolvedValueOnce([{ role: 'viewer' }]);

      const result = await updateMemberRoleAction({
        collectionId: VALID_UUID,
        userId: VALID_UUID_2,
        role: 'editor',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Only the collection owner can change roles');
    });

    it('should return error when trying to change own role', async () => {
      // Set session user ID to a valid UUID so Zod validation passes
      mockAuth.mockResolvedValueOnce({
        user: { id: VALID_UUID, email: 'test@example.com' },
      });
      // checkCollectionAccess: user is owner
      mockDbSelect.mockResolvedValueOnce([{ userId: VALID_UUID }]);

      const result = await updateMemberRoleAction({
        collectionId: VALID_UUID,
        userId: VALID_UUID, // same as session user
        role: 'viewer',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Cannot change your own role');
    });

    it('should successfully update role', async () => {
      // checkCollectionAccess: user is owner
      mockDbSelect.mockResolvedValueOnce([{ userId: 'user-1' }]);
      // Update succeeds
      mockDbUpdate.mockResolvedValueOnce(undefined);

      const result = await updateMemberRoleAction({
        collectionId: VALID_UUID,
        userId: VALID_UUID_2,
        role: 'editor',
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Role updated');
    });
  });

  // ── revokeInvitationAction ────────────────────────────────────────

  describe('revokeInvitationAction', () => {
    it('should return error when not owner', async () => {
      // Find invitation
      mockDbSelect.mockResolvedValueOnce([{ id: 'inv-1', collectionId: VALID_UUID }]);
      // checkCollectionAccess: collection found, owned by someone else
      mockDbSelect.mockResolvedValueOnce([{ userId: 'other-user' }]);
      // checkCollectionAccess: user is editor, not owner
      mockDbSelect.mockResolvedValueOnce([{ role: 'editor' }]);

      const result = await revokeInvitationAction('inv-1');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Only the collection owner can revoke invitations');
    });

    it('should successfully revoke invitation', async () => {
      // Find invitation
      mockDbSelect.mockResolvedValueOnce([{ id: 'inv-1', collectionId: VALID_UUID }]);
      // checkCollectionAccess: user is owner
      mockDbSelect.mockResolvedValueOnce([{ userId: 'user-1' }]);
      // Update invitation status
      mockDbUpdate.mockResolvedValueOnce(undefined);

      const result = await revokeInvitationAction('inv-1');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Invitation revoked');
    });
  });

  // ── getPendingInvitationsAction ───────────────────────────────────

  describe('getPendingInvitationsAction', () => {
    it('should return unauthorized when not logged in', async () => {
      mockAuth.mockResolvedValueOnce(null);

      const result = await getPendingInvitationsAction();

      expect(result.success).toBe(false);
      expect(result.invitations).toEqual([]);
      expect(result.message).toBe('Unauthorized');
    });

    it('should return pending invitations', async () => {
      const now = new Date();
      const mockInvitations = [
        {
          id: 'inv-1',
          collectionName: 'My Collection',
          inviterName: 'John Doe',
          role: 'editor',
          token: 'token-1',
          createdAt: now,
        },
      ];
      mockDbSelect.mockResolvedValueOnce(mockInvitations);

      const result = await getPendingInvitationsAction();

      expect(result.success).toBe(true);
      expect(result.invitations).toHaveLength(1);
      expect(result.invitations[0].collectionName).toBe('My Collection');
      expect(result.invitations[0].role).toBe('editor');
    });
  });
});
