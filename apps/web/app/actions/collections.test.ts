import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createCollectionAction,
  getCollectionsAction,
  updateCollectionAction,
  deleteCollectionAction,
  addToCollectionAction,
  removeFromCollectionAction,
  bulkAddToCollectionAction,
  getContentCollectionsAction,
} from './collections';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock database - simplified mock
vi.mock('@/lib/db/client', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(),
      })),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(),
          limit: vi.fn(),
        })),
        orderBy: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(),
    })),
  },
}));

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { revalidatePath } from 'next/cache';

describe('Collection Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCollectionAction', () => {
    it('should return unauthorized when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const result = await createCollectionAction({ name: 'Test Collection' });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
    });

    it('should return error for invalid name', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '',
      } as never);

      const result = await createCollectionAction({ name: '' });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Name is required');
    });

    it('should return error for invalid color format', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '',
      } as never);

      const result = await createCollectionAction({
        name: 'Test Collection',
        color: 'invalid'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid color format');
    });

    it('should create collection with valid data', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '',
      } as never);

      const mockCollection = {
        id: 'collection-1',
        name: 'Test Collection',
        description: 'Test description',
        color: '#FF5733',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockReturning = vi.fn().mockResolvedValue([mockCollection]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      vi.mocked(db.insert).mockReturnValue({ values: mockValues } as never);

      const result = await createCollectionAction({
        name: 'Test Collection',
        description: 'Test description',
        color: '#FF5733',
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Collection created successfully');
      expect(result.collection).toEqual(mockCollection);
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/library');
    });
  });

  describe('getCollectionsAction', () => {
    it('should return empty array when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const result = await getCollectionsAction();

      expect(result.success).toBe(false);
      expect(result.collections).toEqual([]);
      expect(result.message).toBe('Unauthorized');
    });
  });

  describe('deleteCollectionAction', () => {
    it('should return unauthorized when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const result = await deleteCollectionAction('collection-1');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
    });
  });

  describe('addToCollectionAction', () => {
    it('should return unauthorized when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const result = await addToCollectionAction('content-1', 'collection-1');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
    });
  });

  describe('removeFromCollectionAction', () => {
    it('should return unauthorized when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const result = await removeFromCollectionAction('content-1', 'collection-1');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
    });
  });

  describe('getContentCollectionsAction', () => {
    it('should return empty array when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const result = await getContentCollectionsAction('content-1');

      expect(result.success).toBe(false);
      expect(result.collectionIds).toEqual([]);
      expect(result.message).toBe('Unauthorized');
    });
  });

  describe('bulkAddToCollectionAction', () => {
    it('should return unauthorized when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const result = await bulkAddToCollectionAction(['content-1', 'content-2'], 'collection-1');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
    });
  });

  describe('updateCollectionAction', () => {
    it('should return unauthorized when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const result = await updateCollectionAction('collection-1', { name: 'Updated' });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
    });
  });
});
