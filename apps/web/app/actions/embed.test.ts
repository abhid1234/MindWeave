import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getEmbedDataAction, getEmbedCollectionAction } from './embed';

// Mock database
vi.mock('@/lib/db/client', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(),
        })),
        innerJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(),
          })),
        })),
      })),
    })),
  },
}));

import { db } from '@/lib/db/client';

describe('Embed Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getEmbedDataAction', () => {
    it('should return error for empty shareId', async () => {
      const result = await getEmbedDataAction('');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid share ID.');
    });

    it('should return error when content not found', async () => {
      const mockLimit = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as never);

      const result = await getEmbedDataAction('nonexistent');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Content not found or not shared.');
    });

    it('should return embed data for valid shared content', async () => {
      const mockContent = {
        id: 'c-1',
        title: 'Test Note',
        body: 'Hello world',
        type: 'note',
        tags: ['javascript'],
        autoTags: ['programming'],
        createdAt: new Date('2024-01-01'),
        shareId: 'abc123',
      };
      const mockLimit = vi.fn().mockResolvedValue([mockContent]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as never);

      const result = await getEmbedDataAction('abc123');
      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('Test Note');
      expect(result.data?.shareId).toBe('abc123');
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(db.select).mockImplementation(() => {
        throw new Error('DB error');
      });

      const result = await getEmbedDataAction('abc123');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to load embed data.');
    });
  });

  describe('getEmbedCollectionAction', () => {
    it('should return error for empty collectionId', async () => {
      const result = await getEmbedCollectionAction('');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid collection ID.');
    });

    it('should return error when collection not found', async () => {
      const mockLimit = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockInnerJoin = vi.fn().mockReturnValue({ where: mockWhere });
      const mockFrom = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin });
      vi.mocked(db.select).mockReturnValue({ from: mockFrom } as never);

      const result = await getEmbedCollectionAction('nonexistent');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Collection not found or not public.');
    });

    it('should return collection embed data for valid public collection', async () => {
      const mockCollection = {
        id: 'col-1',
        name: 'JS Resources',
        description: 'Best JS resources',
        color: '#FF5733',
        creatorName: 'John',
        creatorUsername: 'john',
        creatorImage: null,
      };
      const mockCountResult = [{ count: 5 }];
      const mockItems = [
        { tags: ['javascript', 'react'] },
        { tags: ['typescript'] },
      ];

      let selectCallCount = 0;
      vi.mocked(db.select).mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          // Collection query
          const mockLimit = vi.fn().mockResolvedValue([mockCollection]);
          const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
          const mockInnerJoin = vi.fn().mockReturnValue({ where: mockWhere });
          return { from: vi.fn().mockReturnValue({ innerJoin: mockInnerJoin }) } as never;
        } else if (selectCallCount === 2) {
          // Count query
          const mockWhere = vi.fn().mockResolvedValue(mockCountResult);
          return { from: vi.fn().mockReturnValue({ where: mockWhere }) } as never;
        } else {
          // Tags query
          const mockLimit = vi.fn().mockResolvedValue(mockItems);
          const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
          const mockInnerJoin = vi.fn().mockReturnValue({ where: mockWhere });
          return { from: vi.fn().mockReturnValue({ innerJoin: mockInnerJoin }) } as never;
        }
      });

      const result = await getEmbedCollectionAction('col-1');
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('JS Resources');
      expect(result.data?.itemCount).toBe(5);
      expect(result.data?.creator.name).toBe('John');
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(db.select).mockImplementation(() => {
        throw new Error('DB error');
      });

      const result = await getEmbedCollectionAction('col-1');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to load collection embed data.');
    });
  });
});
