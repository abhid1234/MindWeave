import { describe, it, expect } from 'vitest';

describe('parsers/index exports', () => {
  it('should export all parser functions', async () => {
    const mod = await import('./index');
    expect(typeof mod.parseBookmarks).toBe('function');
    expect(typeof mod.isBookmarksFile).toBe('function');
    expect(typeof mod.parsePocket).toBe('function');
    expect(typeof mod.parsePocketCsv).toBe('function');
    expect(typeof mod.isPocketFile).toBe('function');
    expect(typeof mod.parseNotion).toBe('function');
    expect(typeof mod.isNotionZip).toBe('function');
    expect(typeof mod.parseEvernote).toBe('function');
    expect(typeof mod.isEvernoteFile).toBe('function');
  });
});
