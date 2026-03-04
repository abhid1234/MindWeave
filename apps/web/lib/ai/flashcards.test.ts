import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoist mocks to avoid initialization order issues
const { mockGenerateContent, mockGetGenerativeModel } = vi.hoisted(() => {
  const mockGenerateContent = vi.fn();
  const mockGetGenerativeModel = vi.fn().mockReturnValue({
    generateContent: mockGenerateContent,
  });
  return { mockGenerateContent, mockGetGenerativeModel };
});

vi.stubEnv('GOOGLE_AI_API_KEY', 'test-key');

vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: class {
      getGenerativeModel = mockGetGenerativeModel;
    },
  };
});

import { generateFlashcards } from './flashcards';

describe('generateFlashcards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return flashcard pairs from valid AI response', async () => {
    const pairs = [
      { question: 'What is React?', answer: 'A JavaScript library for building UIs' },
      { question: 'What is JSX?', answer: 'A syntax extension for JavaScript' },
    ];
    mockGenerateContent.mockResolvedValue({
      response: { text: () => JSON.stringify(pairs) },
    });

    const result = await generateFlashcards({ title: 'React Basics', body: 'React is a library...' });

    expect(result).toEqual(pairs);
    expect(result).toHaveLength(2);
  });

  it('should handle markdown code fences in response', async () => {
    const pairs = [{ question: 'Q1?', answer: 'A1' }];
    mockGenerateContent.mockResolvedValue({
      response: { text: () => '```json\n' + JSON.stringify(pairs) + '\n```' },
    });

    const result = await generateFlashcards({ title: 'Test' });
    expect(result).toEqual(pairs);
  });

  it('should filter out invalid entries', async () => {
    const response = [
      { question: 'Valid?', answer: 'Yes' },
      { question: '', answer: 'Empty question' },
      { question: 'No answer', answer: '' },
      { notQuestion: true },
      null,
    ];
    mockGenerateContent.mockResolvedValue({
      response: { text: () => JSON.stringify(response) },
    });

    const result = await generateFlashcards({ title: 'Test' });
    expect(result).toHaveLength(1);
    expect(result[0].question).toBe('Valid?');
  });

  it('should limit to 5 flashcards max', async () => {
    const pairs = Array.from({ length: 8 }, (_, i) => ({
      question: `Q${i}?`,
      answer: `A${i}`,
    }));
    mockGenerateContent.mockResolvedValue({
      response: { text: () => JSON.stringify(pairs) },
    });

    const result = await generateFlashcards({ title: 'Test' });
    expect(result).toHaveLength(5);
  });

  it('should return empty array on API error', async () => {
    mockGenerateContent.mockRejectedValue(new Error('API error'));

    const result = await generateFlashcards({ title: 'Test' });
    expect(result).toEqual([]);
  });

  it('should return empty array for non-array response', async () => {
    mockGenerateContent.mockResolvedValue({
      response: { text: () => '{"not":"an array"}' },
    });

    const result = await generateFlashcards({ title: 'Test' });
    expect(result).toEqual([]);
  });

  it('should return empty array for invalid JSON', async () => {
    mockGenerateContent.mockResolvedValue({
      response: { text: () => 'not json at all' },
    });

    const result = await generateFlashcards({ title: 'Test' });
    expect(result).toEqual([]);
  });

  it('should include tags in the prompt', async () => {
    mockGenerateContent.mockResolvedValue({
      response: { text: () => '[]' },
    });

    await generateFlashcards({
      title: 'Test',
      tags: ['react'],
      autoTags: ['javascript'],
    });

    const promptArg = mockGenerateContent.mock.calls[0][0];
    expect(promptArg).toContain('react');
    expect(promptArg).toContain('javascript');
  });
});
