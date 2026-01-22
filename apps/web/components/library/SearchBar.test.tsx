import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchBar } from './SearchBar';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

describe('SearchBar', () => {
  const mockPush = vi.fn();
  let mockSearchParams: URLSearchParams;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any);
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as any);
  });

  it('renders search input', () => {
    render(<SearchBar />);
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it('renders with search icon', () => {
    render(<SearchBar />);
    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput.parentElement).toContainHTML('svg');
  });

  it('initializes with empty value when no query param', () => {
    render(<SearchBar />);
    const input = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('initializes with query param value', () => {
    mockSearchParams.set('query', 'React');
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as any);

    render(<SearchBar />);
    const input = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
    expect(input.value).toBe('React');
  });

  it('updates input value on typing', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByPlaceholderText(/search/i);
    await user.type(input, 'JavaScript');

    expect(input).toHaveValue('JavaScript');
  });

  it('debounces search updates', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByPlaceholderText(/search/i);
    await user.type(input, 'React');

    // Should not call immediately
    expect(mockPush).not.toHaveBeenCalled();

    // Wait for debounce (300ms)
    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalled();
      },
      { timeout: 500 }
    );
  });

  it('adds query parameter to URL when searching', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByPlaceholderText(/search/i);
    await user.type(input, 'TypeScript');

    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('query=TypeScript')
        );
      },
      { timeout: 500 }
    );
  });

  it('removes query parameter when search is cleared', async () => {
    mockSearchParams.set('query', 'React');
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as any);

    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByPlaceholderText(/search/i);
    await user.clear(input);

    await waitFor(
      () => {
        const lastCall = mockPush.mock.calls[mockPush.mock.calls.length - 1];
        expect(lastCall[0]).not.toContain('query=');
      },
      { timeout: 500 }
    );
  });

  it('shows clear button when query has value', () => {
    mockSearchParams.set('query', 'React');
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as any);

    render(<SearchBar />);

    // Find button containing X icon or clear button
    const clearButton = screen.getByRole('button');
    expect(clearButton).toBeInTheDocument();
  });

  it('does not show clear button when query is empty', () => {
    render(<SearchBar />);

    // Should not have any buttons when empty
    const buttons = screen.queryAllByRole('button');
    expect(buttons.length).toBe(0);
  });

  it('clears input when clear button is clicked', async () => {
    mockSearchParams.set('query', 'React');
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as any);

    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
    expect(input.value).toBe('React');

    const clearButton = screen.getByRole('button');
    await user.click(clearButton);

    expect(input.value).toBe('');
  });

  it('preserves existing URL parameters when adding query', async () => {
    mockSearchParams.set('type', 'note');
    mockSearchParams.set('sortBy', 'title');
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as any);

    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByPlaceholderText(/search/i);
    await user.type(input, 'Test');

    await waitFor(
      () => {
        const lastCall = mockPush.mock.calls[mockPush.mock.calls.length - 1];
        expect(lastCall[0]).toContain('type=note');
        expect(lastCall[0]).toContain('sortBy=title');
        expect(lastCall[0]).toContain('query=Test');
      },
      { timeout: 500 }
    );
  });

  it('trims whitespace from search query', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByPlaceholderText(/search/i);
    await user.type(input, '  React  ');

    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('query=React')
        );
        expect(mockPush).not.toHaveBeenCalledWith(
          expect.stringContaining('query=%20%20React')
        );
      },
      { timeout: 500 }
    );
  });

  it('does not add query parameter for whitespace-only input', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByPlaceholderText(/search/i);
    await user.type(input, '   ');

    await waitFor(
      () => {
        const lastCall = mockPush.mock.calls[mockPush.mock.calls.length - 1];
        expect(lastCall[0]).not.toContain('query=');
      },
      { timeout: 500 }
    );
  });

  it('handles rapid typing correctly with debounce', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByPlaceholderText(/search/i);

    // Type quickly
    await user.type(input, 'ABCDEF');

    // Should only call once after debounce
    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledTimes(1);
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('query=ABCDEF')
        );
      },
      { timeout: 500 }
    );
  });

  it('updates URL when query changes', async () => {
    mockSearchParams.set('query', 'React');
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as any);

    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByPlaceholderText(/search/i);
    await user.clear(input);
    await user.type(input, 'Vue');

    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('query=Vue')
        );
      },
      { timeout: 500 }
    );
  });

  it('has accessible label for clear button', () => {
    mockSearchParams.set('query', 'React');
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as any);

    render(<SearchBar />);

    const clearButton = screen.getByRole('button');
    expect(clearButton).toHaveAttribute('aria-label', 'Clear search');
  });

  it('has correct input placeholder text', () => {
    render(<SearchBar />);
    expect(screen.getByPlaceholderText('Search notes, links, and files...')).toBeInTheDocument();
  });
});
