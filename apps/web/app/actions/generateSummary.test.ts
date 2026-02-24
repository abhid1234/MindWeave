import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockAuth,
  mockCheckServerActionRateLimit,
  mockRateLimits,
  mockSelectResult,
  mockUpdateData,
  mockGenerateSummary,
  mockRevalidatePath,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockCheckServerActionRateLimit: vi.fn(),
  mockRateLimits: { serverActionAI: { windowMs: 60000, maxRequests: 10 }, serverAction: { windowMs: 60000, maxRequests: 30 } },
  mockSelectResult: vi.fn(),
  mockUpdateData: vi.fn(),
  mockGenerateSummary: vi.fn(),
  mockRevalidatePath: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkServerActionRateLimit: (...args: unknown[]) => mockCheckServerActionRateLimit(...args),
  RATE_LIMITS: mockRateLimits,
}));

vi.mock('@/lib/db/client', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => mockSelectResult(),
          orderBy: () => mockSelectResult(),
        }),
        orderBy: () => mockSelectResult(),
      }),
    }),
    update: () => ({
      set: (data: Record<string, unknown>) => ({
        where: () => {
          mockUpdateData(data);
          return Promise.resolve();
        },
      }),
    }),
    insert: () => ({
      values: () => ({
        returning: () => Promise.resolve([{ id: 'new-id' }]),
        onConflictDoNothing: () => Promise.resolve(),
      }),
    }),
    delete: () => ({
      where: () => Promise.resolve(),
    }),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  content: { id: 'id', title: 'title', body: 'body', url: 'url', type: 'type', userId: 'userId', summary: 'summary' },
  contentCollections: {},
  contentVersions: {},
}));

vi.mock('@/lib/ai/summarization', () => ({
  generateSummary: (...args: unknown[]) => mockGenerateSummary(...args),
}));

vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
  revalidateTag: vi.fn(),
}));

vi.mock('@/lib/validations', () => ({
  createContentSchema: { safeParse: vi.fn() },
  updateContentSchema: { safeParse: vi.fn() },
}));

vi.mock('@/lib/ai/claude', () => ({
  generateTags: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/ai/embeddings', () => ({
  upsertContentEmbedding: vi.fn(),
}));

vi.mock('@/lib/cache', () => ({
  CacheTags: {},
}));

vi.mock('@/lib/storage', () => ({
  isGCSConfigured: vi.fn().mockReturnValue(false),
  deleteFromGCS: vi.fn(),
  extractGCSObjectPath: vi.fn(),
}));

import { generateSummaryAction } from './content';

beforeEach(() => {
  vi.clearAllMocks();

  // Default: authenticated user
  mockAuth.mockResolvedValue({ user: { id: 'user-1' } });

  // Default: rate limit passes
  mockCheckServerActionRateLimit.mockReturnValue({ success: true });

  // Default: DB select returns content owned by user
  mockSelectResult.mockResolvedValue([
    { id: 'content-1', title: 'Test Title', body: 'Test body content', url: null, type: 'note' },
  ]);

  // Default: summary generation succeeds
  mockGenerateSummary.mockResolvedValue('This is a generated summary.');
});

describe('generateSummaryAction', () => {
  it('returns unauthorized when no session', async () => {
    mockAuth.mockResolvedValue(null);

    const result = await generateSummaryAction('content-1');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Unauthorized. Please log in.');
    expect(result.summary).toBeUndefined();
  });

  it('returns error for invalid contentId', async () => {
    // Pass an empty string, which is falsy
    const result = await generateSummaryAction('');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Invalid content ID.');
    expect(result.summary).toBeUndefined();
  });

  it('returns error when content not found (not owned)', async () => {
    // DB returns empty array (content not found or not owned by user)
    mockSelectResult.mockResolvedValue([]);

    const result = await generateSummaryAction('content-nonexistent');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Content not found or access denied.');
    expect(result.summary).toBeUndefined();
  });

  it('successfully generates and stores summary', async () => {
    const result = await generateSummaryAction('content-1');

    expect(result.success).toBe(true);
    expect(result.message).toBe('Summary generated successfully!');
    expect(result.summary).toBe('This is a generated summary.');

    // Verify generateSummary was called with the content item
    expect(mockGenerateSummary).toHaveBeenCalledWith({
      title: 'Test Title',
      body: 'Test body content',
      url: null,
      type: 'note',
    });

    // Verify DB update stored the summary
    expect(mockUpdateData).toHaveBeenCalledWith({ summary: 'This is a generated summary.' });

    // Verify revalidatePath was called
    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/library');
  });

  it('returns error when generateSummary returns null', async () => {
    mockGenerateSummary.mockResolvedValue(null);

    const result = await generateSummaryAction('content-1');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Could not generate summary. Content may be too short.');
    expect(result.summary).toBeUndefined();

    // Verify DB update was NOT called
    expect(mockUpdateData).not.toHaveBeenCalled();

    // Verify revalidatePath was NOT called
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });
});
