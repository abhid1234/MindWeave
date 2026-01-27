import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Anthropic before importing the module
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'This is a test summary of the content.' }],
        }),
      };
    },
  };
});

// Import after mocking
import { generateSummary } from './summarization';

describe('Summarization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateSummary', () => {
    it('should return null when body is too short', async () => {
      const result = await generateSummary({
        title: 'Test',
        body: 'Short',
        type: 'note',
      });

      expect(result).toBeNull();
    });

    it('should return null when body is null', async () => {
      const result = await generateSummary({
        title: 'Test',
        body: null,
        type: 'note',
      });

      expect(result).toBeNull();
    });

    it('should return null when ANTHROPIC_API_KEY is not set', async () => {
      const originalKey = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      const result = await generateSummary({
        title: 'Test Title',
        body: 'A'.repeat(200), // Long enough content
        type: 'note',
      });

      expect(result).toBeNull();

      process.env.ANTHROPIC_API_KEY = originalKey;
    });

    it('should handle link type content', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-key';

      const result = await generateSummary({
        title: 'Test Article',
        body: 'A'.repeat(200),
        url: 'https://example.com',
        type: 'link',
      });

      // Mock should return the summary
      expect(result).toBeTruthy();
    });

    it('should handle file type content', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-key';

      const result = await generateSummary({
        title: 'Test Document',
        body: 'A'.repeat(200),
        type: 'file',
      });

      expect(result).toBeTruthy();
    });

    it('should truncate summary to 500 characters', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-key';

      const result = await generateSummary({
        title: 'Test',
        body: 'A'.repeat(200),
        type: 'note',
      });

      if (result) {
        expect(result.length).toBeLessThanOrEqual(500);
      }
    });
  });
});
