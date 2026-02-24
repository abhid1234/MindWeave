import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAuth, mockSelect, mockExecute, mockRateLimit, mockExtractInsights } = vi.hoisted(
  () => {
    const mockGroupBy = vi.fn();
    const mockOrderBy = vi.fn(() => ({ groupBy: mockGroupBy }));
    const mockLeftJoin = vi.fn(() => ({ where: vi.fn(() => ({ groupBy: mockGroupBy, orderBy: mockOrderBy })) }));
    const mockWhere = vi.fn(() => ({ orderBy: mockOrderBy, leftJoin: mockLeftJoin, groupBy: mockGroupBy }));
    const mockFrom = vi.fn(() => ({ where: mockWhere, leftJoin: mockLeftJoin }));
    const mockSelect = vi.fn(() => ({ from: mockFrom }));
    const mockExecute = vi.fn();
    const mockAuth = vi.fn();
    const mockRateLimit = vi.fn();
    const mockExtractInsights = vi.fn();

    Object.assign(mockSelect, {
      from: mockFrom,
      where: mockWhere,
      orderBy: mockOrderBy,
      leftJoin: mockLeftJoin,
      groupBy: mockGroupBy,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { mockAuth, mockSelect: mockSelect as any, mockExecute, mockRateLimit, mockExtractInsights };
  }
);

vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

vi.mock('@/lib/db/client', () => ({
  db: {
    select: (...args: any[]) => mockSelect(...args),
    execute: (query: any) => mockExecute(query),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  content: {
    id: 'id',
    title: 'title',
    type: 'type',
    tags: 'tags',
    autoTags: 'autoTags',
    userId: 'userId',
    createdAt: 'createdAt',
  },
  collections: {
    id: 'id',
    name: 'name',
    color: 'color',
    userId: 'userId',
  },
  contentCollections: {
    contentId: 'contentId',
    collectionId: 'collectionId',
  },
  users: {},
}));

vi.mock('@/lib/rate-limit', () => ({
  checkServerActionRateLimit: (...args: unknown[]) => mockRateLimit(...args),
  RATE_LIMITS: { serverActionAI: { maxRequests: 10, windowMs: 60000 } },
}));

vi.mock('drizzle-orm', () => ({
  eq: (...args: unknown[]) => args,
  desc: (col: unknown) => col,
  and: (...args: unknown[]) => args,
  gte: (...args: unknown[]) => args,
  lt: (...args: unknown[]) => args,
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values }),
  count: () => 'count',
  countDistinct: (col: unknown) => col,
}));

vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((fn: (...args: unknown[]) => unknown) => fn),
  revalidateTag: vi.fn(),
}));

vi.mock('@/lib/cache', () => ({
  createCachedFn: vi.fn((fn: (...args: unknown[]) => unknown) => fn),
  CacheDuration: { SHORT: 30, MEDIUM: 60, LONG: 300, EXTRA_LONG: 600, INFINITE: false },
  CacheTags: { ANALYTICS: 'analytics', CONTENT: 'content', COLLECTIONS: 'collections', USER: 'user' },
}));

vi.mock('@/lib/ai/insights', () => ({
  extractInsights: (...args: unknown[]) => mockExtractInsights(...args),
}));

import {
  getOverviewStatsAction,
  getContentGrowthAction,
  getTagDistributionAction,
  getCollectionUsageAction,
  getKnowledgeInsightsAction,
  exportAnalyticsAction,
} from './analytics';

// Helper to set up the db.select chain returning a resolved value
function setupDbSelectChain(resolvedValue: unknown[]) {
  const mockGroupByFn = vi.fn().mockResolvedValue(resolvedValue);
  const mockOrderByFn = vi.fn(() => ({ groupBy: mockGroupByFn })).mockResolvedValue(resolvedValue as never);
  const mockLeftJoinFn = vi.fn(() => ({
    where: vi.fn(() => ({
      groupBy: mockGroupByFn,
      orderBy: vi.fn().mockResolvedValue(resolvedValue),
    })),
  }));
  const mockWhereFn = vi.fn(() => ({
    orderBy: mockOrderByFn,
    leftJoin: mockLeftJoinFn,
    groupBy: mockGroupByFn,
  }));
  const mockFromFn = vi.fn(() => ({
    where: mockWhereFn,
    leftJoin: mockLeftJoinFn,
  }));
  mockSelect.mockReturnValue({ from: mockFromFn });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
  mockRateLimit.mockReturnValue({ success: true });
  mockExtractInsights.mockResolvedValue([]);
  setupDbSelectChain([]);
  mockExecute.mockResolvedValue([]);
});

