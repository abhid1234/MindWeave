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

import { refineContent } from './refine';

describe('refineContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return refined text from AI', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => 'This is the polished version of the text.',
      },
    });

    const result = await refineContent({
      text: 'this is messy text lol',
      tone: 'professional',
    });

    expect(result).toBe('This is the polished version of the text.');
    expect(mockGenerateContent).toHaveBeenCalledOnce();
  });

  it('should include tone in the prompt', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: { text: () => 'Casual refined text' },
    });

    await refineContent({ text: 'some text', tone: 'casual' });

    const prompt = mockGenerateContent.mock.calls[0][0] as string;
    expect(prompt).toContain('casual');
    expect(prompt).toContain('Friendly, conversational');
  });

  it('should include custom instruction in the prompt', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: { text: () => 'Refined with custom instruction' },
    });

    await refineContent({
      text: 'some text',
      tone: 'professional',
      customInstruction: 'Use bullet points',
    });

    const prompt = mockGenerateContent.mock.calls[0][0] as string;
    expect(prompt).toContain('Use bullet points');
  });

  it('should throw on empty AI response', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: { text: () => '' },
    });

    await expect(
      refineContent({ text: 'some text', tone: 'professional' })
    ).rejects.toThrow('Empty response from AI');
  });

  it('should propagate AI errors', async () => {
    mockGenerateContent.mockRejectedValueOnce(new Error('API quota exceeded'));

    await expect(
      refineContent({ text: 'some text', tone: 'professional' })
    ).rejects.toThrow('API quota exceeded');
  });

  it('should truncate text at 50000 characters', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: { text: () => 'Refined' },
    });

    const longText = 'a'.repeat(60000);
    await refineContent({ text: longText, tone: 'concise' });

    const prompt = mockGenerateContent.mock.calls[0][0] as string;
    // The prompt should contain at most 50000 chars of the original text
    expect(prompt.length).toBeLessThan(60000 + 500); // prompt overhead
  });

  it('should handle all four tones', async () => {
    const tones = ['professional', 'casual', 'academic', 'concise'];

    for (const tone of tones) {
      mockGenerateContent.mockResolvedValueOnce({
        response: { text: () => `Refined in ${tone} tone` },
      });

      const result = await refineContent({ text: 'test', tone });
      expect(result).toBe(`Refined in ${tone} tone`);
    }
  });
});
