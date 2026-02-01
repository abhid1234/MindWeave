import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock JSZip
const mockLoadAsync = vi.fn();

vi.mock('jszip', () => ({
  default: {
    loadAsync: (...args: unknown[]) => mockLoadAsync(...args),
  },
}));

// Mock node-html-parser
vi.mock('node-html-parser', () => ({
  parse: (html: string) => {
    // Simple mock implementation
    const querySelector = (selector: string) => {
      if (selector === 'h1.page-title') {
        const match = html.match(/<h1 class="page-title">(.*?)<\/h1>/);
        if (match) return { textContent: match[1], remove: vi.fn() };
        return null;
      }
      if (selector === 'title') {
        const match = html.match(/<title>(.*?)<\/title>/);
        if (match) return { textContent: match[1], remove: vi.fn() };
        return null;
      }
      if (selector === 'h1') {
        const match = html.match(/<h1[^>]*>(.*?)<\/h1>/);
        if (match) return { textContent: match[1], remove: vi.fn() };
        return null;
      }
      if (selector === 'article') {
        return {
          innerHTML: html,
          querySelector: () => null,
        };
      }
      if (selector === '.page-body') return null;
      if (selector === 'header') return null;
      return null;
    };
    return {
      querySelector,
      innerHTML: html,
    };
  },
}));

function setupZipMock(files: Record<string, { dir?: boolean; content: string }>) {
  const zipFiles: Record<string, { dir: boolean; async: () => Promise<string> }> = {};
  for (const [path, info] of Object.entries(files)) {
    zipFiles[path] = {
      dir: info.dir || false,
      async: vi.fn().mockResolvedValue(info.content),
    };
  }
  mockLoadAsync.mockResolvedValue({
    files: zipFiles,
  });
}

