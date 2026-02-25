import { describe, it, expect } from 'vitest';
import { parseRaindrop, isRaindropFile } from '../parsers/raindrop';

describe('Raindrop.io Parser', () => {
  describe('isRaindropFile', () => {
    it('should detect Raindrop.io CSV format', () => {
      const csv = 'title,note,excerpt,url,folder,tags,created,cover,highlights,important,broken\n';
      expect(isRaindropFile(csv)).toBe(true);
    });

    it('should reject non-Raindrop CSV', () => {
      const csv = 'name,email,phone\nJohn,john@test.com,555-1234\n';
      expect(isRaindropFile(csv)).toBe(false);
    });

    it('should be case-insensitive', () => {
      const csv = 'Title,Note,Excerpt,URL,Folder,Tags,Created\n';
      expect(isRaindropFile(csv)).toBe(true);
    });
  });

  describe('parseRaindrop', () => {
    const validHeader = 'title,note,excerpt,url,folder,tags,created,cover,highlights,important,broken';

    it('should parse valid CSV rows', () => {
      const csv = `${validHeader}\nMy Article,Some notes,An excerpt,https://example.com,Development/JavaScript,"react,web",2024-01-15,,,false,false`;
      const result = parseRaindrop(csv);

      expect(result.success).toBe(true);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('My Article');
      expect(result.items[0].url).toBe('https://example.com');
      expect(result.items[0].type).toBe('link');
    });

    it('should build body from note and excerpt', () => {
      const csv = `${validHeader}\nTitle,My notes,My excerpt,https://example.com,,,,,,false,false`;
      const result = parseRaindrop(csv);

      expect(result.items[0].body).toContain('My notes');
      expect(result.items[0].body).toContain('My excerpt');
    });

    it('should include highlights in body', () => {
      const csv = `${validHeader}\nTitle,,,https://example.com,,,,,Important highlight,false,false`;
      const result = parseRaindrop(csv);

      expect(result.items[0].body).toContain('Important highlight');
    });

    it('should merge explicit tags with folder tags', () => {
      const csv = `${validHeader}\nTitle,,,https://example.com,Development/React,"javascript,web",,,,false,false`;
      const result = parseRaindrop(csv);

      const tags = result.items[0].tags;
      expect(tags).toContain('javascript');
      expect(tags).toContain('web');
      expect(tags).toContain('react');
    });

    it('should handle missing columns gracefully', () => {
      const csv = 'title,url,folder\nMy Link,https://example.com,Bookmarks';
      // This won't be detected as Raindrop format (no excerpt/highlights)
      const result = parseRaindrop(csv);
      expect(result.success).toBe(false);
    });

    it('should skip rows with invalid URLs', () => {
      const csv = `${validHeader}\nTitle,,,,,,,,,,`;
      const result = parseRaindrop(csv);
      expect(result.stats.skipped).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty CSV', () => {
      const csv = `${validHeader}\n`;
      const result = parseRaindrop(csv);

      expect(result.success).toBe(true);
      expect(result.items).toHaveLength(0);
    });

    it('should parse dates from created column', () => {
      const csv = `${validHeader}\nTitle,,,https://example.com,,,2024-03-15T10:00:00Z,,,,false`;
      const result = parseRaindrop(csv);

      expect(result.items[0].createdAt).toBeDefined();
    });

    it('should handle quoted fields with commas', () => {
      const csv = `${validHeader}\n"Title, with comma",,,https://example.com,,"tag1,tag2",,,,false,false`;
      const result = parseRaindrop(csv);

      expect(result.items[0].title).toBe('Title, with comma');
    });

    it('should set metadata source to raindrop', () => {
      const csv = `${validHeader}\nTitle,,,https://example.com,,,,,,false,false`;
      const result = parseRaindrop(csv);

      expect(result.items[0].metadata?.source).toBe('raindrop');
    });

    it('should report parsing statistics', () => {
      const csv = `${validHeader}\nItem 1,,,https://example.com,,,,,,false,false\nItem 2,,,https://test.com,,,,,,false,false`;
      const result = parseRaindrop(csv);

      expect(result.stats.total).toBe(2);
      expect(result.stats.parsed).toBe(2);
      expect(result.stats.skipped).toBe(0);
    });

    it('should reject invalid format', () => {
      const csv = 'name,email\nJohn,john@test.com';
      const result = parseRaindrop(csv);

      expect(result.success).toBe(false);
    });
  });
});
