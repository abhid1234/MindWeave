import { describe, it, expect } from 'vitest';
import {
  sanitizeTitle,
  normalizeTag,
  normalizeTags,
  folderPathToTags,
  extractDomain,
  normalizeUrl,
  stripHtml,
  decodeHtmlEntities,
  generateDedupKey,
  truncateText,
  parseDate,
  batchArray,
} from '../utils';

describe('sanitizeTitle', () => {
  it('trims whitespace', () => {
    expect(sanitizeTitle('  Hello World  ')).toBe('Hello World');
  });

  it('collapses multiple spaces', () => {
    expect(sanitizeTitle('Hello    World')).toBe('Hello World');
  });

  it('returns Untitled for empty input', () => {
    expect(sanitizeTitle('')).toBe('Untitled');
    expect(sanitizeTitle(null)).toBe('Untitled');
    expect(sanitizeTitle(undefined)).toBe('Untitled');
  });

  it('removes control characters', () => {
    expect(sanitizeTitle('Hello\x00World')).toBe('HelloWorld');
  });

  it('truncates long titles', () => {
    const longTitle = 'a'.repeat(600);
    const result = sanitizeTitle(longTitle);
    expect(result.length).toBe(500);
    expect(result.endsWith('...')).toBe(true);
  });
});

describe('normalizeTag', () => {
  it('converts to lowercase', () => {
    expect(normalizeTag('JavaScript')).toBe('javascript');
  });

  it('replaces spaces with hyphens', () => {
    expect(normalizeTag('web development')).toBe('web-development');
  });

  it('replaces special chars with hyphens', () => {
    expect(normalizeTag('C++ Programming!')).toBe('c-programming');
  });

  it('removes consecutive hyphens', () => {
    expect(normalizeTag('hello---world')).toBe('hello-world');
  });

  it('removes leading/trailing hyphens', () => {
    expect(normalizeTag('-hello-world-')).toBe('hello-world');
  });

  it('truncates long tags', () => {
    const longTag = 'a'.repeat(60);
    expect(normalizeTag(longTag).length).toBe(50);
  });
});

describe('normalizeTags', () => {
  it('normalizes all tags', () => {
    expect(normalizeTags(['JavaScript', 'Web Dev'])).toEqual(['javascript', 'web-dev']);
  });

  it('removes duplicates', () => {
    expect(normalizeTags(['JavaScript', 'javascript', 'JAVASCRIPT'])).toEqual(['javascript']);
  });

  it('filters out empty tags', () => {
    expect(normalizeTags(['valid', '', null, undefined, 'another'])).toEqual(['valid', 'another']);
  });

  it('handles empty array', () => {
    expect(normalizeTags([])).toEqual([]);
  });
});

describe('folderPathToTags', () => {
  it('splits path by slash', () => {
    expect(folderPathToTags('Development/JavaScript/React')).toEqual([
      'development',
      'javascript',
      'react',
    ]);
  });

  it('splits path by backslash', () => {
    expect(folderPathToTags('Development\\JavaScript\\React')).toEqual([
      'development',
      'javascript',
      'react',
    ]);
  });

  it('excludes common root folders', () => {
    expect(folderPathToTags('Bookmarks Bar/Development/JavaScript')).toEqual([
      'development',
      'javascript',
    ]);
    expect(folderPathToTags('Favorites/Projects')).toEqual(['projects']);
  });

  it('handles empty input', () => {
    expect(folderPathToTags('')).toEqual([]);
    expect(folderPathToTags(null)).toEqual([]);
    expect(folderPathToTags(undefined)).toEqual([]);
  });
});

describe('extractDomain', () => {
  it('extracts domain from URL', () => {
    expect(extractDomain('https://example.com/path')).toBe('example.com');
  });

  it('removes www prefix', () => {
    expect(extractDomain('https://www.example.com')).toBe('example.com');
  });

  it('returns null for invalid URL', () => {
    expect(extractDomain('not-a-url')).toBe(null);
  });

  it('handles empty input', () => {
    expect(extractDomain('')).toBe(null);
    expect(extractDomain(null)).toBe(null);
  });
});

describe('normalizeUrl', () => {
  it('returns valid URL unchanged', () => {
    expect(normalizeUrl('https://example.com')).toBe('https://example.com');
  });

  it('adds https protocol if missing', () => {
    expect(normalizeUrl('example.com')).toBe('https://example.com');
  });

  it('trims whitespace', () => {
    expect(normalizeUrl('  https://example.com  ')).toBe('https://example.com');
  });

  it('returns null for invalid URL', () => {
    expect(normalizeUrl(':::invalid:::')).toBe(null);
  });

  it('handles empty input', () => {
    expect(normalizeUrl('')).toBe(null);
    expect(normalizeUrl(null)).toBe(null);
  });
});

