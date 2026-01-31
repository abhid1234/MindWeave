/**
 * Twitter/X Archive Bookmarks Parser
 *
 * Parses the `bookmarks.js` file from an X (Twitter) data archive.
 * File format: `window.YTD.bookmarks.part0 = [...]`
 */

import type { ParseResult } from '../types';

interface TwitterBookmarkEntry {
  bookmark: {
    tweetId: string;
    fullText?: string;
  };
}

const BOOKMARKS_PREFIX = 'window.YTD.bookmarks.part0';

/**
 * Check if content is a Twitter bookmarks.js file
 */
export function isTwitterBookmarksFile(content: string): boolean {
  return content.trimStart().startsWith(BOOKMARKS_PREFIX);
}

/**
 * Parse Twitter/X archive bookmarks.js file
 */
export function parseTwitterBookmarks(content: string): ParseResult {
  const result: ParseResult = {
    success: false,
    items: [],
    errors: [],
    warnings: [],
    stats: { total: 0, parsed: 0, skipped: 0 },
  };

  try {
    // Strip the variable assignment prefix to get raw JSON
    const trimmed = content.trimStart();
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) {
      result.errors.push({ message: 'Invalid Twitter bookmarks file format.' });
      return result;
    }

    const jsonStr = trimmed.slice(eqIndex + 1).trim();
    let entries: TwitterBookmarkEntry[];

    try {
      entries = JSON.parse(jsonStr);
    } catch {
      result.errors.push({ message: 'Failed to parse JSON from bookmarks file.' });
      return result;
    }

    if (!Array.isArray(entries)) {
      result.errors.push({ message: 'Expected an array of bookmark entries.' });
      return result;
    }

    result.stats.total = entries.length;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const tweetId = entry?.bookmark?.tweetId;

      if (!tweetId) {
        result.stats.skipped++;
        result.errors.push({
          item: `Entry ${i}`,
          message: 'Missing tweetId',
        });
        continue;
      }

      const fullText = entry.bookmark.fullText;
      const title = fullText
        ? fullText.length > 100
          ? fullText.slice(0, 100) + '…'
          : fullText
        : `Tweet ${tweetId}`;

      result.items.push({
        type: 'link',
        title,
        body: fullText || undefined,
        url: `https://x.com/i/status/${tweetId}`,
        tags: ['twitter-bookmark'],
        metadata: {
          source: 'twitter',
          originalId: tweetId,
        },
      });

      result.stats.parsed++;
    }

    result.success = true;
  } catch (error) {
    result.errors.push({
      message: error instanceof Error ? error.message : 'Unknown parsing error',
    });
  }

  return result;
}
