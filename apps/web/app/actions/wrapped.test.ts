import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock auth
const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

// Mock rate limit
const mockCheckServerActionRateLimit = vi.fn();
vi.mock('@/lib/rate-limit', () => ({
  checkServerActionRateLimit: (...args: unknown[]) => mockCheckServerActionRateLimit(...args),
  RATE_LIMITS: {
    wrappedGeneration: { maxRequests: 5, windowMs: 3600000 },
    serverActionAI: { maxRequests: 20, windowMs: 60000 },
  },
}));

// Mock AI
const mockGenerateKnowledgePersonality = vi.fn();
vi.mock('@/lib/ai/gemini', () => ({
  generateKnowledgePersonality: (...args: unknown[]) => mockGenerateKnowledgePersonality(...args),
}));

// Mock DB
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockInsert = vi.fn();
const mockValues = vi.fn();
const mockReturning = vi.fn();
const mockExecute = vi.fn();
const mockFindFirst = vi.fn();
const mockFindMany = vi.fn();

vi.mock('@/lib/db/client', () => ({
  db: {
    select: (...args: unknown[]) => {
      mockSelect(...args);
      return {
        from: (...fArgs: unknown[]) => {
          mockFrom(...fArgs);
          return { where: mockWhere };
        },
      };
    },
    execute: (...args: unknown[]) => mockExecute(...args),
    insert: (...args: unknown[]) => {
      mockInsert(...args);
      return {
        values: (...vArgs: unknown[]) => {
          mockValues(...vArgs);
          return { returning: mockReturning };
        },
      };
    },
    query: {
      knowledgeWrapped: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
        findMany: (...args: unknown[]) => mockFindMany(...args),
      },
    },
  },
}));

vi.mock('@/lib/db/schema', () => ({
  content: { userId: 'userId', id: 'id', createdAt: 'createdAt' },
  embeddings: { contentId: 'contentId', embedding: 'embedding', id: 'id' },
  knowledgeWrapped: {},
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: unknown[]) => args),
  sql: vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values })),
  gte: vi.fn((...args: unknown[]) => args),
  count: vi.fn(() => 'count'),
  desc: vi.fn(),
}));

describe('Wrapped Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockCheckServerActionRateLimit.mockReturnValue({ success: true });
    mockGenerateKnowledgePersonality.mockResolvedValue({
      personality: 'The Curious Polymath',
      description: 'A dedicated knowledge collector.',
    });
  });

  describe('generateWrappedAction', () => {
    it('should return unauthorized if not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const { generateWrappedAction } = await import('./wrapped');
      const result = await generateWrappedAction();
      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
    });

    it('should check rate limit', async () => {
      mockCheckServerActionRateLimit.mockReturnValue({
        success: false,
        message: 'Rate limit exceeded.',
      });

      const { generateWrappedAction } = await import('./wrapped');
      const result = await generateWrappedAction();
      expect(result.success).toBe(false);
      expect(result.message).toContain('Rate limit');
    });

    it('should generate wrapped stats and save to DB', async () => {
      // Mock total count
      mockWhere.mockResolvedValue([{ count: 42 }]);

      // Mock all execute calls
      mockExecute
        .mockResolvedValueOnce([{ type: 'note', count: '20' }, { type: 'link', count: '15' }, { type: 'file', count: '7' }]) // type breakdown
        .mockResolvedValueOnce([{ tag: 'javascript', count: '10' }, { tag: 'react', count: '8' }]) // tags
        .mockResolvedValueOnce([{ day: '2026-02-27', count: '3' }]) // streak
        .mockResolvedValueOnce([{ id: 'c1', title: 'Test', connection_count: '5' }]) // most connected
        .mockResolvedValueOnce([{ this_month: '10', last_month: '8' }]) // growth
        .mockResolvedValueOnce([{ active_days: '30' }]); // active days

      const { generateWrappedAction } = await import('./wrapped');
      const result = await generateWrappedAction();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.shareId).toBeDefined();
      expect(result.data!.stats.knowledgePersonality).toBe('The Curious Polymath');
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should call AI to generate personality', async () => {
      mockWhere.mockResolvedValue([{ count: 10 }]);
      mockExecute.mockResolvedValue([]);

      const { generateWrappedAction } = await import('./wrapped');
      await generateWrappedAction();

      expect(mockGenerateKnowledgePersonality).toHaveBeenCalledWith(
        expect.objectContaining({
          totalItems: expect.any(Number),
          topTags: expect.any(Array),
        })
      );
    });

    it('should save to knowledgeWrapped table with shareId', async () => {
      mockWhere.mockResolvedValue([{ count: 5 }]);
      mockExecute.mockResolvedValue([]);

      const { generateWrappedAction } = await import('./wrapped');
      await generateWrappedAction();

      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          shareId: expect.any(String),
          stats: expect.any(Object),
          period: 'all-time',
        })
      );
    });
  });

  describe('getWrappedByShareIdAction', () => {
    it('should return wrapped data for valid shareId', async () => {
      const mockStats = {
        totalItems: 42,
        topTags: ['javascript'],
        knowledgePersonality: 'The Curious Mind',
        personalityDescription: 'A collector.',
      };
      mockFindFirst.mockResolvedValue({
        stats: mockStats,
        createdAt: new Date('2026-02-28'),
        period: 'all-time',
      });

      const { getWrappedByShareIdAction } = await import('./wrapped');
      const result = await getWrappedByShareIdAction('abc123');
      expect(result.success).toBe(true);
      expect(result.data!.stats.totalItems).toBe(42);
    });

    it('should return not found for invalid shareId', async () => {
      mockFindFirst.mockResolvedValue(null);

      const { getWrappedByShareIdAction } = await import('./wrapped');
      const result = await getWrappedByShareIdAction('nonexistent');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Wrapped not found');
    });
  });
});
