import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  publishToMarketplaceAction,
  unpublishFromMarketplaceAction,
  browseMarketplaceAction,
  cloneCollectionAction,
  trackMarketplaceViewAction,
  getMarketplaceStatsAction,
  getMarketplaceListingAction,
} from './marketplace';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock database
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
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => ({
              offset: vi.fn(),
            })),
          })),
          groupBy: vi.fn(),
          limit: vi.fn(),
        })),
        innerJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(() => ({
                offset: vi.fn(),
              })),
            })),
            limit: vi.fn(),
          })),
          innerJoin: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn(() => ({
                limit: vi.fn(() => ({
                  offset: vi.fn(),
                })),
              })),
            })),
          })),
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

const mockSession = {
  user: { id: 'user-1', email: 'test@example.com' },
  expires: '',
};

describe('Marketplace Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('publishToMarketplaceAction', () => {
    it('should return unauthorized when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const result = await publishToMarketplaceAction({
        collectionId: 'col-1',
        category: 'programming',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
    });

    it('should return error for invalid category', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as never);

      const result = await publishToMarketplaceAction({
        collectionId: 'col-1',
        category: 'invalid' as never,
      });

      expect(result.success).toBe(false);
    });

    it('should return error for non-owner', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as never);

      // Collection query returns empty (not owner)
      const mockWhere = vi.fn().mockResolvedValue([]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as never);

      const result = await publishToMarketplaceAction({
        collectionId: '550e8400-e29b-41d4-a716-446655440000',
        category: 'programming',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Collection not found');
    });

    it('should return error for empty collection', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as never);

      // First select: collection exists
      // Second select: content count = 0
      const mockWhere1 = vi.fn().mockResolvedValue([{ id: 'col-1', userId: 'user-1' }]);
      const mockFrom1 = vi.fn().mockReturnValue({ where: mockWhere1 });
      const mockWhere2 = vi.fn().mockResolvedValue([{ count: 0 }]);
      const mockFrom2 = vi.fn().mockReturnValue({ where: mockWhere2 });
      vi.mocked(db.select)
        .mockReturnValueOnce({ from: mockFrom1 } as never)
        .mockReturnValueOnce({ from: mockFrom2 } as never);

      const result = await publishToMarketplaceAction({
        collectionId: '550e8400-e29b-41d4-a716-446655440000',
        category: 'programming',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Collection must have at least 1 item');
    });

    it('should publish collection successfully', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as never);

      // Collection exists
      const mockWhere1 = vi.fn().mockResolvedValue([{ id: 'col-1', userId: 'user-1' }]);
      const mockFrom1 = vi.fn().mockReturnValue({ where: mockWhere1 });
      // Content count > 0
      const mockWhere2 = vi.fn().mockResolvedValue([{ count: 5 }]);
      const mockFrom2 = vi.fn().mockReturnValue({ where: mockWhere2 });
      // No existing listing
      const mockWhere3 = vi.fn().mockResolvedValue([]);
      const mockFrom3 = vi.fn().mockReturnValue({ where: mockWhere3 });

      vi.mocked(db.select)
        .mockReturnValueOnce({ from: mockFrom1 } as never)
        .mockReturnValueOnce({ from: mockFrom2 } as never)
        .mockReturnValueOnce({ from: mockFrom3 } as never);

      // Update collection to public
      const mockSetWhere = vi.fn().mockResolvedValue(undefined);
      const mockSet = vi.fn().mockReturnValue({ where: mockSetWhere });
      vi.mocked(db.update).mockReturnValue({ set: mockSet } as never);

      // Insert listing
      const mockValues = vi.fn().mockResolvedValue(undefined);
      vi.mocked(db.insert).mockReturnValue({ values: mockValues } as never);

      const result = await publishToMarketplaceAction({
        collectionId: '550e8400-e29b-41d4-a716-446655440000',
        category: 'programming',
        description: 'A great collection',
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Collection published to marketplace');
    });

    it('should update existing listing (upsert)', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as never);

      const mockWhere1 = vi.fn().mockResolvedValue([{ id: 'col-1', userId: 'user-1' }]);
      const mockFrom1 = vi.fn().mockReturnValue({ where: mockWhere1 });
      const mockWhere2 = vi.fn().mockResolvedValue([{ count: 5 }]);
      const mockFrom2 = vi.fn().mockReturnValue({ where: mockWhere2 });
      // Existing listing found
      const mockWhere3 = vi.fn().mockResolvedValue([{ id: 'listing-1' }]);
      const mockFrom3 = vi.fn().mockReturnValue({ where: mockWhere3 });

      vi.mocked(db.select)
        .mockReturnValueOnce({ from: mockFrom1 } as never)
        .mockReturnValueOnce({ from: mockFrom2 } as never)
        .mockReturnValueOnce({ from: mockFrom3 } as never);

      const mockSetWhere = vi.fn().mockResolvedValue(undefined);
      const mockSet = vi.fn().mockReturnValue({ where: mockSetWhere });
      vi.mocked(db.update)
        .mockReturnValueOnce({ set: mockSet } as never) // update collection isPublic
        .mockReturnValueOnce({ set: mockSet } as never); // update listing

      const result = await publishToMarketplaceAction({
        collectionId: '550e8400-e29b-41d4-a716-446655440000',
        category: 'design',
      });

      expect(result.success).toBe(true);
    });

    it('should reject description over 1000 characters', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as never);

      const result = await publishToMarketplaceAction({
        collectionId: '550e8400-e29b-41d4-a716-446655440000',
        category: 'programming',
        description: 'x'.repeat(1001),
      });

      expect(result.success).toBe(false);
    });
  });

  describe('unpublishFromMarketplaceAction', () => {
    it('should return unauthorized when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const result = await unpublishFromMarketplaceAction('col-1');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
    });

    it('should return not found for non-owner', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as never);

      const mockWhere = vi.fn().mockResolvedValue([]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as never);

      const result = await unpublishFromMarketplaceAction('col-1');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Listing not found');
    });

    it('should unpublish successfully', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as never);

      const mockWhere = vi.fn().mockResolvedValue([{ id: 'listing-1', userId: 'user-1', collectionId: 'col-1' }]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as never);

      vi.mocked(db.delete).mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) } as never);

      const result = await unpublishFromMarketplaceAction('col-1');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Collection removed from marketplace');
    });
  });

  describe('browseMarketplaceAction', () => {
    function mockBrowseDb(count: number = 0) {
      // Both count and listing queries go through: select → from → innerJoin → innerJoin → where
      vi.mocked(db.select).mockImplementation(() => {
        return {
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              innerJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockImplementation(() => {
                  // This could be the count query (resolves to [{count}])
                  // or the listings query (continues with orderBy → limit → offset)
                  const result = [{ count }];
                  return {
                    // If this is the listings query, it chains further
                    orderBy: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue({
                        offset: vi.fn().mockResolvedValue([]),
                      }),
                    }),
                    // If this is the count query, it's directly awaitable
                    then: (resolve: (val: typeof result) => void) => resolve(result),
                    [Symbol.iterator]: function* () { yield* result; },
                  };
                }),
              }),
            }),
          }),
        } as never;
      });
    }

    it('should return listings with default params', async () => {
      mockBrowseDb(0);

      const result = await browseMarketplaceAction();

      expect(result.success).toBe(true);
      expect(result.listings).toEqual([]);
      expect(result.pagination).toBeDefined();
    });

    it('should handle category filter', async () => {
      mockBrowseDb(0);

      const result = await browseMarketplaceAction({ category: 'programming' });

      expect(result.success).toBe(true);
    });

    it('should handle search query', async () => {
      mockBrowseDb(0);

      const result = await browseMarketplaceAction({ query: 'react' });

      expect(result.success).toBe(true);
    });

    it('should support newest sort', async () => {
      mockBrowseDb(0);

      const result = await browseMarketplaceAction({ sort: 'newest' });

      expect(result.success).toBe(true);
    });

    it('should support most-cloned sort', async () => {
      mockBrowseDb(0);

      const result = await browseMarketplaceAction({ sort: 'most-cloned' });

      expect(result.success).toBe(true);
    });

    it('should handle pagination', async () => {
      mockBrowseDb(25);

      const result = await browseMarketplaceAction({ page: 2, perPage: 10 });

      expect(result.success).toBe(true);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.perPage).toBe(10);
    });
  });

  describe('cloneCollectionAction', () => {
    it('should return unauthorized when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const result = await cloneCollectionAction('listing-1');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
    });

    it('should return not found for non-existent listing', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as never);

      const mockWhere = vi.fn().mockResolvedValue([]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as never);

      const result = await cloneCollectionAction('nonexistent');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Listing not found');
    });

    it('should prevent self-clone', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as never);

      const mockWhere = vi.fn().mockResolvedValue([{
        id: 'listing-1',
        userId: 'user-1', // same as session user
        collectionId: 'col-1',
      }]);
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as never);

      const result = await cloneCollectionAction('listing-1');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Cannot clone your own collection');
    });

    it('should clone collection successfully', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as never);

      // Listing exists, owned by different user
      const mockWhere1 = vi.fn().mockResolvedValue([{
        id: 'listing-1',
        userId: 'other-user',
        collectionId: 'col-1',
      }]);
      const mockFrom1 = vi.fn().mockReturnValue({ where: mockWhere1 });

      // Source collection
      const mockWhere2 = vi.fn().mockResolvedValue([{
        id: 'col-1',
        name: 'Original',
        description: 'Desc',
        color: '#FF0000',
      }]);
      const mockFrom2 = vi.fn().mockReturnValue({ where: mockWhere2 });

      // Source content
      const mockInnerJoinWhere = vi.fn().mockResolvedValue([
        { id: 'c1', type: 'note', title: 'Note 1', body: 'Body', url: null, tags: ['tag1'], autoTags: [], summary: null, metadata: null },
      ]);
      const mockInnerJoin = vi.fn().mockReturnValue({ where: mockInnerJoinWhere });
      const mockFrom3 = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin });

      vi.mocked(db.select)
        .mockReturnValueOnce({ from: mockFrom1 } as never)
        .mockReturnValueOnce({ from: mockFrom2 } as never)
        .mockReturnValueOnce({ from: mockFrom3 } as never);

      // Insert collection
      const mockReturning = vi.fn().mockResolvedValue([{ id: 'new-col-1' }]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });

      // Insert collection members
      const mockMemberValues = vi.fn().mockResolvedValue(undefined);

      // Insert content (returning ids)
      const mockContentReturning = vi.fn().mockResolvedValue([{ id: 'new-c1' }]);
      const mockContentValues = vi.fn().mockReturnValue({ returning: mockContentReturning });

      // Insert content collections
      const mockCCValues = vi.fn().mockResolvedValue(undefined);

      vi.mocked(db.insert)
        .mockReturnValueOnce({ values: mockValues } as never) // collection
        .mockReturnValueOnce({ values: mockMemberValues } as never) // member
        .mockReturnValueOnce({ values: mockContentValues } as never) // content
        .mockReturnValueOnce({ values: mockCCValues } as never); // contentCollections

      // Update clone count
      const mockSetWhere = vi.fn().mockResolvedValue(undefined);
      const mockSet = vi.fn().mockReturnValue({ where: mockSetWhere });
      vi.mocked(db.update).mockReturnValue({ set: mockSet } as never);

      const result = await cloneCollectionAction('listing-1');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Collection cloned to your library');
      expect(result.collectionId).toBe('new-col-1');
    });
  });

  describe('trackMarketplaceViewAction', () => {
    it('should track view successfully', async () => {
      const mockSetWhere = vi.fn().mockResolvedValue(undefined);
      const mockSet = vi.fn().mockReturnValue({ where: mockSetWhere });
      vi.mocked(db.update).mockReturnValue({ set: mockSet } as never);

      const result = await trackMarketplaceViewAction('listing-1');

      expect(result.success).toBe(true);
    });

    it('should return error for empty listing ID', async () => {
      const result = await trackMarketplaceViewAction('');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid listing ID');
    });
  });

  describe('getMarketplaceStatsAction', () => {
    it('should return unauthorized when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const result = await getMarketplaceStatsAction();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
    });

    it('should return empty stats when no listings', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as never);

      const mockOrderBy = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockInnerJoin = vi.fn().mockReturnValue({ where: mockWhere });
      const mockFrom = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin });
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as never);

      const result = await getMarketplaceStatsAction();

      expect(result.success).toBe(true);
      expect(result.stats?.totalListings).toBe(0);
      expect(result.stats?.totalViews).toBe(0);
      expect(result.stats?.totalClones).toBe(0);
    });

    it('should return correct stats with listings', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as never);

      const mockListings = [
        { id: 'l1', collectionName: 'Col1', viewCount: 10, cloneCount: 3 },
        { id: 'l2', collectionName: 'Col2', viewCount: 20, cloneCount: 5 },
      ];
      const mockOrderBy = vi.fn().mockResolvedValue(mockListings);
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockInnerJoin = vi.fn().mockReturnValue({ where: mockWhere });
      const mockFrom = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin });
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as never);

      const result = await getMarketplaceStatsAction();

      expect(result.success).toBe(true);
      expect(result.stats?.totalListings).toBe(2);
      expect(result.stats?.totalViews).toBe(30);
      expect(result.stats?.totalClones).toBe(8);
      expect(result.listings).toHaveLength(2);
    });
  });

  describe('getMarketplaceListingAction', () => {
    it('should return error for empty listing ID', async () => {
      const result = await getMarketplaceListingAction('');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid listing ID');
    });

    it('should return not found for non-existent listing', async () => {
      const mockWhere = vi.fn().mockResolvedValue([]);
      const mockInnerJoin2 = vi.fn().mockReturnValue({ where: mockWhere });
      const mockInnerJoin = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin2 });
      const mockFrom = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin });
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as never);

      const result = await getMarketplaceListingAction('nonexistent');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Listing not found');
    });

    it('should return listing with content preview', async () => {
      const mockRow = {
        id: 'listing-1',
        collectionId: 'col-1',
        category: 'programming',
        description: 'A description',
        isFeatured: false,
        viewCount: 10,
        cloneCount: 2,
        publishedAt: new Date(),
        collectionName: 'My Collection',
        collectionColor: '#FF0000',
        collectionDescription: 'Collection desc',
        creatorId: 'user-1',
        creatorName: 'Test User',
        creatorUsername: 'testuser',
        creatorImage: null,
      };

      // First query: listing details
      const mockWhere1 = vi.fn().mockResolvedValue([mockRow]);
      const mockInnerJoin2 = vi.fn().mockReturnValue({ where: mockWhere1 });
      const mockInnerJoin1 = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin2 });
      const mockFrom1 = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin1 });

      // Second query: content count
      const mockWhere2 = vi.fn().mockResolvedValue([{ count: 5 }]);
      const mockFrom2 = vi.fn().mockReturnValue({ where: mockWhere2 });

      // Third query: content preview
      const mockLimit = vi.fn().mockResolvedValue([
        { id: 'c1', title: 'Note 1', type: 'note' },
      ]);
      const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockWhere3 = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockInnerJoin3 = vi.fn().mockReturnValue({ where: mockWhere3 });
      const mockFrom3 = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin3 });

      // Fourth query: tags
      const mockWhere4 = vi.fn().mockResolvedValue([
        { tags: ['react'], autoTags: ['javascript'] },
      ]);
      const mockInnerJoin4 = vi.fn().mockReturnValue({ where: mockWhere4 });
      const mockFrom4 = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin4 });

      vi.mocked(db.select)
        .mockReturnValueOnce({ from: mockFrom1 } as never)
        .mockReturnValueOnce({ from: mockFrom2 } as never)
        .mockReturnValueOnce({ from: mockFrom3 } as never)
        .mockReturnValueOnce({ from: mockFrom4 } as never);

      const result = await getMarketplaceListingAction('listing-1');

      expect(result.success).toBe(true);
      expect(result.listing).toBeDefined();
      expect(result.listing!.collection.name).toBe('My Collection');
      expect(result.listing!.contentCount).toBe(5);
      expect(result.listing!.contentPreview).toHaveLength(1);
      expect(result.listing!.tags).toContain('react');
      expect(result.listing!.tags).toContain('javascript');
    });
  });
});
