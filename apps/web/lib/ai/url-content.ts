import { YoutubeTranscript } from 'youtube-transcript';

export interface ExtractedContent {
  sourceType: 'youtube' | 'article';
  url: string;
  title: string;
  text: string;
  videoId?: string;
  domain?: string;
}

const YOUTUBE_REGEX = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/;

const MAX_TEXT_LENGTH = 10_000;

/**
 * Detect if a URL is a YouTube video
 */
export function isYouTubeUrl(url: string): boolean {
  return YOUTUBE_REGEX.test(url);
}

/**
 * Extract video ID from a YouTube URL
 */
export function extractVideoId(url: string): string | null {
  const match = url.match(YOUTUBE_REGEX);
  return match ? match[1] : null;
}

/**
 * Extract content from a URL — YouTube transcript or article text
 */
export async function extractUrlContent(url: string): Promise<ExtractedContent> {
  if (isYouTubeUrl(url)) {
    return extractYouTubeContent(url);
  }
  return extractArticleContent(url);
}

async function extractYouTubeContent(url: string): Promise<ExtractedContent> {
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }

  try {
    const segments = await YoutubeTranscript.fetchTranscript(videoId);

    if (!segments || segments.length === 0) {
      throw new Error('No transcript available for this video');
    }

    const text = segments
      .map((s) => s.text)
      .join(' ')
      .slice(0, MAX_TEXT_LENGTH);

    return {
      sourceType: 'youtube',
      url,
      title: `YouTube Video (${videoId})`,
      text,
      videoId,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('No transcript')) {
      throw error;
    }
    throw new Error(
      'Could not fetch YouTube transcript. The video may not have captions available.',
    );
  }
}

async function extractArticleContent(url: string): Promise<ExtractedContent> {
  const { parse } = await import('node-html-parser');

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Mindweave/1.0)',
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const root = parse(html);

  // Extract title
  const titleEl = root.querySelector('title');
  const ogTitle = root.querySelector('meta[property="og:title"]');
  const title = ogTitle?.getAttribute('content') || titleEl?.text || new URL(url).hostname;

  // Extract main content — prefer article/main, fall back to body
  const contentEl =
    root.querySelector('article') ||
    root.querySelector('main') ||
    root.querySelector('[role="main"]') ||
    root.querySelector('body');

  if (!contentEl) {
    throw new Error('Could not extract content from page');
  }

  // Remove non-content elements
  for (const tag of ['script', 'style', 'nav', 'header', 'footer', 'aside', 'iframe', 'noscript']) {
    contentEl.querySelectorAll(tag).forEach((el) => el.remove());
  }

  const text = contentEl.text
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_TEXT_LENGTH);

  if (!text) {
    throw new Error('No readable content found on page');
  }

  const domain = new URL(url).hostname.replace(/^www\./, '');

  return {
    sourceType: 'article',
    url,
    title: title.trim(),
    text,
    domain,
  };
}
