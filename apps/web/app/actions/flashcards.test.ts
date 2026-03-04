import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock auth - use vi.hoisted to avoid hoisting issues
const { mockSession } = vi.hoisted(() => ({
  mockSession: { user: { id: 'user-1', email: 'test@test.com' } },
}));
vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue(mockSession),
}));

// Mock rate limiter
vi.mock('@/lib/rate-limit', () => ({
  checkServerActionRateLimit: vi.fn().mockReturnValue({ success: true }),
  RATE_LIMITS: {
    serverAction: { maxRequests: 60, windowMs: 60000 },
    serverActionAI: { maxRequests: 20, windowMs: 60000 },
  },
}));

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock AI generation
const mockGenerateFlashcards = vi.fn();
vi.mock('@/lib/ai/flashcards', () => ({
  generateFlashcards: (...args: unknown[]) => mockGenerateFlashcards(...args),
}));

// Mock badge engine
vi.mock('@/lib/badges/engine', () => ({
  checkBadgesForUser: vi.fn().mockResolvedValue([]),
}));

// Mock database
vi.mock('@/lib/db/client', () => {
  const createChain = () => {
    const chain: Record<string, unknown> = {};
    const methods = [
      'from', 'where', 'innerJoin', 'leftJoin', 'orderBy', 'groupBy',
      'limit', 'offset', 'set', 'values', 'returning', 'onConflictDoNothing',
    ];
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

import { db } from '@/lib/db/client';
import { auth } from '@/lib/auth';
import {
  generateFlashcardsAction,
  getDueFlashcardsAction,
  rateFlashcardAction,
  getStudyStatsAction,
  deleteFlashcardsAction,
} from './flashcards';

function mockDbSelectSequential(...results: unknown[][]) {
  let callCount = 0;
  vi.mocked(db.select).mockImplementation(() => {
    const idx = Math.min(callCount++, results.length - 1);
    const resolveValue = results[idx];
    const chain: Record<string, unknown> = {};
    const methods = [
      'from', 'where', 'innerJoin', 'leftJoin', 'orderBy', 'groupBy',
      'limit', 'offset', 'onConflictDoNothing',
    ];
    for (const method of methods) {
      chain[method] = vi.fn().mockReturnValue(chain);
    }
    chain.then = (resolve: (v: unknown) => unknown) => Promise.resolve(resolveValue).then(resolve);
    return chain as never;
  });
}

function mockDbInsert() {
  const insertChain: Record<string, unknown> = {};
  const methods = ['values', 'onConflictDoNothing', 'returning'];
  for (const method of methods) {
    insertChain[method] = vi.fn().mockReturnValue(insertChain);
  }
  insertChain.then = (resolve: (v: unknown[]) => unknown) => Promise.resolve([]).then(resolve);
  vi.mocked(db.insert).mockReturnValue(insertChain as never);
}

function mockDbDelete() {
  const deleteChain: Record<string, unknown> = {};
  const methods = ['where'];
  for (const method of methods) {
    deleteChain[method] = vi.fn().mockReturnValue(deleteChain);
  }
  deleteChain.then = (resolve: (v: unknown[]) => unknown) => Promise.resolve([]).then(resolve);
  vi.mocked(db.delete).mockReturnValue(deleteChain as never);
}

function mockDbUpdate() {
  const updateChain: Record<string, unknown> = {};
  const methods = ['set', 'where'];
  for (const method of methods) {
    updateChain[method] = vi.fn().mockReturnValue(updateChain);
  }
  updateChain.then = (resolve: (v: unknown[]) => unknown) => Promise.resolve([]).then(resolve);
  vi.mocked(db.update).mockReturnValue(updateChain as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth).mockResolvedValue(mockSession as never);
  mockDbInsert();
  mockDbDelete();
  mockDbUpdate();
});

describe('generateFlashcardsAction', () => {
  it('returns unauthorized when not logged in', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as never);
    const result = await generateFlashcardsAction({ contentId: '00000000-0000-0000-0000-000000000001' });
    expect(result.success).toBe(false);
    expect(result.message).toBe('Unauthorized');
  });

  it('returns error for invalid content ID', async () => {
    const result = await generateFlashcardsAction({ contentId: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('returns error when content not found', async () => {
    mockDbSelectSequential([]); // no content found
    const result = await generateFlashcardsAction({ contentId: '00000000-0000-0000-0000-000000000001' });
    expect(result.success).toBe(false);
    expect(result.message).toBe('Content not found');
  });

  it('generates and inserts flashcards successfully', async () => {
    mockDbSelectSequential([
      { id: '00000000-0000-0000-0000-000000000001', title: 'Test', body: 'Content', tags: [], autoTags: [] },
    ]);
    mockGenerateFlashcards.mockResolvedValue([
      { question: 'Q1?', answer: 'A1' },
      { question: 'Q2?', answer: 'A2' },
    ]);

    const result = await generateFlashcardsAction({ contentId: '00000000-0000-0000-0000-000000000001' });
    expect(result.success).toBe(true);
    expect(result.count).toBe(2);
    expect(db.delete).toHaveBeenCalled();
    expect(db.insert).toHaveBeenCalled();
  });

  it('returns error when AI generates no cards', async () => {
    mockDbSelectSequential([
      { id: '00000000-0000-0000-0000-000000000001', title: 'Test', body: null, tags: [], autoTags: [] },
    ]);
    mockGenerateFlashcards.mockResolvedValue([]);

    const result = await generateFlashcardsAction({ contentId: '00000000-0000-0000-0000-000000000001' });
    expect(result.success).toBe(false);
    expect(result.message).toBe('Could not generate flashcards for this content');
  });
});

describe('getDueFlashcardsAction', () => {
  it('returns unauthorized when not logged in', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as never);
    const result = await getDueFlashcardsAction();
    expect(result.success).toBe(false);
    expect(result.cards).toEqual([]);
  });

  it('returns due flashcards', async () => {
    const mockCards = [
      { id: 'card-1', question: 'Q?', answer: 'A', interval: '1d', contentTitle: 'Test', contentId: 'c-1' },
    ];
    mockDbSelectSequential(mockCards);

    const result = await getDueFlashcardsAction();
    expect(result.success).toBe(true);
    expect(result.cards).toEqual(mockCards);
  });
});

describe('rateFlashcardAction', () => {
  it('returns unauthorized when not logged in', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as never);
    const result = await rateFlashcardAction({ cardId: '00000000-0000-0000-0000-000000000001', rating: 'easy' });
    expect(result.success).toBe(false);
  });

  it('returns error when card not found', async () => {
    mockDbSelectSequential([]); // no card found
    const result = await rateFlashcardAction({ cardId: '00000000-0000-0000-0000-000000000001', rating: 'easy' });
    expect(result.success).toBe(false);
    expect(result.message).toBe('Flashcard not found');
  });

  it('advances interval on easy rating', async () => {
    mockDbSelectSequential([{ id: 'card-1', interval: '1d', reviewCount: 0 }]);

    const result = await rateFlashcardAction({ cardId: '00000000-0000-0000-0000-000000000001', rating: 'easy' });
    expect(result.success).toBe(true);
    expect(db.update).toHaveBeenCalled();
  });

  it('resets interval on again rating', async () => {
    mockDbSelectSequential([{ id: 'card-1', interval: '7d', reviewCount: 3 }]);

    const result = await rateFlashcardAction({ cardId: '00000000-0000-0000-0000-000000000001', rating: 'again' });
    expect(result.success).toBe(true);
    expect(db.update).toHaveBeenCalled();
  });

  it('keeps interval on hard rating', async () => {
    mockDbSelectSequential([{ id: 'card-1', interval: '3d', reviewCount: 1 }]);

    const result = await rateFlashcardAction({ cardId: '00000000-0000-0000-0000-000000000001', rating: 'hard' });
    expect(result.success).toBe(true);
  });
});

