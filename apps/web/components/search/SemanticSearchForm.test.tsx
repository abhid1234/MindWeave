import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SemanticSearchForm } from './SemanticSearchForm';

// Mock next/navigation
const mockPush = vi.fn();
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock the search action
const mockSemanticSearchAction = vi.fn();
vi.mock('@/app/actions/search', () => ({
  semanticSearchAction: (...args: any[]) => mockSemanticSearchAction(...args),
}));

describe('SemanticSearchForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSemanticSearchAction.mockResolvedValue({
      success: true,
      results: [],
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Rendering', () => {
    it('should render search input and button', () => {
      render(<SemanticSearchForm />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^search$/i })).toBeInTheDocument();
    });

    it('should render mode toggle buttons', () => {
      render(<SemanticSearchForm />);

      expect(screen.getByRole('button', { name: /keyword search/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /semantic search/i })).toBeInTheDocument();
    });

    it('should show initial query if provided', () => {
      render(<SemanticSearchForm initialQuery="test query" />);

      expect(screen.getByRole('textbox')).toHaveValue('test query');
    });

    it('should highlight keyword mode by default', () => {
      render(<SemanticSearchForm />);

      const keywordButton = screen.getByRole('button', { name: /keyword search/i });
      expect(keywordButton).toHaveClass('bg-primary');
    });

    it('should highlight semantic mode when initialMode is semantic', () => {
      render(<SemanticSearchForm initialMode="semantic" />);

      const semanticButton = screen.getByRole('button', { name: /semantic search/i });
      expect(semanticButton).toHaveClass('bg-primary');
    });
  });

  describe('Mode Toggle', () => {
    it('should switch to semantic mode when clicked', async () => {
      const user = userEvent.setup();
      render(<SemanticSearchForm />);

      const semanticButton = screen.getByRole('button', { name: /semantic search/i });
      await user.click(semanticButton);

      expect(semanticButton).toHaveClass('bg-primary');
      expect(screen.getByRole('button', { name: /keyword search/i })).not.toHaveClass('bg-primary');
    });

    it('should switch to keyword mode when clicked', async () => {
      const user = userEvent.setup();
      render(<SemanticSearchForm initialMode="semantic" />);

      const keywordButton = screen.getByRole('button', { name: /keyword search/i });
      await user.click(keywordButton);

      expect(keywordButton).toHaveClass('bg-primary');
    });

    it('should show helper text in semantic mode', async () => {
      const user = userEvent.setup();
      render(<SemanticSearchForm />);

      const semanticButton = screen.getByRole('button', { name: /semantic search/i });
      await user.click(semanticButton);

      expect(screen.getByText(/finds content by meaning/i)).toBeInTheDocument();
    });

    it('should update placeholder based on mode', async () => {
      const user = userEvent.setup();
      render(<SemanticSearchForm />);

      // Keyword mode placeholder
      expect(screen.getByPlaceholderText(/search by keywords/i)).toBeInTheDocument();

      // Switch to semantic mode
      const semanticButton = screen.getByRole('button', { name: /semantic search/i });
      await user.click(semanticButton);

      expect(screen.getByPlaceholderText(/describe what you're looking for/i)).toBeInTheDocument();
    });
  });

  describe('Keyword Search', () => {
    it('should update URL on keyword search submit', async () => {
      const user = userEvent.setup();
      render(<SemanticSearchForm />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test query');

      const submitButton = screen.getByRole('button', { name: /^search$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('q=test+query'));
        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('mode=keyword'));
      });
    });

    it('should not submit with empty query', async () => {
      const user = userEvent.setup();
      render(<SemanticSearchForm />);

      const submitButton = screen.getByRole('button', { name: /^search$/i });
      await user.click(submitButton);

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Semantic Search', () => {
    it('should call semanticSearchAction on semantic search submit', async () => {
      const user = userEvent.setup();
      render(<SemanticSearchForm initialMode="semantic" />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'find notes about programming');

      const submitButton = screen.getByRole('button', { name: /^search$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSemanticSearchAction).toHaveBeenCalledWith('find notes about programming', 20);
      });
    });

    it('should display semantic search results', async () => {
      const user = userEvent.setup();
      mockSemanticSearchAction.mockResolvedValueOnce({
        success: true,
        results: [
          {
            id: 'content-1',
            title: 'Programming Notes',
            body: 'Notes about TypeScript',
            type: 'note',
            tags: ['programming'],
            autoTags: [],
            url: null,
            createdAt: new Date('2024-01-01'),
            similarity: 0.95,
          },
        ],
      });

      render(<SemanticSearchForm initialMode="semantic" />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'programming');

      const submitButton = screen.getByRole('button', { name: /^search$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Programming Notes')).toBeInTheDocument();
        expect(screen.getByText('95% match')).toBeInTheDocument();
      });
    });

    it('should display error message on search failure', async () => {
      const user = userEvent.setup();
      mockSemanticSearchAction.mockResolvedValueOnce({
        success: false,
        message: 'Search failed',
        results: [],
      });

      render(<SemanticSearchForm initialMode="semantic" />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');

      const submitButton = screen.getByRole('button', { name: /^search$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Search failed')).toBeInTheDocument();
      });
    });

    it('should display no results message when empty', async () => {
      const user = userEvent.setup();
      mockSemanticSearchAction.mockResolvedValueOnce({
        success: true,
        results: [],
      });

      render(<SemanticSearchForm initialMode="semantic" />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'nonexistent');

      const submitButton = screen.getByRole('button', { name: /^search$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/no results found/i)).toBeInTheDocument();
      });
    });

    it('should update URL with semantic search parameters', async () => {
      const user = userEvent.setup();
      mockSemanticSearchAction.mockResolvedValueOnce({
        success: true,
        results: [],
      });

      render(<SemanticSearchForm initialMode="semantic" />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test query');

      const submitButton = screen.getByRole('button', { name: /^search$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith(
          expect.stringContaining('mode=semantic'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Loading State', () => {
    it('should disable search button when query is empty', () => {
      render(<SemanticSearchForm initialMode="semantic" />);

      const submitButton = screen.getByRole('button', { name: /^search$/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable search button when query has text', async () => {
      const user = userEvent.setup();
      render(<SemanticSearchForm initialMode="semantic" />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');

      const submitButton = screen.getByRole('button', { name: /^search$/i });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Result Display', () => {
    it('should display tags on results', async () => {
      const user = userEvent.setup();
      mockSemanticSearchAction.mockResolvedValueOnce({
        success: true,
        results: [
          {
            id: 'content-1',
            title: 'Test Note',
            body: 'Body text',
            type: 'note',
            tags: ['tag1', 'tag2'],
            autoTags: ['ai-tag'],
            url: null,
            createdAt: new Date('2024-01-01'),
            similarity: 0.9,
          },
        ],
      });

      render(<SemanticSearchForm initialMode="semantic" />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');

      const submitButton = screen.getByRole('button', { name: /^search$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('tag1')).toBeInTheDocument();
        expect(screen.getByText('tag2')).toBeInTheDocument();
        expect(screen.getByText('ai-tag (AI)')).toBeInTheDocument();
      });
    });

    it('should display URL for link type results', async () => {
      const user = userEvent.setup();
      mockSemanticSearchAction.mockResolvedValueOnce({
        success: true,
        results: [
          {
            id: 'content-1',
            title: 'Test Link',
            body: null,
            type: 'link',
            tags: [],
            autoTags: [],
            url: 'https://example.com',
            createdAt: new Date('2024-01-01'),
            similarity: 0.85,
          },
        ],
      });

      render(<SemanticSearchForm initialMode="semantic" />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'example');

      const submitButton = screen.getByRole('button', { name: /^search$/i });
      await user.click(submitButton);

      await waitFor(() => {
        const link = screen.getByRole('link', { name: /example\.com/i });
        expect(link).toHaveAttribute('href', 'https://example.com');
        expect(link).toHaveAttribute('target', '_blank');
      });
    });

    it('should display content type badge', async () => {
      const user = userEvent.setup();
      mockSemanticSearchAction.mockResolvedValueOnce({
        success: true,
        results: [
          {
            id: 'content-1',
            title: 'Test Note',
            body: 'Body',
            type: 'note',
            tags: [],
            autoTags: [],
            url: null,
            createdAt: new Date('2024-01-01'),
            similarity: 0.9,
          },
        ],
      });

      render(<SemanticSearchForm initialMode="semantic" />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');

      const submitButton = screen.getByRole('button', { name: /^search$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('note')).toBeInTheDocument();
      });
    });
  });
});
