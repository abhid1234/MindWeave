import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isYouTubeUrl, extractVideoId, extractUrlContent } from './url-content';

// Mock youtube-transcript
const mockFetchTranscript = vi.fn();
vi.mock('youtube-transcript', () => ({
  YoutubeTranscript: {
    fetchTranscript: (...args: unknown[]) => mockFetchTranscript(...args),
  },
}));

// Mock node-html-parser
vi.mock('node-html-parser', () => ({
  parse: (html: string) => {
    // Simple mock parser
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    const bodyMatch = html.match(/<body>(.*?)<\/body>/s);
    return {
      querySelector: (selector: string) => {
        if (selector === 'title' && titleMatch) {
          return { text: titleMatch[1] };
        }
        if (selector === 'meta[property="og:title"]') return null;
        if (selector === 'article') return null;
        if (selector === 'main') return null;
        if (selector === '[role="main"]') return null;
        if (selector === 'body' && bodyMatch) {
          return {
            text: bodyMatch[1].replace(/<[^>]*>/g, ''),
            querySelectorAll: () => [],
          };
        }
        return null;
      },
    };
  },
}));

beforeEach(() => {
  mockFetchTranscript.mockReset();
  vi.restoreAllMocks();
});

describe('isYouTubeUrl', () => {
  it('detects standard YouTube URLs', () => {
    expect(isYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
    expect(isYouTubeUrl('https://youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
  });

  it('detects short YouTube URLs', () => {
    expect(isYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
  });

  it('detects embed YouTube URLs', () => {
    expect(isYouTubeUrl('https://youtube.com/embed/dQw4w9WgXcQ')).toBe(true);
  });

  it('detects YouTube Shorts URLs', () => {
    expect(isYouTubeUrl('https://youtube.com/shorts/dQw4w9WgXcQ')).toBe(true);
  });

  it('rejects non-YouTube URLs', () => {
    expect(isYouTubeUrl('https://example.com')).toBe(false);
    expect(isYouTubeUrl('https://vimeo.com/12345')).toBe(false);
  });
});

describe('extractVideoId', () => {
  it('extracts video ID from various URL formats', () => {
    expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractVideoId('https://youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('returns null for invalid URLs', () => {
    expect(extractVideoId('https://example.com')).toBeNull();
  });
});

describe('extractUrlContent', () => {
  it('extracts YouTube transcript', async () => {
    mockFetchTranscript.mockResolvedValue([
      { text: 'Hello', offset: 0, duration: 1000 },
      { text: 'World', offset: 1000, duration: 1000 },
    ]);

    const result = await extractUrlContent('https://youtube.com/watch?v=dQw4w9WgXcQ');
    expect(result.sourceType).toBe('youtube');
    expect(result.videoId).toBe('dQw4w9WgXcQ');
    expect(result.text).toBe('Hello World');
  });

  it('throws when YouTube transcript unavailable', async () => {
    mockFetchTranscript.mockResolvedValue([]);

    await expect(
      extractUrlContent('https://youtube.com/watch?v=dQw4w9WgXcQ'),
    ).rejects.toThrow('No transcript available');
  });

  it('extracts article content', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(
          '<html><head><title>Test Article</title></head><body>Article content here</body></html>',
        ),
    });

    const result = await extractUrlContent('https://example.com/article');
    expect(result.sourceType).toBe('article');
    expect(result.title).toBe('Test Article');
    expect(result.text).toContain('Article content here');
    expect(result.domain).toBe('example.com');
  });

  it('throws on fetch failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(
      extractUrlContent('https://example.com/missing'),
    ).rejects.toThrow('Failed to fetch URL');
  });

  it('handles YouTube fetch errors', async () => {
    mockFetchTranscript.mockRejectedValue(new Error('Network error'));

    await expect(
      extractUrlContent('https://youtube.com/watch?v=dQw4w9WgXcQ'),
    ).rejects.toThrow('Could not fetch YouTube transcript');
  });
});