describe('getStudyStatsAction', () => {
  it('returns unauthorized when not logged in', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as never);
    const result = await getStudyStatsAction();
    expect(result.success).toBe(false);
  });

  it('returns study statistics', async () => {
    mockDbSelectSequential(
      [{ value: 10 }], // total cards
      [{ value: 3 }], // due today
      [{ value: 5 }], // reviewed today
    );
    vi.mocked(db.execute).mockResolvedValue([] as never);

    const result = await getStudyStatsAction();
    expect(result.success).toBe(true);
    expect(result.stats).toBeDefined();
    expect(result.stats!.totalCards).toBe(10);
    expect(result.stats!.dueToday).toBe(3);
  });
});

describe('deleteFlashcardsAction', () => {
  it('returns unauthorized when not logged in', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as never);
    const result = await deleteFlashcardsAction('00000000-0000-0000-0000-000000000001');
    expect(result.success).toBe(false);
  });

  it('returns error when content not found', async () => {
    mockDbSelectSequential([]);
    const result = await deleteFlashcardsAction('00000000-0000-0000-0000-000000000001');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Content not found');
  });

  it('deletes flashcards successfully', async () => {
    mockDbSelectSequential([{ id: '00000000-0000-0000-0000-000000000001' }]);

    const result = await deleteFlashcardsAction('00000000-0000-0000-0000-000000000001');
    expect(result.success).toBe(true);
    expect(db.delete).toHaveBeenCalled();
  });
});
