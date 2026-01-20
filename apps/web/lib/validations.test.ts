import { describe, it, expect } from 'vitest';
import { createContentSchema } from './validations';

describe('createContentSchema', () => {
  describe('valid inputs', () => {
    it('should accept valid note', () => {
      const result = createContentSchema.safeParse({
        type: 'note',
        title: 'My Note',
        body: 'Some content',
        tags: ['test', 'note'],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          type: 'note',
          title: 'My Note',
          body: 'Some content',
          tags: ['test', 'note'],
        });
      }
    });

    it('should accept valid link with URL', () => {
      const result = createContentSchema.safeParse({
        type: 'link',
        title: 'Example Link',
        url: 'https://example.com',
        tags: [],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.url).toBe('https://example.com');
      }
    });

    it('should accept valid file', () => {
      const result = createContentSchema.safeParse({
        type: 'file',
        title: 'Document.pdf',
        tags: ['document', 'pdf'],
      });

      expect(result.success).toBe(true);
    });

    it('should accept empty string for optional fields', () => {
      const result = createContentSchema.safeParse({
        type: 'note',
        title: 'Test',
        body: '',
        url: '',
        tags: [],
      });

      expect(result.success).toBe(true);
    });

    it('should use default empty array for tags if not provided', () => {
      const result = createContentSchema.safeParse({
        type: 'note',
        title: 'Test',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toEqual([]);
      }
    });
  });

  describe('invalid inputs', () => {
    it('should reject invalid type', () => {
      const result = createContentSchema.safeParse({
        type: 'invalid',
        title: 'Test',
      });

      expect(result.success).toBe(false);
    });

    it('should reject empty title', () => {
      const result = createContentSchema.safeParse({
        type: 'note',
        title: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.title).toBeDefined();
      }
    });

    it('should reject title that is too long', () => {
      const result = createContentSchema.safeParse({
        type: 'note',
        title: 'a'.repeat(501),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.title).toBeDefined();
      }
    });

    it('should reject body that is too long', () => {
      const result = createContentSchema.safeParse({
        type: 'note',
        title: 'Test',
        body: 'a'.repeat(50001),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.body).toBeDefined();
      }
    });

    it('should reject invalid URL', () => {
      const result = createContentSchema.safeParse({
        type: 'link',
        title: 'Test',
        url: 'not-a-url',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.url).toBeDefined();
      }
    });

    it('should reject missing title', () => {
      const result = createContentSchema.safeParse({
        type: 'note',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.title).toBeDefined();
      }
    });

    it('should reject missing type', () => {
      const result = createContentSchema.safeParse({
        title: 'Test',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.type).toBeDefined();
      }
    });
  });

  describe('edge cases', () => {
    it('should handle URLs with various protocols', () => {
      const urls = [
        'https://example.com',
        'http://example.com',
        'ftp://files.example.com',
      ];

      urls.forEach((url) => {
        const result = createContentSchema.safeParse({
          type: 'link',
          title: 'Test',
          url,
        });
        expect(result.success).toBe(true);
      });
    });

    it('should handle special characters in title', () => {
      const result = createContentSchema.safeParse({
        type: 'note',
        title: 'Test & Title: "Special" <Characters>',
      });

      expect(result.success).toBe(true);
    });

    it('should handle very long tag array', () => {
      const tags = Array(100).fill('tag');
      const result = createContentSchema.safeParse({
        type: 'note',
        title: 'Test',
        tags,
      });

      expect(result.success).toBe(true);
    });
  });
});
