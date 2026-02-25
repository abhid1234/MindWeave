import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TEMPLATES, getTemplate, fillTemplatePlaceholders } from './templates';

describe('templates', () => {
  describe('TEMPLATES', () => {
    it('should have 5 templates', () => {
      expect(TEMPLATES).toHaveLength(5);
    });

    it('should have unique IDs', () => {
      const ids = TEMPLATES.map((t) => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should have required fields on all templates', () => {
      for (const t of TEMPLATES) {
        expect(t.id).toBeTruthy();
        expect(t.name).toBeTruthy();
        expect(t.icon).toBeTruthy();
        expect(t.description).toBeTruthy();
        expect(['note', 'link']).toContain(t.type);
        expect(t.defaultTitle).toBeTruthy();
        expect(t.bodyTemplate).toBeTruthy();
        expect(t.defaultTags.length).toBeGreaterThan(0);
      }
    });

    it('should include meeting-notes template', () => {
      const meetingNotes = TEMPLATES.find((t) => t.id === 'meeting-notes');
      expect(meetingNotes).toBeDefined();
      expect(meetingNotes!.type).toBe('note');
      expect(meetingNotes!.defaultTags).toContain('meeting');
    });

    it('should include article-summary as link type', () => {
      const article = TEMPLATES.find((t) => t.id === 'article-summary');
      expect(article).toBeDefined();
      expect(article!.type).toBe('link');
    });
  });

  describe('getTemplate', () => {
    it('should return template by ID', () => {
      const template = getTemplate('meeting-notes');
      expect(template).toBeDefined();
      expect(template!.id).toBe('meeting-notes');
    });

    it('should return undefined for unknown ID', () => {
      expect(getTemplate('nonexistent')).toBeUndefined();
    });

    it('should return each template by its ID', () => {
      for (const t of TEMPLATES) {
        expect(getTemplate(t.id)).toBe(t);
      }
    });
  });

  describe('fillTemplatePlaceholders', () => {
    beforeEach(() => {
      // Use fake timers with a fixed date, matching the pattern in utils.test.ts
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-15T14:30:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should replace {date} placeholder', () => {
      const result = fillTemplatePlaceholders('Meeting - {date}');
      expect(result).toContain('2024');
      expect(result).not.toContain('{date}');
    });

    it('should replace {time} placeholder', () => {
      const result = fillTemplatePlaceholders('Logged at {time}');
      expect(result).not.toContain('{time}');
    });

    it('should replace multiple placeholders', () => {
      const result = fillTemplatePlaceholders('{date} at {time}');
      expect(result).not.toContain('{date}');
      expect(result).not.toContain('{time}');
    });

    it('should return string unchanged if no placeholders', () => {
      expect(fillTemplatePlaceholders('Hello world')).toBe('Hello world');
    });
  });
});
