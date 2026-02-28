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
    serverActionAI: { maxRequests: 20, windowMs: 60000 },
  },
}));

// Mock AI
const mockGenerateWeeklyBriefing = vi.fn();
vi.mock('@/lib/ai/gemini', () => ({
  generateWeeklyBriefing: (...args: unknown[]) => mockGenerateWeeklyBriefing(...args),
}));

// Mock DB
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
const mockInsert = vi.fn();
const mockValues = vi.fn();
const mockFindFirst = vi.fn();

vi.mock('@/lib/db/client', () => ({
  db: {
    select: (...args: unknown[]) => {
      mockSelect(...args);
      return {
        from: (...fArgs: unknown[]) => {
          mockFrom(...fArgs);
          return {
            where: (...wArgs: unknown[]) => {
              mockWhere(...wArgs);
              return {
                orderBy: (...oArgs: unknown[]) => {
                  mockOrderBy(...oArgs);
                  return { limit: mockLimit };
                },
              };
            },
          };
        },
      };
    },
    insert: (...args: unknown[]) => {
      mockInsert(...args);
      return {
        values: (...vArgs: unknown[]) => {
          mockValues(...vArgs);
          return { returning: vi.fn() };
        },
      };
    },
    query: {
      generatedPosts: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
      },
    },
  },
}));

vi.mock('@/lib/db/schema', () => ({
  content: { userId: 'userId', createdAt: 'createdAt' },
  generatedPosts: {},
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: unknown[]) => args),
  gte: vi.fn((...args: unknown[]) => args),
  and: vi.fn((...args: unknown[]) => args),
  desc: vi.fn(),
}));

describe('Weekly Briefing Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockCheckServerActionRateLimit.mockReturnValue({ success: true });
    mockGenerateWeeklyBriefing.mockResolvedValue('This Week I Learned: Great post content here.');
  });

  describe('generateWeeklyBriefingAction', () => {
    it('should return unauthorized if not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const { generateWeeklyBriefingAction } = await import('./weekly-briefing');
      const result = await generateWeeklyBriefingAction();
      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
    });

    it('should check rate limit', async () => {
      mockCheckServerActionRateLimit.mockReturnValue({
        success: false,
        message: 'Rate limit exceeded.',
      });

      const { generateWeeklyBriefingAction } = await import('./weekly-briefing');
      const result = await generateWeeklyBriefingAction();
      expect(result.success).toBe(false);
      expect(result.message).toContain('Rate limit');
    });

    it('should require minimum 2 items from the week', async () => {
      mockLimit.mockResolvedValue([
        { id: 'c1', title: 'Only one', body: null, tags: ['solo'], autoTags: [] },
      ]);

      const { generateWeeklyBriefingAction } = await import('./weekly-briefing');
      const result = await generateWeeklyBriefingAction();
      expect(result.success).toBe(false);
      expect(result.message).toContain('at least 2');
    });

    it('should generate briefing and save to generatedPosts', async () => {
      mockLimit.mockResolvedValue([
        { id: 'c1', title: 'Learning AI', body: 'About AI', tags: ['ai'], autoTags: ['machine-learning'] },
        { id: 'c2', title: 'React Patterns', body: 'About React', tags: ['react'], autoTags: ['frontend'] },
        { id: 'c3', title: 'TypeScript Tips', body: null, tags: ['typescript'], autoTags: [] },
      ]);

      const { generateWeeklyBriefingAction } = await import('./weekly-briefing');
      const result = await generateWeeklyBriefingAction();

      expect(result.success).toBe(true);
      expect(result.data!.postContent).toContain('This Week I Learned');
      expect(result.data!.themes.length).toBeGreaterThan(0);
      expect(mockGenerateWeeklyBriefing).toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          tone: 'weekly-briefing',
        })
      );
    });

    it('should extract themes from tag counts', async () => {
      mockLimit.mockResolvedValue([
        { id: 'c1', title: 'AI 1', body: null, tags: ['ai', 'ml'], autoTags: ['ai'] },
        { id: 'c2', title: 'AI 2', body: null, tags: ['ai'], autoTags: [] },
        { id: 'c3', title: 'React 1', body: null, tags: ['react'], autoTags: [] },
      ]);

      const { generateWeeklyBriefingAction } = await import('./weekly-briefing');
      const result = await generateWeeklyBriefingAction();

      expect(result.success).toBe(true);
      // 'ai' should be the top theme (appears 3 times)
      expect(result.data!.themes[0]).toBe('ai');
    });
  });

  describe('getLatestBriefingAction', () => {
    it('should return latest briefing if exists', async () => {
      mockFindFirst.mockResolvedValue({
        postContent: 'Weekly post content',
        sourceContentTitles: ['Title 1', 'Title 2'],
      });

      const { getLatestBriefingAction } = await import('./weekly-briefing');
      const result = await getLatestBriefingAction();
      expect(result.success).toBe(true);
      expect(result.data!.postContent).toBe('Weekly post content');
    });

    it('should return success with no data if no briefing exists', async () => {
      mockFindFirst.mockResolvedValue(null);

      const { getLatestBriefingAction } = await import('./weekly-briefing');
      const result = await getLatestBriefingAction();
      expect(result.success).toBe(true);
      expect(result.data).toBeUndefined();
    });
  });
});
