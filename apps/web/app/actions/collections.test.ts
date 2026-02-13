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

    it('should return collections when authenticated', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '',
      } as never);

      const mockCollections = [{ id: 'c1', name: 'Col1', description: null, color: null, createdAt: new Date(), updatedAt: new Date(), contentCount: 3 }];
      const mockOrderBy = vi.fn().mockResolvedValue(mockCollections);
      const mockGroupBy = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockWhere = vi.fn().mockReturnValue({ groupBy: mockGroupBy });
      const mockLeftJoin = vi.fn().mockReturnValue({ where: mockWhere });
      const mockFrom = vi.fn().mockReturnValue({ leftJoin: mockLeftJoin });
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as never);

      const result = await getCollectionsAction();
      expect(result.success).toBe(true);
      expect(result.collections).toHaveLength(1);
    });

    it('should handle database error', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '',
      } as never);

      vi.mocked(db.select).mockImplementation(() => { throw new Error('DB error'); });

      const result = await getCollectionsAction();
      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed');
    });
  });

  describe('deleteCollectionAction', () => {
    it('should return unauthorized when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const result = await deleteCollectionAction('collection-1');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
    });

    it('should return not found for non-existent collection', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '',
      } as never);

      const mockWhere = vi.fn().mockResolvedValue([]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as never);

      const result = await deleteCollectionAction('nonexistent');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Collection not found');
    });

    it('should delete collection successfully', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '',
      } as never);

      const mockWhere = vi.fn().mockResolvedValue([{ id: 'col-1', userId: 'user-1' }]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as never);
      vi.mocked(db.delete).mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) } as never);

      const result = await deleteCollectionAction('col-1');
      expect(result.success).toBe(true);
    });
  });

  describe('addToCollectionAction', () => {
    it('should return unauthorized when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const result = await addToCollectionAction('content-1', 'collection-1');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
    });

    it('should return not found for non-existent collection', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '',
      } as never);

      const mockWhere = vi.fn().mockResolvedValue([]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as never);

      const result = await addToCollectionAction('c1', 'nonexistent');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Collection not found');
    });

    it('should return error if already in collection', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '',
      } as never);

      // First call: collection ownership check
      // Second call: check existing membership
      const mockWhere = vi.fn()
        .mockResolvedValueOnce([{ id: 'col-1' }])
        .mockResolvedValueOnce([{ contentId: 'c1', collectionId: 'col-1' }]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as never);

      const result = await addToCollectionAction('c1', 'col-1');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Content already in collection');
    });

    it('should add to collection successfully', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '',
      } as never);

      const mockWhere = vi.fn()
        .mockResolvedValueOnce([{ id: 'col-1' }])
        .mockResolvedValueOnce([]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as never);

      const mockValues = vi.fn().mockResolvedValue(undefined);
      vi.mocked(db.insert).mockReturnValue({ values: mockValues } as never);

      const result = await addToCollectionAction('c1', 'col-1');
      expect(result.success).toBe(true);
    });
  });

  describe('removeFromCollectionAction', () => {
    it('should return unauthorized when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const result = await removeFromCollectionAction('content-1', 'collection-1');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
    });

    it('should return not found for non-existent collection', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '',
      } as never);

      const mockWhere = vi.fn().mockResolvedValue([]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as never);

      const result = await removeFromCollectionAction('c1', 'nonexistent');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Collection not found');
    });

    it('should remove from collection successfully', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '',
      } as never);

      const mockWhere = vi.fn().mockResolvedValue([{ id: 'col-1' }]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as never);
      vi.mocked(db.delete).mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) } as never);

      const result = await removeFromCollectionAction('c1', 'col-1');
      expect(result.success).toBe(true);
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

    it('should return collection IDs', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '',
      } as never);

      const mockWhere = vi.fn().mockResolvedValue([{ collectionId: 'col-1' }, { collectionId: 'col-2' }]);
      const mockInnerJoin = vi.fn().mockReturnValue({ where: mockWhere });
      const mockFrom = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin });
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as never);

      const result = await getContentCollectionsAction('c1');
      expect(result.success).toBe(true);
      expect(result.collectionIds).toEqual(['col-1', 'col-2']);
    });
  });

  describe('bulkAddToCollectionAction', () => {
    it('should return unauthorized when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const result = await bulkAddToCollectionAction(['content-1', 'content-2'], 'collection-1');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
    });

    it('should return not found for non-existent collection', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '',
      } as never);

      const mockWhere = vi.fn().mockResolvedValue([]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as never);

      const result = await bulkAddToCollectionAction(['c1'], 'nonexistent');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Collection not found');
    });

    it('should return message when all items already in collection', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '',
      } as never);

      const mockWhere = vi.fn()
        .mockResolvedValueOnce([{ id: 'col-1' }])
        .mockResolvedValueOnce([{ contentId: 'c1' }]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as never);

      const result = await bulkAddToCollectionAction(['c1'], 'col-1');
      expect(result.success).toBe(true);
      expect(result.message).toContain('already');
    });

    it('should add new items to collection', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '',
      } as never);

      const mockWhere = vi.fn()
        .mockResolvedValueOnce([{ id: 'col-1' }])
        .mockResolvedValueOnce([]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as never);

      const mockValues = vi.fn().mockResolvedValue(undefined);
      vi.mocked(db.insert).mockReturnValue({ values: mockValues } as never);

      const result = await bulkAddToCollectionAction(['c1', 'c2'], 'col-1');
      expect(result.success).toBe(true);
      expect(result.message).toContain('2 items');
    });
  });

  describe('updateCollectionAction', () => {
    it('should return unauthorized when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const result = await updateCollectionAction('collection-1', { name: 'Updated' });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
    });

    it('should return not found for non-existent collection', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '',
      } as never);

      const mockWhere = vi.fn().mockResolvedValue([]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as never);

      const result = await updateCollectionAction('nonexistent', { name: 'Updated' });
      expect(result.success).toBe(false);
      expect(result.message).toBe('Collection not found');
    });

    it('should update collection successfully', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '',
      } as never);

      const mockWhere = vi.fn().mockResolvedValue([{ id: 'col-1', userId: 'user-1' }]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as never);

      const updatedCol = { id: 'col-1', name: 'Updated', description: null, color: null, createdAt: new Date(), updatedAt: new Date() };
      const mockReturningFn = vi.fn().mockResolvedValue([updatedCol]);
      const mockSetWhere = vi.fn().mockReturnValue({ returning: mockReturningFn });
      const mockSetFn = vi.fn().mockReturnValue({ where: mockSetWhere });
      vi.mocked(db.update).mockReturnValue({ set: mockSetFn } as never);

      const result = await updateCollectionAction('col-1', { name: 'Updated' });
      expect(result.success).toBe(true);
      expect(result.collection?.name).toBe('Updated');
    });

    it('should return error for invalid update data', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
        expires: '',
      } as never);

      const mockWhere = vi.fn().mockResolvedValue([{ id: 'col-1', userId: 'user-1' }]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as never);

      const result = await updateCollectionAction('col-1', { color: 'invalid' });
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid color format');
    });
  });
});
