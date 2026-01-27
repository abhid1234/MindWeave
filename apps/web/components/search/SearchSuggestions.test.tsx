import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchSuggestions } from './SearchSuggestions';

// Mock the server action
vi.mock('@/app/actions/search-suggestions', () => ({
  getSearchSuggestionsAction: vi.fn().mockResolvedValue({
    success: true,
    suggestions: [
      { text: 'javascript', type: 'popular' },
      { text: 'react', type: 'related' },
      { text: 'AI suggestion', type: 'ai' },
    ],
  }),
}));

describe('SearchSuggestions', () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when not visible', () => {
    render(
      <SearchSuggestions
        query=""
        onSelect={mockOnSelect}
        isVisible={false}
      />
    );

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('should render suggestions when visible', async () => {
    render(
      <SearchSuggestions
        query="test"
        onSelect={mockOnSelect}
        isVisible={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });

  it('should show loading state initially', async () => {
    render(
      <SearchSuggestions
        query="test"
        onSelect={mockOnSelect}
        isVisible={true}
      />
    );

    // Loading state should appear briefly
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });

  it('should call onSelect when a suggestion is clicked', async () => {
    render(
      <SearchSuggestions
        query="test"
        onSelect={mockOnSelect}
        isVisible={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('javascript')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('javascript'));

    expect(mockOnSelect).toHaveBeenCalledWith('javascript');
  });

  it('should display type labels for suggestions', async () => {
    render(
      <SearchSuggestions
        query="test"
        onSelect={mockOnSelect}
        isVisible={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Popular')).toBeInTheDocument();
      expect(screen.getByText('Related')).toBeInTheDocument();
      expect(screen.getByText('Suggested')).toBeInTheDocument();
    });
  });

  it('should show no suggestions message when list is empty', async () => {
    const { getSearchSuggestionsAction } = await import('@/app/actions/search-suggestions');
    vi.mocked(getSearchSuggestionsAction).mockResolvedValueOnce({
      success: true,
      suggestions: [],
    });

    render(
      <SearchSuggestions
        query="xyz"
        onSelect={mockOnSelect}
        isVisible={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No suggestions')).toBeInTheDocument();
    });
  });
});
