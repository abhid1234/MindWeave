import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ExtractedContent } from './url-content';

// Mock the Google Generative AI SDK
const mockGenerateContent = vi.fn();
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return { generateContent: mockGenerateContent };
    }
  },
}));

vi.stubEnv('GOOGLE_AI_API_KEY', 'test-key');

import { summarizeUrlContent } from './url-summarizer';

beforeEach(() => {
  mockGenerateContent.mockReset();
});

const youtubeContent: ExtractedContent = {
  sourceType: 'youtube',
  url: 'https://youtube.com/watch?v=abc123',
  title: 'YouTube Video (abc123)',
  text: 'This is the video transcript content about machine learning.',
  videoId: 'abc123',
};

const articleContent: ExtractedContent = {
  sourceType: 'article',
  url: 'https://example.com/article',
  title: 'Great Article',
  text: 'This is the article content about web development.',
  domain: 'example.com',
};

describe('summarizeUrlContent', () => {
  it('summarizes YouTube content', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () =>
          'SUMMARY:\nThis video covers ML basics.\n\nKEY_TAKEAWAYS:\n- ML is a subset of AI\n- Data quality matters\n- Start with simple models',
      },
    });

    const result = await summarizeUrlContent(youtubeContent);
    expect(result.summary).toBe('This video covers ML basics.');
    expect(result.keyTakeaways).toHaveLength(3);
    expect(result.keyTakeaways[0]).toBe('ML is a subset of AI');
    expect(result.formattedBody).toContain('## Summary');
    expect(result.formattedBody).toContain('## Key Takeaways');
  });

  it('summarizes article content', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () =>
          'SUMMARY:\nArticle about web dev best practices.\n\nKEY_TAKEAWAYS:\n- Use semantic HTML\n- Optimize performance',
      },
    });

    const result = await summarizeUrlContent(articleContent);
    expect(result.summary).toBe('Article about web dev best practices.');
    expect(result.keyTakeaways).toHaveLength(2);
    expect(result.formattedBody).toContain('*Source:');
  });

  it('propagates API errors', async () => {
    mockGenerateContent.mockRejectedValue(new Error('Quota exceeded'));

    await expect(summarizeUrlContent(youtubeContent)).rejects.toThrow('Quota exceeded');
  });

  it('handles unexpected response format gracefully', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => 'Just a plain text response without the expected format.',
      },
    });

    const result = await summarizeUrlContent(youtubeContent);
    // Should use the full text as summary when format doesn't match
    expect(result.summary).toBeTruthy();
    expect(result.formattedBody).toContain('## Summary');
  });

  it('includes source link in formatted body', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => 'SUMMARY:\nSummary text.\n\nKEY_TAKEAWAYS:\n- Takeaway 1',
      },
    });

    const result = await summarizeUrlContent(articleContent);
    expect(result.formattedBody).toContain('[Great Article](https://example.com/article)');
  });
});