// ──────────────────────────────────────────────────────────────
// getOverviewStatsAction
// ──────────────────────────────────────────────────────────────
describe('getOverviewStatsAction', () => {
  it('returns unauthorized when no session', async () => {
    mockAuth.mockResolvedValue(null);
    const result = await getOverviewStatsAction();
    expect(result.success).toBe(false);
    expect(result.message).toBe('Unauthorized');
  });

  it('returns unauthorized when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} });
    const result = await getOverviewStatsAction();
    expect(result.success).toBe(false);
    expect(result.message).toBe('Unauthorized');
  });

  it('returns overview stats on success', async () => {
    // The cached function calls db.select 3 times and db.execute once
    // Set up sequential calls
    const selectResults = [
      [{ count: 42 }],   // totalItems
      [{ count: 7 }],    // thisMonth
      [{ count: 3 }],    // collections
    ];
    let selectCallIdx = 0;
    mockSelect.mockImplementation(() => {
      const result = selectResults[selectCallIdx++] || [{ count: 0 }];
      const mockFromFn = vi.fn(() => ({
        where: vi.fn().mockResolvedValue(result),
      }));
      return { from: mockFromFn };
    });

    // db.execute for unique tags
    mockExecute.mockResolvedValue([{ tag_count: '15' }]);

    const result = await getOverviewStatsAction();
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      totalItems: 42,
      itemsThisMonth: 7,
      totalCollections: 3,
      totalTags: 15,
    });
  });

  it('returns failure on database error', async () => {
    mockSelect.mockImplementation(() => {
      const mockFromFn = vi.fn(() => ({
        where: vi.fn().mockRejectedValue(new Error('DB error')),
      }));
      return { from: mockFromFn };
    });

    const result = await getOverviewStatsAction();
    expect(result.success).toBe(false);
    expect(result.message).toBe('Failed to fetch overview stats');
  });
});

// ──────────────────────────────────────────────────────────────
// getContentGrowthAction
// ──────────────────────────────────────────────────────────────
describe('getContentGrowthAction', () => {
  it('returns unauthorized when no session', async () => {
    mockAuth.mockResolvedValue(null);
    const result = await getContentGrowthAction();
    expect(result.success).toBe(false);
    expect(result.message).toBe('Unauthorized');
  });

  it('returns growth data for week period', async () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);

    mockExecute.mockResolvedValue([
      { date: dateStr, type: 'note', count: '3' },
      { date: dateStr, type: 'link', count: '2' },
    ]);

    const result = await getContentGrowthAction('week');
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.length).toBeGreaterThanOrEqual(7);

    // Check that the date with data has the correct counts
    const entry = result.data!.find((d) => d.date === dateStr);
    expect(entry).toBeDefined();
    expect(entry!.notes).toBe(3);
    expect(entry!.links).toBe(2);
    expect(entry!.files).toBe(0);
    expect(entry!.total).toBe(5);
  });

  it('returns growth data for month period (default)', async () => {
    mockExecute.mockResolvedValue([]);

    const result = await getContentGrowthAction('month');
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    // Month period should have ~31 days
    expect(result.data!.length).toBeGreaterThanOrEqual(30);
  });

  it('returns growth data for year period with monthly grouping', async () => {
    const monthStr = new Date().toISOString().slice(0, 7);

    mockExecute.mockResolvedValue([
      { date: monthStr, type: 'file', count: '5' },
    ]);

    const result = await getContentGrowthAction('year');
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    // Year period should have ~12-13 months
    expect(result.data!.length).toBeGreaterThanOrEqual(12);

    const entry = result.data!.find((d) => d.date === monthStr);
    expect(entry).toBeDefined();
    expect(entry!.files).toBe(5);
    expect(entry!.total).toBe(5);
  });

  it('fills gaps with zero values for days with no data', async () => {
    mockExecute.mockResolvedValue([]);

    const result = await getContentGrowthAction('week');
    expect(result.success).toBe(true);

    // All entries should have zero values
    for (const entry of result.data!) {
      expect(entry.notes).toBe(0);
      expect(entry.links).toBe(0);
      expect(entry.files).toBe(0);
      expect(entry.total).toBe(0);
    }
  });

  it('returns failure on error', async () => {
    mockExecute.mockRejectedValue(new Error('Query failed'));

    const result = await getContentGrowthAction('month');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Failed to fetch content growth data');
  });
});