describe('Notion Parser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseNotion', () => {
    it('should parse HTML files from a valid ZIP', async () => {
      setupZipMock({
        'Notes/My Page abc12345678901234567890123456.html': {
          content: '<html><body><h1 class="page-title">My Page</h1><article>Some content here</article></body></html>',
        },
      });

      const { parseNotion } = await import('./notion');
      const result = await parseNotion(new ArrayBuffer(0));

      expect(result.success).toBe(true);
      expect(result.items.length).toBe(1);
      expect(result.stats.total).toBe(1);
      expect(result.stats.parsed).toBe(1);
    });

    it('should parse Markdown files from a valid ZIP', async () => {
      setupZipMock({
        'Notes/My Note abc12345678901234567890123456.md': {
          content: '# My Note\n\nThis is the body of my note.',
        },
      });

      const { parseNotion } = await import('./notion');
      const result = await parseNotion(new ArrayBuffer(0));

      expect(result.success).toBe(true);
      expect(result.items.length).toBe(1);
      expect(result.items[0].title).toContain('My Note');
      expect(result.items[0].body).toContain('body of my note');
    });

    it('should return warning for empty ZIP', async () => {
      setupZipMock({});

      const { parseNotion } = await import('./notion');
      const result = await parseNotion(new ArrayBuffer(0));

      expect(result.success).toBe(true);
      expect(result.items).toEqual([]);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('No content files');
    });

    it('should return error for corrupted ZIP', async () => {
      mockLoadAsync.mockRejectedValue(new Error('Invalid ZIP'));

      const { parseNotion } = await import('./notion');
      const result = await parseNotion(new ArrayBuffer(0));

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('Failed to parse Notion export');
    });

    it('should skip __MACOSX and .DS_Store files', async () => {
      setupZipMock({
        '__MACOSX/._something.html': { content: 'junk' },
        'Notes/.DS_Store': { content: 'junk' },
        'Notes/Real Page abc12345678901234567890123456.html': {
          content: '<h1>Real Page</h1><p>Content</p>',
        },
      });

      const { parseNotion } = await import('./notion');
      const result = await parseNotion(new ArrayBuffer(0));

      expect(result.stats.total).toBe(1);
      expect(result.items.length).toBe(1);
    });

    it('should skip directories', async () => {
      const zipFiles: Record<string, { dir: boolean; async: () => Promise<string> }> = {
        'Notes/': {
          dir: true,
          async: vi.fn().mockResolvedValue(''),
        },
        'Notes/page.html': {
          dir: false,
          async: vi.fn().mockResolvedValue('<h1>Page</h1><p>Body</p>'),
        },
      };
      mockLoadAsync.mockResolvedValue({ files: zipFiles });

      const { parseNotion } = await import('./notion');
      const result = await parseNotion(new ArrayBuffer(0));

      expect(result.stats.total).toBe(1);
    });

    it('should extract inline #hashtags from content', async () => {
      setupZipMock({
        'page.md': {
          content: '# Tagged Note\n\nThis has #javascript and #react tags.',
        },
      });

      const { parseNotion } = await import('./notion');
      const result = await parseNotion(new ArrayBuffer(0));

      expect(result.items[0].tags).toEqual(
        expect.arrayContaining(['javascript', 'react'])
      );
    });

    it('should convert folder path to tags', async () => {
      setupZipMock({
        'Projects/WebDev/page.md': {
          content: '# A Page\n\nContent here.',
        },
      });

      const { parseNotion } = await import('./notion');
      const result = await parseNotion(new ArrayBuffer(0));

      expect(result.items[0].tags).toEqual(
        expect.arrayContaining(['projects', 'webdev'])
      );
    });

    it('should handle file read errors gracefully', async () => {
      const zipFiles: Record<string, { dir: boolean; async: () => Promise<string> }> = {
        'bad.html': {
          dir: false,
          async: vi.fn().mockRejectedValue(new Error('Read failed')),
        },
      };
      mockLoadAsync.mockResolvedValue({ files: zipFiles });

      const { parseNotion } = await import('./notion');
      const result = await parseNotion(new ArrayBuffer(0));

      expect(result.errors.length).toBe(1);
      expect(result.errors[0].message).toBe('Read failed');
      expect(result.stats.skipped).toBe(1);
    });

    it('should return null for empty untitled markdown', async () => {
      setupZipMock({
        'Untitled.md': { content: '' },
      });

      const { parseNotion } = await import('./notion');
      const result = await parseNotion(new ArrayBuffer(0));

      expect(result.stats.skipped).toBe(1);
      expect(result.items.length).toBe(0);
    });

    it('should use filename as title fallback for markdown without heading', async () => {
      setupZipMock({
        'My Great Note.md': {
          content: 'Just some text without a heading.',
        },
      });

      const { parseNotion } = await import('./notion');
      const result = await parseNotion(new ArrayBuffer(0));

      expect(result.items[0].title).toBe('My Great Note');
    });

    it('should set metadata source to notion', async () => {
      setupZipMock({
        'page.md': { content: '# Title\n\nBody' },
      });

      const { parseNotion } = await import('./notion');
      const result = await parseNotion(new ArrayBuffer(0));

      expect(result.items[0].metadata?.source).toBe('notion');
    });

    it('should extract title from HTML title tag as fallback', async () => {
      setupZipMock({
        'page.html': {
          content: '<html><head><title>Title From Tag</title></head><body><p>Content</p></body></html>',
        },
      });

      const { parseNotion } = await import('./notion');
      const result = await parseNotion(new ArrayBuffer(0));

      expect(result.items[0].title).toBe('Title From Tag');
    });
  });

  describe('isNotionZip', () => {
    it('should return true for a valid Notion export', async () => {
      mockLoadAsync.mockResolvedValue({
        files: {
          'Notes/page.html': { dir: false },
          'Notes/': { dir: true },
        },
      });

      const { isNotionZip } = await import('./notion');
      const result = await isNotionZip(new ArrayBuffer(0));
      expect(result).toBe(true);
    });

    it('should return false for non-Notion ZIP', async () => {
      mockLoadAsync.mockResolvedValue({
        files: {
          'random.txt': { dir: false },
          'data.json': { dir: false },
        },
      });

      const { isNotionZip } = await import('./notion');
      const result = await isNotionZip(new ArrayBuffer(0));
      expect(result).toBe(false);
    });

    it('should return false for invalid ZIP', async () => {
      mockLoadAsync.mockRejectedValue(new Error('Not a zip'));

      const { isNotionZip } = await import('./notion');
      const result = await isNotionZip(new ArrayBuffer(0));
      expect(result).toBe(false);
    });
  });
});
