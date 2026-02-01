import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAuth, mockGetSearchSuggestions } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetSearchSuggestions: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

vi.mock('@/lib/ai/search-suggestions', () => ({
  getSearchSuggestions: (...args: unknown[]) => mockGetSearchSuggestions(...args),
}));

import { getSearchSuggestionsAction } from './search-suggestions';

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
  mockGetSearchSuggestions.mockResolvedValue([]);
});

describe('getSearchSuggestionsAction', () => {
  it('returns unauthorized when no session', async () => {
    mockAuth.mockResolvedValue(null);
    const result = await getSearchSuggestionsAction('test');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Unauthorized');
    expect(result.suggestions).toEqual([]);
  });

  it('returns unauthorized when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} });
    const result = await getSearchSuggestionsAction('test');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Unauthorized');
  });

  it('returns suggestions on success', async () => {
    const mockSuggestions = [
      { text: 'javascript', type: 'related' },
      { text: 'react hooks', type: 'popular' },
    ];
    mockGetSearchSuggestions.mockResolvedValue(mockSuggestions);

    const result = await getSearchSuggestionsAction('java');
    expect(result.success).toBe(true);
    expect(result.suggestions).toEqual(mockSuggestions);
    expect(result.message).toBeUndefined();
  });

  it('passes query and recentSearches to getSearchSuggestions', async () => {
    await getSearchSuggestionsAction('test query', ['prev1', 'prev2']);
    expect(mockGetSearchSuggestions).toHaveBeenCalledWith('user-1', 'test query', ['prev1', 'prev2']);
  });

  it('defaults recentSearches to empty array', async () => {
    await getSearchSuggestionsAction('test');
    expect(mockGetSearchSuggestions).toHaveBeenCalledWith('user-1', 'test', []);
  });

  it('returns failure message on error', async () => {
    mockGetSearchSuggestions.mockRejectedValue(new Error('AI error'));
    const result = await getSearchSuggestionsAction('test');
    expect(result.success).toBe(false);
    expect(result.suggestions).toEqual([]);
    expect(result.message).toBe('Failed to get suggestions');
  });
});
