import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockAuth,
  mockReturning,
  mockWhere,
  mockSet,
  mockSafeParse,
  mockGenerateTags,
  mockUpsertEmbedding,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockReturning: vi.fn(),
  mockWhere: vi.fn(),
  mockSet: vi.fn(),
  mockSafeParse: vi.fn(),
  mockGenerateTags: vi.fn(),
  mockUpsertEmbedding: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

vi.mock('@/lib/db/client', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: (...args: unknown[]) => mockWhere(...args),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: mockReturning,
      }),
    }),
    update: (...args: unknown[]) => mockSet(...args),
  },
}));

vi.mock('@/lib/db/schema', () => ({
  content: {
    id: 'id',
    userId: 'userId',
    type: 'type',
    title: 'title',
    body: 'body',
    url: 'url',
    tags: 'tags',
    autoTags: 'autoTags',
    createdAt: 'createdAt',
    metadata: 'metadata',
  },
}));

vi.mock('@/lib/validations', () => ({
  bulkImportSchema: {
    safeParse: (...args: unknown[]) => mockSafeParse(...args),
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  checkServerActionRateLimit: () => ({ success: true }),
  RATE_LIMITS: {
    serverActionBulk: { maxRequests: 10, windowMs: 60000 },
  },
}));

vi.mock('@/lib/ai/gemini', () => ({
  generateTags: (...args: unknown[]) => mockGenerateTags(...args),
}));

vi.mock('@/lib/ai/embeddings', () => ({
  upsertContentEmbedding: (...args: unknown[]) => mockUpsertEmbedding(...args),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: unknown[]) => ({ op: 'eq', args })),
  and: vi.fn((...args: unknown[]) => ({ op: 'and', args })),
  or: vi.fn((...args: unknown[]) => ({ op: 'or', args })),
  inArray: vi.fn((...args: unknown[]) => ({ op: 'inArray', args })),
}));

vi.mock('@/lib/import/utils', () => ({
  batchArray: vi.fn((arr: unknown[], size: number) => {
    const batches: unknown[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      batches.push(arr.slice(i, i + size));
    }
    return batches;
  }),
  normalizeTags: vi.fn((tags: string[]) => tags.map((t: string) => t.toLowerCase().trim()).filter(Boolean)),
}));

import { importContentAction } from './import';

function makeItem(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Test Item',
    url: 'https://example.com',
    tags: ['test'],
    type: 'link' as const,
    body: '',
    metadata: { source: 'bookmarks' as const },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  // Default: authenticated
  mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
  // Default: validation passes
  mockSafeParse.mockImplementation((input: { items: unknown[] }) => ({
    success: true,
    data: { items: input.items, options: {} },
  }));
  // Default: no existing content (no duplicates)
  mockWhere.mockResolvedValue([]);
  // Default: insert returns ids
  mockReturning.mockResolvedValue([{ id: 'new-id-1' }]);
  // Default: AI calls succeed
  mockGenerateTags.mockResolvedValue(['auto-tag']);
  mockUpsertEmbedding.mockResolvedValue(undefined);
  // Default: update succeeds
  mockSet.mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) });
});

// ============================================================
// 1. Authentication
// ============================================================
describe('importContentAction - Authentication', () => {
  it('returns unauthorized when no session', async () => {
    mockAuth.mockResolvedValue(null);
    const result = await importContentAction([makeItem()]);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Unauthorized');
    expect(result.imported).toBe(0);
  });

  it('returns unauthorized when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} });
    const result = await importContentAction([makeItem()]);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Unauthorized');
  });

  it('proceeds when session exists', async () => {
    const result = await importContentAction([makeItem()]);
    expect(result.success).toBe(true);
    expect(result.imported).toBe(1);
  });
});

// ============================================================
// 2. Validation
// ============================================================
describe('importContentAction - Validation', () => {
  it('rejects when validation fails (empty items)', async () => {
    mockSafeParse.mockReturnValue({
      success: false,
      error: { errors: [{ message: 'At least one item is required' }] },
    });
    const result = await importContentAction([]);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Validation failed');
  });

  it('rejects items exceeding 1000 limit', async () => {
    mockSafeParse.mockReturnValue({
      success: false,
      error: { errors: [{ message: 'Too many items' }] },
    });
    const items = Array.from({ length: 1001 }, () => makeItem());
    const result = await importContentAction(items);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Too many items');
  });

  it('rejects items with missing title', async () => {
    mockSafeParse.mockReturnValue({
      success: false,
      error: { errors: [{ message: 'Title is required' }] },
    });
    const result = await importContentAction([makeItem({ title: '' })]);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Title is required');
  });

  it('rejects items with invalid URL format', async () => {
    mockSafeParse.mockReturnValue({
      success: false,
      error: { errors: [{ message: 'Invalid URL' }] },
    });
    const result = await importContentAction([makeItem({ url: 'not-a-url' })]);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Invalid URL');
  });
});