// ──────────────────────────────────────────────────────────────
// getTagDistributionAction
// ──────────────────────────────────────────────────────────────
describe('getTagDistributionAction', () => {
  it('returns unauthorized when no session', async () => {
    mockAuth.mockResolvedValue(null);
    const result = await getTagDistributionAction();
    expect(result.success).toBe(false);
    expect(result.message).toBe('Unauthorized');
  });

  it('returns tag distribution with counts and percentages', async () => {
    mockExecute.mockResolvedValue([
      { tag: 'javascript', count: '10' },
      { tag: 'typescript', count: '6' },
      { tag: 'react', count: '4' },
    ]);

    const result = await getTagDistributionAction();
    expect(result.success).toBe(true);
    expect(result.data).toEqual([
      { tag: 'javascript', count: 10, percentage: 50 },
      { tag: 'typescript', count: 6, percentage: 30 },
      { tag: 'react', count: 4, percentage: 20 },
    ]);
  });

  it('returns empty array when no tags exist', async () => {
    mockExecute.mockResolvedValue([]);

    const result = await getTagDistributionAction();
    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  it('returns failure on error', async () => {
    mockExecute.mockRejectedValue(new Error('SQL error'));

    const result = await getTagDistributionAction();
    expect(result.success).toBe(false);
    expect(result.message).toBe('Failed to fetch tag distribution');
  });
});

// ──────────────────────────────────────────────────────────────
// getCollectionUsageAction
// ──────────────────────────────────────────────────────────────
describe('getCollectionUsageAction', () => {
  it('returns unauthorized when no session', async () => {
    mockAuth.mockResolvedValue(null);
    const result = await getCollectionUsageAction();
    expect(result.success).toBe(false);
    expect(result.message).toBe('Unauthorized');
  });

  it('returns collection usage data on success', async () => {
    const collectionData = [
      { id: 'c1', name: 'Frontend', color: '#ff0000', itemCount: 12 },
      { id: 'c2', name: 'Backend', color: '#00ff00', itemCount: 8 },
      { id: 'c3', name: 'DevOps', color: null, itemCount: 3 },
    ];

    // The cached function uses db.select().from().leftJoin().where().groupBy().orderBy()
    const mockOrderByFn = vi.fn().mockResolvedValue(collectionData);
    const mockGroupByFn = vi.fn(() => ({ orderBy: mockOrderByFn }));
    const mockWhereFn = vi.fn(() => ({ groupBy: mockGroupByFn }));
    const mockLeftJoinFn = vi.fn(() => ({ where: mockWhereFn }));
    const mockFromFn = vi.fn(() => ({ leftJoin: mockLeftJoinFn }));
    mockSelect.mockReturnValue({ from: mockFromFn });

    const result = await getCollectionUsageAction();
    expect(result.success).toBe(true);
    expect(result.data).toEqual(collectionData);
  });

  it('returns failure on error', async () => {
    const mockOrderByFn = vi.fn().mockRejectedValue(new Error('Join error'));
    const mockGroupByFn = vi.fn(() => ({ orderBy: mockOrderByFn }));
    const mockWhereFn = vi.fn(() => ({ groupBy: mockGroupByFn }));
    const mockLeftJoinFn = vi.fn(() => ({ where: mockWhereFn }));
    const mockFromFn = vi.fn(() => ({ leftJoin: mockLeftJoinFn }));
    mockSelect.mockReturnValue({ from: mockFromFn });

    const result = await getCollectionUsageAction();
    expect(result.success).toBe(false);
    expect(result.message).toBe('Failed to fetch collection usage');
  });
});

// ──────────────────────────────────────────────────────────────
// getKnowledgeInsightsAction
// ──────────────────────────────────────────────────────────────
describe('getKnowledgeInsightsAction', () => {
  it('returns unauthorized when no session', async () => {
    mockAuth.mockResolvedValue(null);
    const result = await getKnowledgeInsightsAction();
    expect(result.success).toBe(false);
    expect(result.message).toBe('Unauthorized');
  });

  it('returns failure when rate limited', async () => {
    mockRateLimit.mockReturnValue({ success: false, message: 'Rate limit exceeded' });

    const result = await getKnowledgeInsightsAction();
    expect(result.success).toBe(false);
    expect(result.message).toBe('Rate limit exceeded');
  });

  it('returns insights with stats-based thresholds and AI insights merged', async () => {
    // Set up overview stats (totalItems >= 100 triggers "Knowledge Champion")
    const overviewSelectResults = [
      [{ count: 120 }],  // totalItems
      [{ count: 15 }],   // thisMonth
      [{ count: 2 }],    // collections
    ];
    let overviewCallIdx = 0;

    mockSelect.mockImplementation(() => {
      const result = overviewSelectResults[overviewCallIdx++] || [{ count: 0 }];
      const mockFromFn = vi.fn(() => ({
        where: vi.fn().mockResolvedValue(result),
      }));
      return { from: mockFromFn };
    });

    // Tags execute for overview stats
    mockExecute.mockResolvedValueOnce([{ tag_count: '25' }]);

    // Tags execute for tag distribution
    mockExecute.mockResolvedValueOnce([
      { tag: 'javascript', count: '20' },
      { tag: 'react', count: '10' },
    ]);

    // AI insights from extractInsights
    mockExtractInsights.mockResolvedValue([
      {
        type: 'connection',
        title: 'Topic Connection',
        description: 'JS and React are connected',
        icon: 'link',
        relatedContentIds: ['c1', 'c2'],
        confidence: 0.9,
      },
    ]);

    const result = await getKnowledgeInsightsAction();
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.length).toBeLessThanOrEqual(5);

    // Should contain achievement insight for 100+ items
    const achievement = result.data!.find((i) => i.type === 'achievement');
    expect(achievement).toBeDefined();
    expect(achievement!.title).toBe('Knowledge Champion');

    // Should contain the AI insight
    const connection = result.data!.find((i) => i.type === 'connection');
    expect(connection).toBeDefined();
    expect(connection!.title).toBe('Topic Connection');
  });

  it('returns suggestion to start capturing when no data', async () => {
    // Override overview to return 0 items
    mockSelect.mockImplementation(() => {
      const mockFromFn = vi.fn(() => ({
        where: vi.fn().mockResolvedValue([{ count: 0 }]),
      }));
      return { from: mockFromFn };
    });

    // Both execute calls return empty data (order doesn't matter with mockResolvedValue)
    mockExecute.mockResolvedValue([]);

    const result = await getKnowledgeInsightsAction();
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.length).toBeGreaterThanOrEqual(1);

    // When empty, should get the "Start Capturing Knowledge" fallback
    const suggestion = result.data!.find((i) => i.title === 'Start Capturing Knowledge');
    expect(suggestion).toBeDefined();
  });

  it('returns "Growing Library" achievement for 50+ items', async () => {
    const selectResults = [
      [{ count: 55 }],  // totalItems (50-99 range)
      [{ count: 5 }],   // thisMonth
      [{ count: 1 }],   // collections
    ];
    let callIdx = 0;

    mockSelect.mockImplementation(() => {
      const result = selectResults[callIdx++] || [{ count: 0 }];
      const mockFromFn = vi.fn(() => ({
        where: vi.fn().mockResolvedValue(result),
      }));
      return { from: mockFromFn };
    });

    // Use mockResolvedValue for both execute calls to avoid ordering issues
    mockExecute.mockResolvedValue([{ tag: 'testing', count: '5' }]);

    const result = await getKnowledgeInsightsAction();
    expect(result.success).toBe(true);

    const achievement = result.data!.find((i) => i.type === 'achievement');
    expect(achievement).toBeDefined();
    expect(achievement!.title).toBe('Growing Library');
  });

  it('suggests collections when user has items but no collections', async () => {
    const selectResults = [
      [{ count: 10 }],  // totalItems >= 5
      [{ count: 3 }],   // thisMonth
      [{ count: 0 }],   // totalCollections = 0
    ];
    let callIdx = 0;

    mockSelect.mockImplementation(() => {
      const result = selectResults[callIdx++] || [{ count: 0 }];
      const mockFromFn = vi.fn(() => ({
        where: vi.fn().mockResolvedValue(result),
      }));
      return { from: mockFromFn };
    });

    // Use mockResolvedValue for both execute calls to avoid ordering issues
    mockExecute.mockResolvedValue([{ tag: 'dev', count: '3' }]);

    const result = await getKnowledgeInsightsAction();
    expect(result.success).toBe(true);

    const suggestion = result.data!.find((i) => i.title === 'Organize with Collections');
    expect(suggestion).toBeDefined();
    expect(suggestion!.type).toBe('suggestion');
  });

  it('returns top focus area from tag distribution', async () => {
    const selectResults = [
      [{ count: 10 }],
      [{ count: 2 }],
      [{ count: 1 }],
    ];
    let callIdx = 0;

    mockSelect.mockImplementation(() => {
      const result = selectResults[callIdx++] || [{ count: 0 }];
      const mockFromFn = vi.fn(() => ({
        where: vi.fn().mockResolvedValue(result),
      }));
      return { from: mockFromFn };
    });

    // Use mockResolvedValue so both execute calls (overview tags + tag distribution)
    // get the tag distribution data regardless of Promise.all execution order
    mockExecute.mockResolvedValue([
      { tag: 'python', count: '15' },
      { tag: 'ml', count: '8' },
    ]);

    const result = await getKnowledgeInsightsAction();
    expect(result.success).toBe(true);

    const pattern = result.data!.find((i) => i.title === 'Top Focus Area');
    expect(pattern).toBeDefined();
    expect(pattern!.description).toContain('python');
  });

  it('returns failure on error', async () => {
    // Make extractInsights throw to trigger the top-level catch in getKnowledgeInsightsAction
    mockExtractInsights.mockRejectedValue(new Error('AI service unavailable'));

    const result = await getKnowledgeInsightsAction();
    expect(result.success).toBe(false);
    expect(result.message).toBe('Failed to generate insights');
  });
});

