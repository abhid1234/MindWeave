import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockGenerateContent } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn(),
}));

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class MockGoogleGenerativeAI {
    constructor() {}
    getGenerativeModel() {
      return {
        generateContent: mockGenerateContent,
      };
    }
  },
}));

import { generateTags, answerQuestion, generateLinkedInPost } from './gemini';

describe('Gemini AI Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => 'mock response',
      },
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('generateTags', () => {
    it('should return parsed tags from AI response', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => 'react, typescript, web development',
        },
      });

      const tags = await generateTags({ title: 'React Tutorial', type: 'note' });

      expect(tags).toEqual(['react', 'typescript', 'web development']);
    });

    it('should handle empty response', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => '',
        },
      });

      const tags = await generateTags({ title: 'Test', type: 'note' });

      expect(tags).toEqual([]);
    });
  });

  describe('answerQuestion', () => {
    it('should return AI answer', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => 'The answer based on your knowledge base is...',
        },
      });

      const answer = await answerQuestion({
        question: 'What is React?',
        context: [{ title: 'React Guide', body: 'React is a library', tags: ['react'] }],
      });

      expect(answer).toBe('The answer based on your knowledge base is...');
    });
  });

  describe('generateLinkedInPost', () => {
    it('should generate a post with professional tone', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => 'Here is a professional LinkedIn post about AI.',
        },
      });

      const post = await generateLinkedInPost({
        content: [
          { title: 'AI Trends', body: 'AI is transforming...', type: 'note', tags: ['ai'] },
        ],
        tone: 'professional',
        length: 'medium',
        includeHashtags: true,
      });

      expect(post).toBe('Here is a professional LinkedIn post about AI.');
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining('professional')
      );
    });

    it('should include tone-specific instructions', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => 'A casual post',
        },
      });

      await generateLinkedInPost({
        content: [{ title: 'Test', type: 'note', tags: [] }],
        tone: 'casual',
        length: 'short',
        includeHashtags: false,
      });

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining('conversational')
      );
    });

    it('should include storytelling instructions', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => 'Once upon a time...',
        },
      });

      await generateLinkedInPost({
        content: [{ title: 'My Journey', type: 'note', tags: [] }],
        tone: 'storytelling',
        length: 'long',
        includeHashtags: true,
      });

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining('narrative')
      );
    });

    it('should instruct no hashtags when disabled', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => 'No hashtags here',
        },
      });

      await generateLinkedInPost({
        content: [{ title: 'Test', type: 'note', tags: [] }],
        tone: 'professional',
        length: 'medium',
        includeHashtags: false,
      });

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining('Do NOT include any hashtags')
      );
    });

    it('should truncate body to 2000 chars', async () => {
      const longBody = 'a'.repeat(3000);
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => 'Truncated post',
        },
      });

      await generateLinkedInPost({
        content: [{ title: 'Long Content', body: longBody, type: 'note', tags: [] }],
        tone: 'professional',
        length: 'medium',
        includeHashtags: true,
      });

      const prompt = mockGenerateContent.mock.calls[0][0] as string;
      // The body in the prompt should be truncated to 2000
      expect(prompt.length).toBeLessThan(longBody.length);
    });

    it('should handle multiple source items', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => 'Multi-source post',
        },
      });

      await generateLinkedInPost({
        content: [
          { title: 'Source 1', body: 'Body 1', type: 'note', tags: ['a'] },
          { title: 'Source 2', body: 'Body 2', url: 'https://example.com', type: 'link', tags: ['b'] },
        ],
        tone: 'professional',
        length: 'medium',
        includeHashtags: true,
      });

      const prompt = mockGenerateContent.mock.calls[0][0] as string;
      expect(prompt).toContain('[1]');
      expect(prompt).toContain('[2]');
      expect(prompt).toContain('Source 1');
      expect(prompt).toContain('Source 2');
    });

    it('should throw on API error', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('API rate limit'));

      await expect(
        generateLinkedInPost({
          content: [{ title: 'Test', type: 'note', tags: [] }],
          tone: 'professional',
          length: 'medium',
          includeHashtags: true,
        })
      ).rejects.toThrow('API rate limit');
    });
  });
});
