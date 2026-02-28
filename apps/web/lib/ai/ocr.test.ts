import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Google Generative AI SDK
const mockGenerateContent = vi.fn();
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return { generateContent: mockGenerateContent };
    }
  },
}));

// Set API key before importing the module
vi.stubEnv('GOOGLE_AI_API_KEY', 'test-key');

import { extractTextFromImage } from './ocr';

beforeEach(() => {
  mockGenerateContent.mockReset();
});

describe('extractTextFromImage', () => {
  it('extracts text from a valid image', async () => {
    mockGenerateContent.mockResolvedValue({
      response: { text: () => 'Hello World\nLine 2' },
    });

    const result = await extractTextFromImage('base64data', 'image/png');
    expect(result.text).toBe('Hello World\nLine 2');
    expect(mockGenerateContent).toHaveBeenCalledWith([
      { inlineData: { data: 'base64data', mimeType: 'image/png' } },
      expect.stringContaining('Extract ALL text'),
    ]);
  });

  it('returns empty text when no text found', async () => {
    mockGenerateContent.mockResolvedValue({
      response: { text: () => '[NO_TEXT_FOUND]' },
    });

    const result = await extractTextFromImage('base64data', 'image/jpeg');
    expect(result.text).toBe('');
  });

  it('rejects unsupported mime types', async () => {
    await expect(
      extractTextFromImage('base64data', 'application/pdf'),
    ).rejects.toThrow('Unsupported image type');
  });

  it('propagates API errors', async () => {
    mockGenerateContent.mockRejectedValue(new Error('API quota exceeded'));

    await expect(
      extractTextFromImage('base64data', 'image/png'),
    ).rejects.toThrow('API quota exceeded');
  });

  it('works with all supported image types', async () => {
    mockGenerateContent.mockResolvedValue({
      response: { text: () => 'Some text' },
    });

    for (const mimeType of ['image/jpeg', 'image/png', 'image/gif', 'image/webp']) {
      const result = await extractTextFromImage('data', mimeType);
      expect(result.text).toBe('Some text');
    }
  });
});
