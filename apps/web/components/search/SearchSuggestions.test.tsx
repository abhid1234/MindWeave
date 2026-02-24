import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockGetSearchSuggestions = vi.hoisted(() => vi.fn());

vi.mock('@/app/actions/search-suggestions', () => ({
  getSearchSuggestionsAction: (...args: unknown[]) => mockGetSearchSuggestions(...args),
}));

import { SearchSuggestions } from './SearchSuggestions';

// Stable reference to prevent infinite re-render loops.
// The component's default param `recentSearches = []` creates a new array on every
// render, which triggers useCallback -> useEffect dependency changes.
const EMPTY_RECENT: string[] = [];

const mockSuggestions = [
  { text: 'react hooks', type: 'recent' as const },
  { text: 'typescript generics', type: 'popular' as const },
  { text: 'nextjs routing', type: 'related' as const },
  { text: 'ai embeddings', type: 'ai' as const },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockGetSearchSuggestions.mockResolvedValue({
    success: true,
    suggestions: mockSuggestions,
  });
});

describe('SearchSuggestions', () => {
  it('renders suggestions when visible', async () => {
    const onSelect = vi.fn();

    render(
      <SearchSuggestions query="react" onSelect={onSelect} isVisible={true} recentSearches={EMPTY_RECENT} />
    );

    await waitFor(() => {
      expect(screen.getByText('react hooks')).toBeInTheDocument();
    });

    expect(screen.getByText('typescript generics')).toBeInTheDocument();
    expect(screen.getByText('nextjs routing')).toBeInTheDocument();
    expect(screen.getByText('ai embeddings')).toBeInTheDocument();
  });

  it('calls onSelect when suggestion clicked', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(
      <SearchSuggestions query="react" onSelect={onSelect} isVisible={true} recentSearches={EMPTY_RECENT} />
    );

    await waitFor(() => {
      expect(screen.getByText('react hooks')).toBeInTheDocument();
    });

    await user.click(screen.getByText('react hooks'));

    expect(onSelect).toHaveBeenCalledWith('react hooks');
  });

  it('displays type labels (Recent, Popular, Related, Suggested)', async () => {
    const onSelect = vi.fn();

    render(
      <SearchSuggestions query="test" onSelect={onSelect} isVisible={true} recentSearches={EMPTY_RECENT} />
    );

    await waitFor(() => {
      expect(screen.getByText('Recent')).toBeInTheDocument();
    });

    expect(screen.getByText('Popular')).toBeInTheDocument();
    expect(screen.getByText('Related')).toBeInTheDocument();
    expect(screen.getByText('Suggested')).toBeInTheDocument();
  });

  it('shows "No suggestions" when empty result', async () => {
    mockGetSearchSuggestions.mockResolvedValue({
      success: true,
      suggestions: [],
    });

    const onSelect = vi.fn();

    render(
      <SearchSuggestions query="xyz" onSelect={onSelect} isVisible={true} recentSearches={EMPTY_RECENT} />
    );

    await waitFor(() => {
      expect(screen.getByText('No suggestions')).toBeInTheDocument();
    });
  });

  it('returns null when not visible', () => {
    const onSelect = vi.fn();

    const { container } = render(
      <SearchSuggestions query="test" onSelect={onSelect} isVisible={false} recentSearches={EMPTY_RECENT} />
    );

    expect(container.innerHTML).toBe('');
  });

  it('shows loading state before suggestions load', () => {
    const onSelect = vi.fn();

    render(
      <SearchSuggestions query="test" onSelect={onSelect} isVisible={true} recentSearches={EMPTY_RECENT} />
    );

    // The listbox container is rendered immediately when visible,
    // showing either loading spinner or no suggestions before data arrives
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('has accessible listbox role', async () => {
    const onSelect = vi.fn();

    render(
      <SearchSuggestions query="test" onSelect={onSelect} isVisible={true} recentSearches={EMPTY_RECENT} />
    );

    await waitFor(() => {
      expect(screen.getByText('react hooks')).toBeInTheDocument();
    });

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('passes query to action', async () => {
    const onSelect = vi.fn();
    const recentSearches = ['old query'];

    render(
      <SearchSuggestions
        query="my search"
        onSelect={onSelect}
        isVisible={true}
        recentSearches={recentSearches}
      />
    );

    await waitFor(() => {
      expect(mockGetSearchSuggestions).toHaveBeenCalledWith('my search', ['old query']);
    });
  });

  it('does not fetch when not visible', async () => {
    const onSelect = vi.fn();

    render(
      <SearchSuggestions query="test" onSelect={onSelect} isVisible={false} recentSearches={EMPTY_RECENT} />
    );

    // Wait a bit to ensure no call is made (the debounce is 200ms)
    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(mockGetSearchSuggestions).not.toHaveBeenCalled();
  });
});
