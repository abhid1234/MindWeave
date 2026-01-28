import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getProfile,
  updateProfile,
  getPublicProfile,
  getPublicCollectionContent,
  toggleCollectionPublic,
} from './profile';

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db/schema', () => ({
  users: { id: 'id', username: 'username', isProfilePublic: 'is_profile_public' },
  collections: { id: 'id', userId: 'user_id', isPublic: 'is_public' },
  contentCollections: { contentId: 'content_id', collectionId: 'collection_id' },
  content: { id: 'id', isShared: 'is_shared' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: unknown[]) => args),
  and: vi.fn((...args: unknown[]) => args),
  sql: vi.fn(),
}));

vi.mock('@/lib/validations', () => ({
  updateProfileSchema: {
    safeParse: vi.fn((data: Record<string, unknown>) => {
      if (data.username && typeof data.username === 'string') {
        if (data.username.length < 3) {
          return { success: false, error: { flatten: () => ({ fieldErrors: { username: ['Username must be at least 3 characters'] } }) } };
        }
        if (!/^[a-z0-9_-]+$/.test(data.username)) {
          return { success: false, error: { flatten: () => ({ fieldErrors: { username: ['Invalid format'] } }) } };
        }
      }
      return { success: true, data };
    }),
  },
}));

vi.mock('@/lib/db/client', () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn(),
      },
      collections: {
        findFirst: vi.fn(),
      },
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        leftJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            groupBy: vi.fn(() => []),
          })),
        })),
        innerJoin: vi.fn(() => ({
          where: vi.fn(() => []),
        })),
        where: vi.fn(() => []),
      })),
    })),
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';

describe('Profile Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProfile', () => {
    it('returns unauthorized when not logged in', async () => {
      vi.mocked(auth).mockResolvedValue(null as never);
      const result = await getProfile();
      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
    });

    it('returns profile for authenticated user', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never);
      vi.mocked(db.query.users.findFirst).mockResolvedValue({
        id: 'user-1',
        name: 'Test',
        image: null,
        username: 'testuser',
        bio: 'Hello',
        isProfilePublic: true,
      } as never);

      const result = await getProfile();
      expect(result.success).toBe(true);
      expect(result.profile?.username).toBe('testuser');
    });
  });

  describe('updateProfile', () => {
    it('returns unauthorized when not logged in', async () => {
      vi.mocked(auth).mockResolvedValue(null as never);
      const result = await updateProfile({ username: 'test' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid username format', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never);
      const result = await updateProfile({ username: 'INVALID!' });
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('rejects username too short', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never);
      const result = await updateProfile({ username: 'ab' });
      expect(result.success).toBe(false);
    });

    it('checks username uniqueness', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never);
      vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: 'user-2' } as never);

      const result = await updateProfile({ username: 'taken' });
      expect(result.success).toBe(false);
      expect(result.message).toBe('Username is already taken');
    });

    it('updates profile successfully', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never);
      vi.mocked(db.query.users.findFirst).mockResolvedValue(null as never);

      const result = await updateProfile({
        username: 'newuser',
        bio: 'My bio',
        isProfilePublic: true,
      });
      expect(result.success).toBe(true);
      expect(db.update).toHaveBeenCalled();
    });
  });

  describe('getPublicProfile', () => {
    it('returns not found for non-existent user', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue(null as never);
      const result = await getPublicProfile('nobody');
      expect(result.success).toBe(false);
    });

    it('returns public profile with collections', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue({
        id: 'user-1',
        name: 'Test',
        image: null,
        username: 'testuser',
        bio: 'Hello',
        createdAt: new Date(),
      } as never);

      const result = await getPublicProfile('testuser');
      expect(result.success).toBe(true);
      expect(result.profile?.username).toBe('testuser');
    });
  });

  describe('getPublicCollectionContent', () => {
    it('returns not found for non-existent user', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue(null as never);
      const result = await getPublicCollectionContent('nobody', 'col-1');
      expect(result.success).toBe(false);
    });

    it('returns not found for non-public collection', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue({
        id: 'user-1',
        name: 'Test',
        username: 'testuser',
      } as never);
      vi.mocked(db.query.collections.findFirst).mockResolvedValue(null as never);

      const result = await getPublicCollectionContent('testuser', 'col-1');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Collection not found');
    });
  });

  describe('toggleCollectionPublic', () => {
    it('returns unauthorized when not logged in', async () => {
      vi.mocked(auth).mockResolvedValue(null as never);
      const result = await toggleCollectionPublic('col-1');
      expect(result.success).toBe(false);
    });

    it('returns not found for non-existent collection', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never);
      vi.mocked(db.query.collections.findFirst).mockResolvedValue(null as never);

      const result = await toggleCollectionPublic('col-1');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Collection not found');
    });

    it('toggles collection public status', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never);
      vi.mocked(db.query.collections.findFirst).mockResolvedValue({
        id: 'col-1',
        isPublic: false,
      } as never);

      const result = await toggleCollectionPublic('col-1');
      expect(result.success).toBe(true);
      expect(result.message).toBe('Collection is now public');
      expect(db.update).toHaveBeenCalled();
    });
  });
});