describe('stripHtml', () => {
  it('removes HTML tags', () => {
    expect(stripHtml('<p>Hello <b>World</b></p>')).toBe('Hello World');
  });

  it('converts block elements to newlines', () => {
    expect(stripHtml('<p>First</p><p>Second</p>')).toContain('\n');
  });

  it('decodes HTML entities', () => {
    expect(stripHtml('&amp; &lt; &gt;')).toBe('& < >');
  });

  it('handles empty input', () => {
    expect(stripHtml('')).toBe('');
    expect(stripHtml(null)).toBe('');
  });
});

describe('decodeHtmlEntities', () => {
  it('decodes named entities', () => {
    expect(decodeHtmlEntities('&amp; &lt; &gt; &quot;')).toBe('& < > "');
  });

  it('decodes numeric entities', () => {
    expect(decodeHtmlEntities('&#65; &#66; &#67;')).toBe('A B C');
  });

  it('decodes hex entities', () => {
    expect(decodeHtmlEntities('&#x41; &#x42; &#x43;')).toBe('A B C');
  });

  it('decodes special characters', () => {
    expect(decodeHtmlEntities('&ldquo;Hello&rdquo;')).toBe('\u201CHello\u201D');
  });
});

describe('generateDedupKey', () => {
  it('uses URL for links', () => {
    expect(generateDedupKey({ url: 'https://example.com', title: 'Test', type: 'link' })).toBe(
      'url:https://example.com'
    );
  });

  it('uses title for notes', () => {
    expect(generateDedupKey({ title: 'My Note', type: 'note' })).toBe('title:my note');
  });

  it('normalizes title', () => {
    expect(generateDedupKey({ title: '  MY NOTE  ', type: 'note' })).toBe('title:my note');
  });
});

describe('truncateText', () => {
  it('returns short text unchanged', () => {
    expect(truncateText('Hello World', 50)).toBe('Hello World');
  });

  it('truncates long text with ellipsis', () => {
    const text = 'This is a long piece of text that should be truncated';
    const result = truncateText(text, 30);
    expect(result.length).toBeLessThanOrEqual(33); // 30 + '...'
    expect(result.endsWith('...')).toBe(true);
  });

  it('preserves word boundaries when possible', () => {
    const text = 'Hello beautiful world';
    const result = truncateText(text, 15);
    // 15 chars = "Hello beautiful", lastSpace at index 5, 0.8*15=12, 5 < 12 so doesn't truncate at word
    expect(result).toBe('Hello beautiful...');
  });
});

describe('parseDate', () => {
  it('parses Unix timestamp in seconds', () => {
    const date = parseDate(1609459200); // 2021-01-01
    expect(date).toBeInstanceOf(Date);
    expect(date?.getUTCFullYear()).toBe(2021);
  });

  it('parses Unix timestamp in milliseconds', () => {
    const date = parseDate(1609459200000); // 2021-01-01
    expect(date).toBeInstanceOf(Date);
    expect(date?.getUTCFullYear()).toBe(2021);
  });

  it('parses string timestamp', () => {
    const date = parseDate('1609459200');
    expect(date).toBeInstanceOf(Date);
  });

  it('parses ISO date string', () => {
    // Use a more recent date that passes the reasonable date check
    const date = parseDate('2024-01-01T00:00:00Z');
    expect(date).toBeInstanceOf(Date);
    expect(date?.getUTCFullYear()).toBe(2024);
  });

  it('returns undefined for invalid input', () => {
    expect(parseDate('')).toBeUndefined();
    expect(parseDate(null)).toBeUndefined();
    expect(parseDate('invalid')).toBeUndefined();
  });

  it('returns undefined for unreasonable dates', () => {
    expect(parseDate('1800-01-01')).toBeUndefined(); // too old
  });
});

describe('batchArray', () => {
  it('batches array into chunks', () => {
    const result = batchArray([1, 2, 3, 4, 5], 2);
    expect(result).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('handles empty array', () => {
    expect(batchArray([], 2)).toEqual([]);
  });

  it('handles array smaller than batch size', () => {
    expect(batchArray([1, 2], 5)).toEqual([[1, 2]]);
  });

  it('handles exact batch size', () => {
    expect(batchArray([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });
});