// ============================================================
// 3. Duplicate Detection
// ============================================================
describe('importContentAction - Duplicate Detection', () => {
  it('skips links with existing URLs in DB', async () => {
    mockWhere
      .mockResolvedValueOnce([{ url: 'https://example.com' }]) // existing URLs
      .mockResolvedValueOnce([]); // existing titles

    const result = await importContentAction([makeItem({ url: 'https://example.com' })]);
    expect(result.skipped).toBe(1);
    expect(result.imported).toBe(0);
  });

  it('skips notes with existing titles in DB', async () => {
    const item = makeItem({ type: 'note', title: 'Existing Note', url: undefined });

    // Note has no URL, so linkUrls is empty and only the title query fires.
    // Return existing note title from DB.
    mockWhere.mockReset();
    mockWhere.mockResolvedValue([{ title: 'existing note' }]);

    const result = await importContentAction([item]);
    expect(result.skipped).toBe(1);
    expect(result.imported).toBe(0);
  });

  it('deduplicates within same import batch (two items with same URL)', async () => {
    mockReturning.mockResolvedValue([{ id: 'id-1' }]);

    const result = await importContentAction([
      makeItem({ title: 'First', url: 'https://same.com' }),
      makeItem({ title: 'Second', url: 'https://same.com' }),
    ]);
    // First should be imported, second should be skipped (added to existingUrls set)
    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(1);
  });

  it('imports all when skipDuplicates is false', async () => {
    mockReturning.mockResolvedValue([{ id: 'id-1' }, { id: 'id-2' }]);

    const result = await importContentAction(
      [
        makeItem({ title: 'First', url: 'https://same.com' }),
        makeItem({ title: 'Second', url: 'https://same.com' }),
      ],
      { skipDuplicates: false }
    );
    expect(result.imported).toBe(2);
    expect(result.skipped).toBe(0);
  });

  it('performs case-insensitive URL matching', async () => {
    // The code passes original-case URLs to inArray, and the DB returns them.
    // Then it lowercases the returned URLs when building the Set.
    // The item URL is also lowercased for the `.has()` check.
    mockWhere
      .mockResolvedValueOnce([{ url: 'https://EXAMPLE.COM/PATH' }])
      .mockResolvedValueOnce([]);

    const result = await importContentAction([
      makeItem({ url: 'https://EXAMPLE.COM/PATH' }),
    ]);
    expect(result.skipped).toBe(1);
  });
});

// ============================================================
// 4. Batch Processing
// ============================================================
describe('importContentAction - Batch Processing', () => {
  it('imports single item successfully', async () => {
    mockReturning.mockResolvedValue([{ id: 'new-1' }]);
    const result = await importContentAction([makeItem()]);
    expect(result.success).toBe(true);
    expect(result.imported).toBe(1);
    expect(result.createdIds).toEqual(['new-1']);
  });

  it('imports multiple items across batches (>10 items)', async () => {
    const items = Array.from({ length: 12 }, (_, i) =>
      makeItem({ title: `Item ${i}`, url: `https://example.com/${i}` })
    );
    mockSafeParse.mockImplementation((input: { items: unknown[] }) => ({
      success: true,
      data: { items: input.items, options: {} },
    }));

    // First batch (10 items)
    mockReturning
      .mockResolvedValueOnce(
        Array.from({ length: 10 }, (_, i) => ({ id: `id-${i}` }))
      )
      // Second batch (2 items)
      .mockResolvedValueOnce([{ id: 'id-10' }, { id: 'id-11' }]);

    const result = await importContentAction(items);
    expect(result.imported).toBe(12);
    expect(result.createdIds).toHaveLength(12);
  });

  it('handles partial batch failure (DB error on one batch)', async () => {
    const items = Array.from({ length: 12 }, (_, i) =>
      makeItem({ title: `Item ${i}`, url: `https://example.com/${i}` })
    );
    mockSafeParse.mockImplementation((input: { items: unknown[] }) => ({
      success: true,
      data: { items: input.items, options: {} },
    }));

    // First batch succeeds
    mockReturning
      .mockResolvedValueOnce(
        Array.from({ length: 10 }, (_, i) => ({ id: `id-${i}` }))
      )
      // Second batch fails
      .mockRejectedValueOnce(new Error('DB connection lost'));

    const result = await importContentAction(items);
    expect(result.imported).toBe(10);
    expect(result.failed).toBe(2);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0].reason).toBe('DB connection lost');
  });
});

