import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processBrainDumpAction, saveBrainDumpNotesAction } from './brain-dump';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock database
vi.mock('@/lib/db/client', () => {
  const createChain = () => {
    const chain: Record<string, unknown> = {};
    const methods = ['from', 'where', 'innerJoin', 'leftJoin', 'orderBy', 'groupBy', 'limit', 'offset', 'set', 'values', 'returning', 'onConflictDoNothing'];
    for (const method of methods) {
      chain[method] = vi.fn().mockReturnValue(chain);
    }
    chain.then = (resolve: (v: unknown[]) => unknown) => Promise.resolve([]).then(resolve);
    return chain;
  };

  return {
    db: {
      select: vi.fn().mockReturnValue(createChain()),
      insert: vi.fn().mockReturnValue(createChain()),
      update: vi.fn().mockReturnValue(createChain()),
      delete: vi.fn().mockReturnValue(createChain()),
      execute: vi.fn().mockResolvedValue([]),
    },
  };
});

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// Mock AI brain dump
vi.mock('@/lib/ai/brain-dump', () => ({
  processBrainDump: vi.fn(),
}));

// Mock embeddings
vi.mock('@/lib/ai/embeddings', () => ({
  upsertContentEmbedding: vi.fn().mockResolvedValue(undefined),
}));

// Mock neo4j sync
vi.mock('@/lib/neo4j/sync', () => ({
  syncContentToNeo4j: vi.fn().mockResolvedValue(undefined),
}));

// Mock badges
vi.mock('./badges', () => ({
  checkAndUnlockBadgesAction: vi.fn().mockResolvedValue({ success: true, newlyUnlocked: [] }),
}));

// Mock rate limit
vi.mock('@/lib/rate-limit', () => ({
  checkServerActionRateLimit: vi.fn().mockReturnValue({ success: true }),
  RATE_LIMITS: {
    serverActionAI: { maxRequests: 20, windowMs: 60000 },
    serverActionBulk: { maxRequests: 10, windowMs: 60000 },
  },
}));

// Mock cache tags
vi.mock('@/lib/cache', () => ({
  CacheTags: { ANALYTICS: 'analytics', CONTENT: 'content' },
}));

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { processBrainDump } from '@/lib/ai/brain-dump';
import { upsertContentEmbedding } from '@/lib/ai/embeddings';
import { syncContentToNeo4j } from '@/lib/neo4j/sync';
import { checkAndUnlockBadgesAction } from './badges';
import { checkServerActionRateLimit } from '@/lib/rate-limit';

const mockSession = {
  user: { id: 'user-1', email: 'test@example.com' },
  expires: '',
};

function mockDbInsert(ids: string[]) {
  const insertChain: Record<string, unknown> = {};
  const methods = ['values', 'onConflictDoNothing'];
  for (const method of methods) {
    insertChain[method] = vi.fn().mockReturnValue(insertChain);
  }
  const rows = ids.map((id) => ({ id }));
  insertChain.returning = vi.fn().mockResolvedValue(rows);
  vi.mocked(db.insert).mockReturnValue(insertChain as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth).mockResolvedValue(mockSession as never);
  vi.mocked(checkServerActionRateLimit).mockReturnValue({ success: true } as never);
});

describe('processBrainDumpAction', () => {
  it('returns unauthorized when not logged in', async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const result = await processBrainDumpAction('some text here that is long enough to pass');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Unauthorized. Please log in.');
  });

  it('returns error for text shorter than 50 chars', async () => {
    const result = await processBrainDumpAction('too short');
    expect(result.success).toBe(false);
    expect(result.message).toContain('at least 50 characters');
  });

  it('returns error for text longer than 10000 chars', async () => {
    const result = await processBrainDumpAction('a'.repeat(10001));
    expect(result.success).toBe(false);
    expect(result.message).toContain('at most 10,000 characters');
  });

  it('returns rate limit error when exceeded', async () => {
    vi.mocked(checkServerActionRateLimit).mockReturnValue({
      success: false,
      message: 'Rate limit exceeded',
    } as never);

    const result = await processBrainDumpAction('a'.repeat(100));
    expect(result.success).toBe(false);
    expect(result.message).toBe('Rate limit exceeded');
  });

  it('calls processBrainDump with valid input', async () => {
    const mockResult = {
      notes: [
        { title: 'Test Note', body: 'Content', tags: ['test'], actionItems: [] },
      ],
      summary: 'Extracted 1 note',
    };
    vi.mocked(processBrainDump).mockResolvedValue(mockResult);

    const validText = 'This is a brain dump with enough text to pass the 50 character minimum validation.';
    const result = await processBrainDumpAction(validText);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockResult);
    expect(processBrainDump).toHaveBeenCalledWith({ rawText: validText });
  });

  it('returns error when AI processing fails', async () => {
    vi.mocked(processBrainDump).mockRejectedValue(new Error('AI error'));

    const validText = 'This is a brain dump with enough text to pass the 50 character minimum validation.';
    const result = await processBrainDumpAction(validText);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Failed to process');
  });

  it('returns summary from AI result', async () => {
    const mockResult = {
      notes: [{ title: 'Note 1', body: 'Body', tags: ['a'], actionItems: [] }],
      summary: 'Extracted 1 note from your brain dump',
    };
    vi.mocked(processBrainDump).mockResolvedValue(mockResult);

    const validText = 'This is a brain dump with enough text to pass the 50 character minimum validation.';
    const result = await processBrainDumpAction(validText);

    expect(result.message).toBe('Extracted 1 note from your brain dump');
  });
});

