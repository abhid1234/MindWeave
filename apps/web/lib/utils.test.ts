import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cn, formatRelativeTime, truncate, getDomain, slugify, generateId } from './utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
    });

    it('should handle Tailwind CSS conflicts', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4');
    });

    it('should handle empty input', () => {
      expect(cn()).toBe('');
    });
  });

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      // Mock current time to Jan 20, 2026, 12:00:00
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-20T12:00:00Z'));
    });

    it('should return "just now" for very recent dates', () => {
      const date = new Date('2026-01-20T11:59:30Z'); // 30 seconds ago
      expect(formatRelativeTime(date)).toBe('just now');
    });

    it('should return minutes for dates within an hour', () => {
      const date = new Date('2026-01-20T11:45:00Z'); // 15 minutes ago
      expect(formatRelativeTime(date)).toBe('15 minutes ago');
    });

    it('should return singular minute', () => {
      const date = new Date('2026-01-20T11:59:00Z'); // 1 minute ago
      expect(formatRelativeTime(date)).toBe('1 minute ago');
    });

    it('should return hours for dates within a day', () => {
      const date = new Date('2026-01-20T09:00:00Z'); // 3 hours ago
      expect(formatRelativeTime(date)).toBe('3 hours ago');
    });

    it('should return singular hour', () => {
      const date = new Date('2026-01-20T11:00:00Z'); // 1 hour ago
      expect(formatRelativeTime(date)).toBe('1 hour ago');
    });

    it('should return days for dates within a week', () => {
      const date = new Date('2026-01-18T12:00:00Z'); // 2 days ago
      expect(formatRelativeTime(date)).toBe('2 days ago');
    });

    it('should return weeks for dates within a month', () => {
      const date = new Date('2026-01-06T12:00:00Z'); // 2 weeks ago
      expect(formatRelativeTime(date)).toBe('2 weeks ago');
    });

    it('should return months for dates within a year', () => {
      const date = new Date('2025-11-20T12:00:00Z'); // 2 months ago
      expect(formatRelativeTime(date)).toBe('2 months ago');
    });

    it('should return years for dates over a year ago', () => {
      const date = new Date('2024-01-20T12:00:00Z'); // 2 years ago
      expect(formatRelativeTime(date)).toBe('2 years ago');
    });
  });

  describe('truncate', () => {
    it('should truncate long text', () => {
      const text = 'This is a very long text that needs to be truncated';
      expect(truncate(text, 20)).toBe('This is a very long ...');
    });

    it('should not truncate short text', () => {
      const text = 'Short text';
      expect(truncate(text, 20)).toBe('Short text');
    });

    it('should handle text exactly at max length', () => {
      const text = 'Exactly 20 chars!!!';
      expect(truncate(text, 19)).toBe('Exactly 20 chars!!!');
    });

    it('should handle empty string', () => {
      expect(truncate('', 10)).toBe('');
    });

    it('should handle maxLength of 0', () => {
      expect(truncate('Hello', 0)).toBe('...');
    });
  });

  describe('getDomain', () => {
    it('should extract domain from valid URL', () => {
      expect(getDomain('https://example.com/path')).toBe('example.com');
    });

    it('should extract domain from URL with subdomain', () => {
      expect(getDomain('https://www.example.com')).toBe('www.example.com');
    });

    it('should extract domain from URL with port', () => {
      expect(getDomain('http://localhost:3000/path')).toBe('localhost');
    });

    it('should return null for invalid URL', () => {
      expect(getDomain('not-a-url')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(getDomain('')).toBeNull();
    });

    it('should handle URLs with query parameters', () => {
      expect(getDomain('https://example.com/path?query=value')).toBe('example.com');
    });
  });

  describe('slugify', () => {
    it('should convert text to slug', () => {
      expect(slugify('Hello World')).toBe('hello-world');
    });

    it('should handle special characters', () => {
      expect(slugify('Hello, World!')).toBe('hello-world');
    });

    it('should handle multiple spaces', () => {
      expect(slugify('Hello    World')).toBe('hello-world');
    });

    it('should handle multiple hyphens', () => {
      expect(slugify('Hello--World')).toBe('hello-world');
    });

    it('should trim whitespace', () => {
      expect(slugify('  Hello World  ')).toBe('hello-world');
    });

    it('should handle numbers', () => {
      expect(slugify('React 19 Release')).toBe('react-19-release');
    });

    it('should handle underscores', () => {
      expect(slugify('hello_world')).toBe('hello_world');
    });

    it('should handle empty string', () => {
      expect(slugify('')).toBe('');
    });
  });

  describe('generateId', () => {
    it('should generate a string', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
    });

    it('should generate non-empty string', () => {
      const id = generateId();
      expect(id.length).toBeGreaterThan(0);
    });

    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('should generate alphanumeric strings', () => {
      const id = generateId();
      expect(id).toMatch(/^[a-z0-9]+$/);
    });
  });
});
