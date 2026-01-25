import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KnowledgeQA } from './KnowledgeQA';

// Mock the askQuestionAction
const mockAskQuestionAction = vi.fn();
vi.mock('@/app/actions/search', () => ({
  askQuestionAction: (...args: any[]) => mockAskQuestionAction(...args),
}));

describe('KnowledgeQA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAskQuestionAction.mockResolvedValue({
      success: true,
      answer: 'This is the AI answer.',
      citations: [],
      sourcesUsed: 0,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Rendering', () => {
    it('should render the header', () => {
      render(<KnowledgeQA />);

      expect(screen.getByText('Knowledge Q&A')).toBeInTheDocument();
      expect(screen.getByText('Ask questions about your saved content')).toBeInTheDocument();
    });

    it('should render input and ask button', () => {
      render(<KnowledgeQA />);

      expect(screen.getByPlaceholderText(/ask a question/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^ask$/i })).toBeInTheDocument();
    });

    it('should render empty state with suggestions', () => {
      render(<KnowledgeQA />);

      expect(screen.getByText(/ask anything about your knowledge base/i)).toBeInTheDocument();
      expect(screen.getByText(/try asking/i)).toBeInTheDocument();
    });

    it('should disable ask button when input is empty', () => {
      render(<KnowledgeQA />);

      const button = screen.getByRole('button', { name: /^ask$/i });
      expect(button).toBeDisabled();
    });
  });

  describe('Asking Questions', () => {
    it('should enable ask button when input has text', async () => {
      const user = userEvent.setup();
      render(<KnowledgeQA />);

      const input = screen.getByPlaceholderText(/ask a question/i);
      await user.type(input, 'What is React?');

      const button = screen.getByRole('button', { name: /^ask$/i });
      expect(button).not.toBeDisabled();
    });

    it('should call askQuestionAction when form is submitted', async () => {
      const user = userEvent.setup();
      render(<KnowledgeQA />);

      const input = screen.getByPlaceholderText(/ask a question/i);
      await user.type(input, 'What is React?');

      const button = screen.getByRole('button', { name: /^ask$/i });
      await user.click(button);

      await waitFor(() => {
        expect(mockAskQuestionAction).toHaveBeenCalledWith('What is React?');
      });
    });

    it('should display user message after submitting', async () => {
      const user = userEvent.setup();
      render(<KnowledgeQA />);

      const input = screen.getByPlaceholderText(/ask a question/i);
      await user.type(input, 'What is React?');

      const button = screen.getByRole('button', { name: /^ask$/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('What is React?')).toBeInTheDocument();
      });
    });

    it('should display AI answer after receiving response', async () => {
      const user = userEvent.setup();
      mockAskQuestionAction.mockResolvedValueOnce({
        success: true,
        answer: 'React is a JavaScript library for building user interfaces.',
        citations: [],
        sourcesUsed: 3,
      });

      render(<KnowledgeQA />);

      const input = screen.getByPlaceholderText(/ask a question/i);
      await user.type(input, 'What is React?');

      const button = screen.getByRole('button', { name: /^ask$/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('React is a JavaScript library for building user interfaces.')).toBeInTheDocument();
      });
    });

    it('should clear input after submitting', async () => {
      const user = userEvent.setup();
      render(<KnowledgeQA />);

      const input = screen.getByPlaceholderText(/ask a question/i);
      await user.type(input, 'What is React?');

      const button = screen.getByRole('button', { name: /^ask$/i });
      await user.click(button);

      await waitFor(() => {
        expect(input).toHaveValue('');
      });
    });
  });

  describe('Citations', () => {
    it('should display citations when provided', async () => {
      const user = userEvent.setup();
      mockAskQuestionAction.mockResolvedValueOnce({
        success: true,
        answer: 'Here is the answer.',
        citations: [
          { contentId: 'c1', title: 'React Hooks Guide', relevance: '95% match' },
          { contentId: 'c2', title: 'JavaScript Basics', relevance: '85% match' },
        ],
        sourcesUsed: 5,
      });

      render(<KnowledgeQA />);

      const input = screen.getByPlaceholderText(/ask a question/i);
      await user.type(input, 'test');

      const button = screen.getByRole('button', { name: /^ask$/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('React Hooks Guide')).toBeInTheDocument();
        expect(screen.getByText('(95% match)')).toBeInTheDocument();
        expect(screen.getByText('JavaScript Basics')).toBeInTheDocument();
        expect(screen.getByText(/5 searched, 2 cited/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on failure', async () => {
      const user = userEvent.setup();
      mockAskQuestionAction.mockResolvedValueOnce({
        success: false,
        message: 'Failed to connect to AI service',
      });

      render(<KnowledgeQA />);

      const input = screen.getByPlaceholderText(/ask a question/i);
      await user.type(input, 'test');

      const button = screen.getByRole('button', { name: /^ask$/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Failed to connect to AI service')).toBeInTheDocument();
      });
    });
  });

  describe('Chat History', () => {
    it('should show clear chat button after first message', async () => {
      const user = userEvent.setup();
      render(<KnowledgeQA />);

      // No clear button initially
      expect(screen.queryByText(/clear chat/i)).not.toBeInTheDocument();

      const input = screen.getByPlaceholderText(/ask a question/i);
      await user.type(input, 'test');

      const button = screen.getByRole('button', { name: /^ask$/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/clear chat/i)).toBeInTheDocument();
      });
    });

    it('should clear messages when clear chat is clicked', async () => {
      const user = userEvent.setup();
      render(<KnowledgeQA />);

      const input = screen.getByPlaceholderText(/ask a question/i);
      await user.type(input, 'What is React?');

      const askButton = screen.getByRole('button', { name: /^ask$/i });
      await user.click(askButton);

      await waitFor(() => {
        expect(screen.getByText('What is React?')).toBeInTheDocument();
      });

      const clearButton = screen.getByText(/clear chat/i);
      await user.click(clearButton);

      // Messages should be cleared
      expect(screen.queryByText('What is React?')).not.toBeInTheDocument();
      // Empty state should be back
      expect(screen.getByText(/ask anything about your knowledge base/i)).toBeInTheDocument();
    });

    it('should support multiple messages', async () => {
      const user = userEvent.setup();
      mockAskQuestionAction
        .mockResolvedValueOnce({ success: true, answer: 'First answer', citations: [], sourcesUsed: 1 })
        .mockResolvedValueOnce({ success: true, answer: 'Second answer', citations: [], sourcesUsed: 2 });

      render(<KnowledgeQA />);

      // Ask first question
      const input = screen.getByPlaceholderText(/ask a question/i);
      await user.type(input, 'First question');
      await user.click(screen.getByRole('button', { name: /^ask$/i }));

      await waitFor(() => {
        expect(screen.getByText('First answer')).toBeInTheDocument();
      });

      // Ask second question
      await user.type(input, 'Second question');
      await user.click(screen.getByRole('button', { name: /^ask$/i }));

      await waitFor(() => {
        expect(screen.getByText('First question')).toBeInTheDocument();
        expect(screen.getByText('First answer')).toBeInTheDocument();
        expect(screen.getByText('Second question')).toBeInTheDocument();
        expect(screen.getByText('Second answer')).toBeInTheDocument();
      });
    });
  });

  describe('Not submitting with empty input', () => {
    it('should not submit when input is whitespace only', async () => {
      const user = userEvent.setup();
      render(<KnowledgeQA />);

      const input = screen.getByPlaceholderText(/ask a question/i);
      await user.type(input, '   ');

      const button = screen.getByRole('button', { name: /^ask$/i });
      expect(button).toBeDisabled();
    });
  });
});