describe('saveBrainDumpNotesAction', () => {
  const validInput = {
    notes: [
      { title: 'Note 1', body: 'Body 1', tags: ['tag1'], actionItems: ['Do thing'] },
      { title: 'Note 2', body: 'Body 2', tags: ['tag2'], actionItems: [] },
    ],
    sourceText: 'Original brain dump text',
  };

  it('returns unauthorized when not logged in', async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const result = await saveBrainDumpNotesAction(validInput);
    expect(result.success).toBe(false);
    expect(result.message).toBe('Unauthorized. Please log in.');
  });

  it('returns rate limit error when exceeded', async () => {
    vi.mocked(checkServerActionRateLimit).mockReturnValue({
      success: false,
      message: 'Rate limit exceeded',
    } as never);

    const result = await saveBrainDumpNotesAction(validInput);
    expect(result.success).toBe(false);
    expect(result.message).toBe('Rate limit exceeded');
  });

  it('returns error for empty notes array', async () => {
    const result = await saveBrainDumpNotesAction({ notes: [] });
    expect(result.success).toBe(false);
    expect(result.message).toContain('At least one note');
  });

  it('returns error for notes with missing title', async () => {
    const result = await saveBrainDumpNotesAction({
      notes: [{ title: '', body: 'Body', tags: [], actionItems: [] }],
    });
    expect(result.success).toBe(false);
  });

  it('inserts notes into database with correct metadata', async () => {
    mockDbInsert(['id-1', 'id-2']);

    const result = await saveBrainDumpNotesAction(validInput);

    expect(result.success).toBe(true);
    expect(result.data?.ids).toEqual(['id-1', 'id-2']);
    expect(db.insert).toHaveBeenCalled();
  });

  it('fires embeddings for each note', async () => {
    mockDbInsert(['id-1', 'id-2']);

    await saveBrainDumpNotesAction(validInput);

    expect(upsertContentEmbedding).toHaveBeenCalledWith('id-1');
    expect(upsertContentEmbedding).toHaveBeenCalledWith('id-2');
  });

  it('fires neo4j sync for each note', async () => {
    mockDbInsert(['id-1', 'id-2']);

    await saveBrainDumpNotesAction(validInput);

    expect(syncContentToNeo4j).toHaveBeenCalledWith('id-1');
    expect(syncContentToNeo4j).toHaveBeenCalledWith('id-2');
  });

  it('checks badge unlocks for content_created and brain_dump_processed', async () => {
    mockDbInsert(['id-1']);

    await saveBrainDumpNotesAction({
      notes: [{ title: 'Note', tags: [], actionItems: [] }],
    });

    expect(checkAndUnlockBadgesAction).toHaveBeenCalledWith('content_created');
    expect(checkAndUnlockBadgesAction).toHaveBeenCalledWith('brain_dump_processed');
  });

  it('returns success message with note count', async () => {
    mockDbInsert(['id-1', 'id-2', 'id-3']);

    const result = await saveBrainDumpNotesAction({
      notes: [
        { title: 'A', tags: [], actionItems: [] },
        { title: 'B', tags: [], actionItems: [] },
        { title: 'C', tags: [], actionItems: [] },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('3 notes');
  });

  it('handles database errors gracefully', async () => {
    vi.mocked(db.insert).mockImplementation(() => {
      throw new Error('DB error');
    });

    const result = await saveBrainDumpNotesAction(validInput);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Failed to save');
  });
});
