import { describe, it, expect } from 'vitest';
import { computeLineDiff, computeWordDiff, DiffPart } from './diff';

describe('diff', () => {
  describe('computeLineDiff', () => {
    it('should return a single unchanged part for empty strings', () => {
      const result = computeLineDiff('', '');
      expect(result).toHaveLength(0);
    });

    it('should return a single unchanged part for identical strings', () => {
      const result = computeLineDiff('hello world', 'hello world');
      expect(result).toHaveLength(1);
      expect(result[0].value).toBe('hello world');
      expect(result[0].added).toBeFalsy();
      expect(result[0].removed).toBeFalsy();
    });

    it('should return identical multi-line strings as unchanged', () => {
      const text = 'line one\nline two\nline three\n';
      const result = computeLineDiff(text, text);
      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(text);
      expect(result[0].added).toBeFalsy();
      expect(result[0].removed).toBeFalsy();
    });

    it('should detect a single added line from empty', () => {
      const result = computeLineDiff('', 'new line\n');
      expect(result.some((p: DiffPart) => p.added && p.value.includes('new line'))).toBe(true);
      expect(result.some((p: DiffPart) => p.removed)).toBe(false);
    });

    it('should detect a single removed line to empty', () => {
      const result = computeLineDiff('old line\n', '');
      expect(result.some((p: DiffPart) => p.removed && p.value.includes('old line'))).toBe(true);
      expect(result.some((p: DiffPart) => p.added)).toBe(false);
    });

    it('should detect a changed line', () => {
      const result = computeLineDiff('old line\n', 'new line\n');
      expect(result.some((p: DiffPart) => p.removed && p.value.includes('old'))).toBe(true);
      expect(result.some((p: DiffPart) => p.added && p.value.includes('new'))).toBe(true);
    });

    it('should handle multi-line additions', () => {
      const oldText = 'line 1\nline 3\n';
      const newText = 'line 1\nline 2\nline 3\n';
      const result = computeLineDiff(oldText, newText);
      const addedParts = result.filter((p: DiffPart) => p.added);
      expect(addedParts.length).toBeGreaterThanOrEqual(1);
      expect(addedParts.some((p: DiffPart) => p.value.includes('line 2'))).toBe(true);
    });

    it('should handle multi-line removals', () => {
      const oldText = 'line 1\nline 2\nline 3\n';
      const newText = 'line 1\nline 3\n';
      const result = computeLineDiff(oldText, newText);
      const removedParts = result.filter((p: DiffPart) => p.removed);
      expect(removedParts.length).toBeGreaterThanOrEqual(1);
      expect(removedParts.some((p: DiffPart) => p.value.includes('line 2'))).toBe(true);
    });

    it('should handle mixed additions and removals', () => {
      const oldText = 'alpha\nbeta\ngamma\n';
      const newText = 'alpha\ndelta\ngamma\nepsilon\n';
      const result = computeLineDiff(oldText, newText);

      const removedParts = result.filter((p: DiffPart) => p.removed);
      const addedParts = result.filter((p: DiffPart) => p.added);

      expect(removedParts.some((p: DiffPart) => p.value.includes('beta'))).toBe(true);
      expect(addedParts.some((p: DiffPart) => p.value.includes('delta'))).toBe(true);
      expect(addedParts.some((p: DiffPart) => p.value.includes('epsilon'))).toBe(true);
    });

    it('should handle null-like values by treating them as empty strings', () => {
      // The function uses ?? '' internally, so null/undefined get coerced
      const result = computeLineDiff(null as unknown as string, undefined as unknown as string);
      expect(result).toHaveLength(0);
    });

    it('should handle null oldText with non-empty newText', () => {
      const result = computeLineDiff(null as unknown as string, 'some text\n');
      expect(result.some((p: DiffPart) => p.added && p.value.includes('some text'))).toBe(true);
      expect(result.some((p: DiffPart) => p.removed)).toBe(false);
    });

    it('should handle non-empty oldText with undefined newText', () => {
      const result = computeLineDiff('some text\n', undefined as unknown as string);
      expect(result.some((p: DiffPart) => p.removed && p.value.includes('some text'))).toBe(true);
      expect(result.some((p: DiffPart) => p.added)).toBe(false);
    });

    it('should preserve line boundaries in diff parts', () => {
      const oldText = 'aaa\nbbb\nccc\n';
      const newText = 'aaa\nxxx\nccc\n';
      const result = computeLineDiff(oldText, newText);

      // Unchanged parts should contain the unchanged lines
      const unchangedParts = result.filter(
        (p: DiffPart) => !p.added && !p.removed
      );
      expect(unchangedParts.some((p: DiffPart) => p.value.includes('aaa'))).toBe(true);
      expect(unchangedParts.some((p: DiffPart) => p.value.includes('ccc'))).toBe(true);
    });

    it('should handle completely different multi-line content', () => {
      const oldText = 'line A\nline B\n';
      const newText = 'line X\nline Y\nline Z\n';
      const result = computeLineDiff(oldText, newText);

      const removedParts = result.filter((p: DiffPart) => p.removed);
      const addedParts = result.filter((p: DiffPart) => p.added);

      expect(removedParts.length).toBeGreaterThanOrEqual(1);
      expect(addedParts.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('computeWordDiff', () => {
    it('should return empty array for empty strings', () => {
      const result = computeWordDiff('', '');
      expect(result).toHaveLength(0);
    });

    it('should return a single unchanged part for identical strings', () => {
      const result = computeWordDiff('hello world', 'hello world');
      expect(result).toHaveLength(1);
      expect(result[0].value).toBe('hello world');
      expect(result[0].added).toBeFalsy();
      expect(result[0].removed).toBeFalsy();
    });

    it('should detect a single word change', () => {
      const result = computeWordDiff('hello world', 'hello earth');
      const removedParts = result.filter((p: DiffPart) => p.removed);
      const addedParts = result.filter((p: DiffPart) => p.added);

      expect(removedParts.some((p: DiffPart) => p.value.includes('world'))).toBe(true);
      expect(addedParts.some((p: DiffPart) => p.value.includes('earth'))).toBe(true);
    });

    it('should detect word additions', () => {
      const result = computeWordDiff('hello', 'hello beautiful world');
      const addedParts = result.filter((p: DiffPart) => p.added);
      expect(addedParts.length).toBeGreaterThanOrEqual(1);
      expect(
        addedParts.some(
          (p: DiffPart) => p.value.includes('beautiful') || p.value.includes('world')
        )
      ).toBe(true);
    });

    it('should detect word removals', () => {
      const result = computeWordDiff('hello beautiful world', 'hello world');
      const removedParts = result.filter((p: DiffPart) => p.removed);
      expect(removedParts.length).toBeGreaterThanOrEqual(1);
      expect(removedParts.some((p: DiffPart) => p.value.includes('beautiful'))).toBe(true);
    });

    it('should handle complete replacement from empty', () => {
      const result = computeWordDiff('', 'brand new text');
      expect(result.some((p: DiffPart) => p.added)).toBe(true);
      const allAdded = result.filter((p: DiffPart) => p.added).map((p) => p.value).join('');
      expect(allAdded).toBe('brand new text');
    });

    it('should handle complete removal to empty', () => {
      const result = computeWordDiff('some old text', '');
      expect(result.some((p: DiffPart) => p.removed)).toBe(true);
      const allRemoved = result.filter((p: DiffPart) => p.removed).map((p) => p.value).join('');
      expect(allRemoved).toBe('some old text');
    });

    it('should handle null-like values by treating them as empty strings', () => {
      const result = computeWordDiff(null as unknown as string, undefined as unknown as string);
      expect(result).toHaveLength(0);
    });

    it('should handle null oldText with non-empty newText', () => {
      const result = computeWordDiff(null as unknown as string, 'new content');
      expect(result.some((p: DiffPart) => p.added)).toBe(true);
      const addedText = result.filter((p: DiffPart) => p.added).map((p) => p.value).join('');
      expect(addedText).toBe('new content');
    });

    it('should handle non-empty oldText with undefined newText', () => {
      const result = computeWordDiff('old content', undefined as unknown as string);
      expect(result.some((p: DiffPart) => p.removed)).toBe(true);
      const removedText = result.filter((p: DiffPart) => p.removed).map((p) => p.value).join('');
      expect(removedText).toBe('old content');
    });

    it('should handle mixed additions and removals at word level', () => {
      const result = computeWordDiff('the quick brown fox', 'the slow brown cat');
      const removedParts = result.filter((p: DiffPart) => p.removed);
      const addedParts = result.filter((p: DiffPart) => p.added);

      expect(removedParts.some((p: DiffPart) => p.value.includes('quick'))).toBe(true);
      expect(removedParts.some((p: DiffPart) => p.value.includes('fox'))).toBe(true);
      expect(addedParts.some((p: DiffPart) => p.value.includes('slow'))).toBe(true);
      expect(addedParts.some((p: DiffPart) => p.value.includes('cat'))).toBe(true);
    });

    it('should preserve unchanged words between changes', () => {
      const result = computeWordDiff('the quick brown fox', 'the slow brown cat');
      const unchangedParts = result.filter(
        (p: DiffPart) => !p.added && !p.removed
      );
      const unchangedText = unchangedParts.map((p) => p.value).join('');
      expect(unchangedText).toContain('the');
      expect(unchangedText).toContain('brown');
    });

    it('should handle multi-line text at word level', () => {
      const oldText = 'hello world\ngoodbye moon';
      const newText = 'hello earth\ngoodbye sun';
      const result = computeWordDiff(oldText, newText);

      const removedParts = result.filter((p: DiffPart) => p.removed);
      const addedParts = result.filter((p: DiffPart) => p.added);

      expect(removedParts.length).toBeGreaterThanOrEqual(1);
      expect(addedParts.length).toBeGreaterThanOrEqual(1);
    });

    it('should return proper DiffPart shape', () => {
      const result = computeWordDiff('old', 'new');
      for (const part of result) {
        expect(part).toHaveProperty('value');
        expect(typeof part.value).toBe('string');
        // added and removed should be boolean or undefined
        if (part.added !== undefined) {
          expect(typeof part.added).toBe('boolean');
        }
        if (part.removed !== undefined) {
          expect(typeof part.removed).toBe('boolean');
        }
      }
    });
  });
});
