import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  parseBookmarks,
  isBookmarksFile,
  parsePocket,
  parsePocketCsv,
  isPocketFile,
  parseEvernote,
  isEvernoteFile,
} from '../parsers';

const fixturesPath = path.join(__dirname, '../../../tests/fixtures/import');

describe('Bookmarks Parser', () => {
  const bookmarksHtml = fs.readFileSync(path.join(fixturesPath, 'bookmarks.html'), 'utf-8');

  describe('parseBookmarks', () => {
    it('parses bookmarks successfully', () => {
      const result = parseBookmarks(bookmarksHtml);

      expect(result.success).toBe(true);
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);
    });

    it('extracts URLs correctly', () => {
      const result = parseBookmarks(bookmarksHtml);

      const urls = result.items.map((item) => item.url);
      expect(urls).toContain('https://example.com');
      expect(urls).toContain('https://github.com');
      expect(urls).toContain('https://developer.mozilla.org');
    });

    it('extracts titles correctly', () => {
      const result = parseBookmarks(bookmarksHtml);

      const titles = result.items.map((item) => item.title);
      expect(titles).toContain('Example Site');
      expect(titles).toContain('GitHub');
      expect(titles).toContain('MDN Web Docs');
    });

    it('generates tags from folder path', () => {
      const result = parseBookmarks(bookmarksHtml);

      const mdnItem = result.items.find((item) => item.url?.includes('developer.mozilla.org'));
      expect(mdnItem).toBeDefined();
      expect(mdnItem?.tags).toContain('development');
      expect(mdnItem?.tags).toContain('javascript');
    });

    it('sets type to link', () => {
      const result = parseBookmarks(bookmarksHtml);

      for (const item of result.items) {
        expect(item.type).toBe('link');
      }
    });

    it('sets metadata source to bookmarks', () => {
      const result = parseBookmarks(bookmarksHtml);

      for (const item of result.items) {
        expect(item.metadata?.source).toBe('bookmarks');
      }
    });

    it('parses dates when available', () => {
      const result = parseBookmarks(bookmarksHtml);

      const itemWithDate = result.items.find((item) => item.createdAt);
      expect(itemWithDate).toBeDefined();
      expect(itemWithDate?.createdAt).toBeInstanceOf(Date);
    });

    it('handles empty HTML', () => {
      const result = parseBookmarks('');

      expect(result.success).toBe(true);
      expect(result.items).toHaveLength(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('handles invalid HTML gracefully', () => {
      const result = parseBookmarks('<not>valid<html>');

      expect(result.success).toBe(true);
      expect(result.items).toHaveLength(0);
    });
  });

  describe('isBookmarksFile', () => {
    it('detects Netscape bookmark format', () => {
      expect(isBookmarksFile(bookmarksHtml)).toBe(true);
    });

    it('rejects non-bookmark HTML', () => {
      expect(isBookmarksFile('<html><body>Hello</body></html>')).toBe(false);
    });
  });
});

describe('Pocket Parser', () => {
  const pocketHtml = fs.readFileSync(path.join(fixturesPath, 'pocket.html'), 'utf-8');

  describe('parsePocket', () => {
    it('parses Pocket HTML successfully', () => {
      const result = parsePocket(pocketHtml);

      expect(result.success).toBe(true);
      expect(result.items.length).toBe(5);
      expect(result.errors).toHaveLength(0);
    });

    it('extracts URLs and titles', () => {
      const result = parsePocket(pocketHtml);

      const item = result.items.find((i) => i.title === 'How to Learn Programming');
      expect(item).toBeDefined();
      expect(item?.url).toBe('https://example.com/article1');
    });

    it('extracts tags from attribute', () => {
      const result = parsePocket(pocketHtml);

      const item = result.items.find((i) => i.title === 'How to Learn Programming');
      expect(item?.tags).toContain('tech');
      expect(item?.tags).toContain('programming');
    });

    it('handles items without tags', () => {
      const result = parsePocket(pocketHtml);

      const item = result.items.find((i) => i.title === 'No Tags Article');
      expect(item).toBeDefined();
      expect(item?.tags).toHaveLength(0);
    });

    it('sets type to link', () => {
      const result = parsePocket(pocketHtml);

      for (const item of result.items) {
        expect(item.type).toBe('link');
      }
    });

    it('sets metadata source to pocket', () => {
      const result = parsePocket(pocketHtml);

      for (const item of result.items) {
        expect(item.metadata?.source).toBe('pocket');
      }
    });
  });

  describe('parsePocketCsv', () => {
    it('parses valid CSV', () => {
      const csv = `url,title,tags
https://example.com,Example,tech,news
https://test.com,Test Site,testing`;

      const result = parsePocketCsv(csv);

      expect(result.success).toBe(true);
      expect(result.items.length).toBe(2);
    });

    it('handles CSV without header', () => {
      const csv = 'invalid format without columns';

      const result = parsePocketCsv(csv);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('handles quoted fields', () => {
      const csv = `url,title,tags
"https://example.com","Title with, comma","tag1,tag2"`;

      const result = parsePocketCsv(csv);

      expect(result.success).toBe(true);
      expect(result.items[0].title).toBe('Title with, comma');
    });
  });

  describe('isPocketFile', () => {
    it('detects Pocket export', () => {
      expect(isPocketFile(pocketHtml)).toBe(true);
    });

    it('rejects non-Pocket HTML', () => {
      expect(isPocketFile('<html><body>Hello</body></html>')).toBe(false);
    });
  });
});

describe('Evernote Parser', () => {
  const evernoteEnex = fs.readFileSync(path.join(fixturesPath, 'evernote.enex'), 'utf-8');

  describe('parseEvernote', () => {
    it('parses ENEX file successfully', () => {
      const result = parseEvernote(evernoteEnex);

      expect(result.success).toBe(true);
      expect(result.items.length).toBe(3);
      expect(result.errors).toHaveLength(0);
    });

    it('extracts titles correctly', () => {
      const result = parseEvernote(evernoteEnex);

      const titles = result.items.map((item) => item.title);
      expect(titles).toContain('Meeting Notes');
      expect(titles).toContain('Recipe: Pasta');
      expect(titles).toContain('Quick Note');
    });

    it('extracts tags from tag elements', () => {
      const result = parseEvernote(evernoteEnex);

      const meetingNote = result.items.find((i) => i.title === 'Meeting Notes');
      expect(meetingNote?.tags).toContain('work');
      expect(meetingNote?.tags).toContain('meetings');
    });

    it('handles notes without tags', () => {
      const result = parseEvernote(evernoteEnex);

      const quickNote = result.items.find((i) => i.title === 'Quick Note');
      expect(quickNote?.tags).toHaveLength(0);
    });

    it('converts ENML content to text', () => {
      const result = parseEvernote(evernoteEnex);

      const meetingNote = result.items.find((i) => i.title === 'Meeting Notes');
      expect(meetingNote?.body).toContain('Discussion points');
      expect(meetingNote?.body).toContain('Project timeline review');
    });

    it('handles checkboxes', () => {
      const result = parseEvernote(evernoteEnex);

      const meetingNote = result.items.find((i) => i.title === 'Meeting Notes');
      expect(meetingNote?.body).toContain('[x] Completed task');
      expect(meetingNote?.body).toContain('[ ] Pending task');
    });

    it('sets type to note', () => {
      const result = parseEvernote(evernoteEnex);

      for (const item of result.items) {
        expect(item.type).toBe('note');
      }
    });

    it('sets metadata source to evernote', () => {
      const result = parseEvernote(evernoteEnex);

      for (const item of result.items) {
        expect(item.metadata?.source).toBe('evernote');
      }
    });

    it('parses Evernote date format', () => {
      const result = parseEvernote(evernoteEnex);

      const meetingNote = result.items.find((i) => i.title === 'Meeting Notes');
      expect(meetingNote?.createdAt).toBeInstanceOf(Date);
      expect(meetingNote?.createdAt?.getUTCFullYear()).toBe(2024);
    });

    it('handles invalid ENEX', () => {
      const result = parseEvernote('not xml at all');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('isEvernoteFile', () => {
    it('detects ENEX format', () => {
      expect(isEvernoteFile(evernoteEnex)).toBe(true);
    });

    it('rejects non-ENEX content', () => {
      expect(isEvernoteFile('<html><body>Hello</body></html>')).toBe(false);
    });
  });
});
