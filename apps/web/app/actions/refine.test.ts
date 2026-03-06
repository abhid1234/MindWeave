import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockAuth, mockDbSelect, mockRefineContent } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDbSelect: vi.fn(),
  mockRefineContent: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

vi.mock('@/lib/db/client', () => {
  const makeChain = () => {
    const chain: Record<string, unknown> = {};
    chain.from = () => chain;
    chain.where = () => chain;
    chain.orderBy = () => chain;
    chain.limit = () => mockDbSelect();
    chain.then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) =>
      Promise.resolve(mockDbSelect()).then(resolve, reject);
    return chain;
  };

  return {
    db: {
      select: () => makeChain(),
    },
  };
});

vi.mock('@/lib/db/schema', () => ({
  content: {
    id: 'id',
    userId: 'user_id',
    body: 'body',
  },
}));

vi.mock('@/lib/ai/refine', () => ({
  refineContent: (...args: unknown[]) => mockRefineContent(...args),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkServerActionRateLimit: () => ({ success: true }),
  RATE_LIMITS: {
    serverActionAI: { maxRequests: 20, windowMs: 60000 },
  },
}));

import { refineContentAction } from './refine';

const validInput = {
  contentId: '00000000-0000-0000-0000-000000000001',
  tone: 'professional' as const,
};

describe('refineContentAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return error when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await refineContentAction(validInput);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Unauthorized');
  });

  it('should return error for invalid input (missing contentId)', async () => {
    const result = await refineContentAction({ tone: 'professional' });

    expect(result.success).toBe(false);
    expect(result.message).toBeDefined();
  });

  it('should return error for invalid tone', async () => {
    const result = await refineContentAction({
      contentId: '00000000-0000-0000-0000-000000000001',
      tone: 'angry',
    });

    expect(result.success).toBe(false);
  });

  it('should return error for non-uuid contentId', async () => {
    const result = await refineContentAction({
      contentId: 'not-a-uuid',
      tone: 'professional',
    });

    expect(result.success).toBe(false);
  });

  it('should return error when content not found', async () => {
    mockDbSelect.mockResolvedValueOnce([]);

    const result = await refineContentAction(validInput);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Content not found');
  });

  it('should return error when content has no body', async () => {
    mockDbSelect.mockResolvedValueOnce([{ id: validInput.contentId, body: null }]);

    const result = await refineContentAction(validInput);

    expect(result.success).toBe(false);
    expect(result.message).toContain('no body text');
  });

  it('should return error when content body is empty string', async () => {
    mockDbSelect.mockResolvedValueOnce([{ id: validInput.contentId, body: '' }]);

    const result = await refineContentAction(validInput);

    expect(result.success).toBe(false);
    expect(result.message).toContain('no body text');
  });

  it('should call refineContent with correct parameters', async () => {
    mockDbSelect.mockResolvedValueOnce([
      { id: validInput.contentId, body: 'Original messy text' },
    ]);
    mockRefineContent.mockResolvedValueOnce('Polished professional text');

    const result = await refineContentAction(validInput);

    expect(result.success).toBe(true);
    expect(result.refined).toBe('Polished professional text');
    expect(result.original).toBe('Original messy text');
    expect(mockRefineContent).toHaveBeenCalledWith({
      text: 'Original messy text',
      tone: 'professional',
      customInstruction: undefined,
    });
  });

  it('should pass custom instruction to AI', async () => {
    mockDbSelect.mockResolvedValueOnce([
      { id: validInput.contentId, body: 'Some text' },
    ]);
    mockRefineContent.mockResolvedValueOnce('Refined with bullets');

    const result = await refineContentAction({
      ...validInput,
      customInstruction: 'Use bullet points',
    });

    expect(result.success).toBe(true);
    expect(mockRefineContent).toHaveBeenCalledWith({
      text: 'Some text',
      tone: 'professional',
      customInstruction: 'Use bullet points',
    });
  });

  it('should handle AI error gracefully', async () => {
    mockDbSelect.mockResolvedValueOnce([
      { id: validInput.contentId, body: 'Some text' },
    ]);
    mockRefineContent.mockRejectedValueOnce(new Error('AI error'));

    const result = await refineContentAction(validInput);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Failed to refine');
  });

  it('should validate custom instruction max length', async () => {
    const result = await refineContentAction({
      ...validInput,
      customInstruction: 'a'.repeat(201),
    });

    expect(result.success).toBe(false);
  });

  it('should work with all valid tones', async () => {
    const tones = ['professional', 'casual', 'academic', 'concise'] as const;

    for (const tone of tones) {
      vi.clearAllMocks();
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });
      mockDbSelect.mockResolvedValueOnce([
        { id: validInput.contentId, body: 'Text' },
      ]);
      mockRefineContent.mockResolvedValueOnce(`Refined in ${tone}`);

      const result = await refineContentAction({
        contentId: validInput.contentId,
        tone,
      });

      expect(result.success).toBe(true);
      expect(result.refined).toBe(`Refined in ${tone}`);
    }
  });
});