// ============================================================
// 5. Options
// ============================================================
describe('importContentAction - Options', () => {
  it('merges additionalTags with item tags', async () => {
    const { db } = await import('@/lib/db/client');
    mockReturning.mockResolvedValue([{ id: 'new-1' }]);

    await importContentAction([makeItem({ tags: ['original'] })], {
      additionalTags: ['extra'],
    });

    // The insert should have been called with merged tags
    const insertCall = (db.insert as ReturnType<typeof vi.fn>).mock.results[0];
    // Verify via the values call
    const valuesCall = insertCall.value.values;
    const insertedValues = valuesCall.mock.calls[0][0];
    expect(insertedValues[0].tags).toEqual(expect.arrayContaining(['original', 'extra']));
  });

  it('calls generateTags when generateAutoTags=true', async () => {
    mockReturning.mockResolvedValue([{ id: 'new-1' }]);

    await importContentAction([makeItem()], { generateAutoTags: true });

    // Allow async fire-and-forget to resolve
    await new Promise((r) => setTimeout(r, 10));
    expect(mockGenerateTags).toHaveBeenCalled();
  });

  it('calls upsertContentEmbedding when generateEmbeddings=true', async () => {
    mockReturning.mockResolvedValue([{ id: 'new-1' }]);

    await importContentAction([makeItem()], { generateEmbeddings: true });

    await new Promise((r) => setTimeout(r, 10));
    expect(mockUpsertEmbedding).toHaveBeenCalledWith('new-1');
  });

  it('skips AI calls when options are false', async () => {
    mockReturning.mockResolvedValue([{ id: 'new-1' }]);

    await importContentAction([makeItem()], {
      generateAutoTags: false,
      generateEmbeddings: false,
    });

    await new Promise((r) => setTimeout(r, 10));
    expect(mockGenerateTags).not.toHaveBeenCalled();
    expect(mockUpsertEmbedding).not.toHaveBeenCalled();
  });
});

// ============================================================
// 6. Data Integrity
// ============================================================
describe('importContentAction - Data Integrity', () => {
  it('handles invalid createdAt date (falls back to now)', async () => {
    const { db } = await import('@/lib/db/client');
    mockReturning.mockResolvedValue([{ id: 'new-1' }]);

    const item = makeItem({ createdAt: 'invalid-date' });
    // Make safeParse return the item with the invalid date preserved
    mockSafeParse.mockReturnValue({
      success: true,
      data: { items: [{ ...item, createdAt: 'invalid-date' }], options: {} },
    });

    await importContentAction([item]);

    const valuesCall = (db.insert as ReturnType<typeof vi.fn>).mock.results[0].value.values;
    const insertedValues = valuesCall.mock.calls[0][0];
    const createdAt = insertedValues[0].createdAt;
    expect(createdAt).toBeInstanceOf(Date);
    expect(isNaN(createdAt.getTime())).toBe(false);
  });

  it('handles ISO string createdAt', async () => {
    const { db } = await import('@/lib/db/client');
    const isoDate = '2024-01-15T10:30:00.000Z';
    mockReturning.mockResolvedValue([{ id: 'new-1' }]);

    mockSafeParse.mockReturnValue({
      success: true,
      data: { items: [{ ...makeItem(), createdAt: isoDate }], options: {} },
    });

    await importContentAction([makeItem()]);

    const valuesCall = (db.insert as ReturnType<typeof vi.fn>).mock.results[0].value.values;
    const insertedValues = valuesCall.mock.calls[0][0];
    expect(insertedValues[0].createdAt).toEqual(new Date(isoDate));
  });

  it('sets metadata.importedAt on all items', async () => {
    const { db } = await import('@/lib/db/client');
    mockReturning.mockResolvedValue([{ id: 'new-1' }]);

    await importContentAction([makeItem()]);

    const valuesCall = (db.insert as ReturnType<typeof vi.fn>).mock.results[0].value.values;
    const insertedValues = valuesCall.mock.calls[0][0];
    expect(insertedValues[0].metadata).toHaveProperty('importedAt');
    expect(typeof insertedValues[0].metadata.importedAt).toBe('string');
  });

  it('normalizes tags via normalizeTags', async () => {
    const { normalizeTags } = await import('@/lib/import/utils');
    mockReturning.mockResolvedValue([{ id: 'new-1' }]);

    await importContentAction([makeItem({ tags: ['Tag One', 'TAG TWO'] })]);

    expect(normalizeTags).toHaveBeenCalled();
  });
});

// ============================================================
// 7. Result Messages
// ============================================================
describe('importContentAction - Result Messages', () => {
  it('returns correct message for successful import', async () => {
    mockReturning.mockResolvedValue([{ id: 'new-1' }]);
    const result = await importContentAction([makeItem()]);
    expect(result.message).toContain('Successfully imported 1 item');
  });

  it('returns correct message when all items are duplicates', async () => {
    mockWhere
      .mockResolvedValueOnce([{ url: 'https://example.com' }])
      .mockResolvedValueOnce([]);

    const result = await importContentAction([makeItem()]);
    expect(result.success).toBe(true);
    expect(result.message).toContain('already exist');
    expect(result.skipped).toBe(1);
  });

  it('returns correct message on total failure', async () => {
    mockReturning.mockRejectedValue(new Error('DB down'));
    const result = await importContentAction([makeItem()]);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Failed to import');
    expect(result.failed).toBe(1);
  });
});