// ──────────────────────────────────────────────────────────────
// exportAnalyticsAction
// ──────────────────────────────────────────────────────────────
describe('exportAnalyticsAction', () => {
  it('returns unauthorized when no session', async () => {
    mockAuth.mockResolvedValue(null);
    const result = await exportAnalyticsAction();
    expect(result.success).toBe(false);
    expect(result.message).toBe('Unauthorized');
  });

  it('returns combined analytics data on success', async () => {
    // Overview stats
    const selectResults = [
      [{ count: 30 }],  // totalItems
      [{ count: 5 }],   // thisMonth
      [{ count: 2 }],   // collections
    ];
    let callIdx = 0;

    mockSelect.mockImplementation(() => {
      const result = selectResults[callIdx++] || [{ count: 0 }];
      const mockFromFn = vi.fn(() => ({
        where: vi.fn().mockResolvedValue(result),
        leftJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            groupBy: vi.fn(() => ({
              orderBy: vi.fn().mockResolvedValue([]),
            })),
          })),
        })),
      }));
      return { from: mockFromFn };
    });

    // db.execute calls: overview tags, content growth, tag distribution
    mockExecute
      .mockResolvedValueOnce([{ tag_count: '10' }]) // overview tags
      .mockResolvedValueOnce([])                     // content growth (year)
      .mockResolvedValueOnce([{ tag: 'js', count: '5' }]); // tag distribution

    const result = await exportAnalyticsAction();
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.exportedAt).toBeDefined();
    expect(result.data!.overview).toBeDefined();
  });

  it('returns failure on error', async () => {
    // Make auth throw to trigger the top-level catch in exportAnalyticsAction
    mockAuth.mockRejectedValue(new Error('Auth service unavailable'));

    const result = await exportAnalyticsAction();
    expect(result.success).toBe(false);
    expect(result.message).toBe('Failed to export analytics data');
  });
});
