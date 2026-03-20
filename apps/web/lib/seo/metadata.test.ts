import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateSeoMetadata } from './metadata';

describe('generateSeoMetadata', () => {
  let originalAppUrl: string | undefined;

  beforeEach(() => {
    originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  afterEach(() => {
    if (originalAppUrl !== undefined) {
      process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
    } else {
      delete process.env.NEXT_PUBLIC_APP_URL;
    }
  });

  it('should generate metadata with title and description', () => {
    const result = generateSeoMetadata({
      title: 'AI Note Taking App',
      description: 'Take notes with AI assistance',
      path: '/use-cases/ai-note-taking',
    });

    expect(result.title).toBe('AI Note Taking App - Mindweave');
    expect(result.description).toBe('Take notes with AI assistance');
    expect(result.alternates?.canonical).toBe(
      'https://www.mindweave.space/use-cases/ai-note-taking'
    );
  });

  it('should include openGraph metadata', () => {
    const result = generateSeoMetadata({
      title: 'AI Note Taking App',
      description: 'Take notes with AI assistance',
      path: '/use-cases/ai-note-taking',
    });

    expect(result.openGraph?.title).toBe('AI Note Taking App - Mindweave');
    expect(result.openGraph?.description).toBe('Take notes with AI assistance');
    expect(result.openGraph?.url).toBe('https://www.mindweave.space/use-cases/ai-note-taking');
    expect(result.openGraph?.siteName).toBe('Mindweave');
    expect((result.openGraph as Record<string, unknown>)?.type).toBe('website');
  });

  it('should include twitter card metadata', () => {
    const result = generateSeoMetadata({
      title: 'AI Note Taking App',
      description: 'Take notes with AI assistance',
      path: '/use-cases/ai-note-taking',
    });

    expect((result.twitter as Record<string, unknown>)?.card).toBe('summary_large_image');
    expect(result.twitter?.title).toBe('AI Note Taking App - Mindweave');
    expect(result.twitter?.description).toBe('Take notes with AI assistance');
  });

  it('should allow custom OG type', () => {
    const result = generateSeoMetadata({
      title: 'Test',
      description: 'Test',
      path: '/test',
      ogType: 'article',
    });

    expect((result.openGraph as Record<string, unknown>)?.type).toBe('article');
  });
});
