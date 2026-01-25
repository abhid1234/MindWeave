/**
 * Browser Bookmarks HTML Parser
 *
 * Parses Netscape Bookmark File Format (used by Chrome, Firefox, Safari, Edge)
 */

import { parse as parseHtml, HTMLElement } from 'node-html-parser';
import { ImportItem, ParseResult, ParseError } from '../types';
import {
  sanitizeTitle,
  normalizeUrl,
  folderPathToTags,
  parseDate,
  decodeHtmlEntities,
} from '../utils';

/**
 * Parse browser bookmarks HTML export
 */
export function parseBookmarks(html: string): ParseResult {
  const items: ImportItem[] = [];
  const errors: ParseError[] = [];
  const warnings: string[] = [];
  let total = 0;
  let skipped = 0;

  try {
    const root = parseHtml(html, {
      lowerCaseTagName: true,
      comment: false,
    });

    // Find all bookmark links
    const links = root.querySelectorAll('a');
    total = links.length;

    if (total === 0) {
      warnings.push('No bookmarks found in file. Make sure this is a valid bookmarks HTML export.');
    }

    for (const link of links) {
      try {
        const href = link.getAttribute('href');
        const title = link.textContent;

        // Skip javascript: and empty URLs
        if (!href || href.startsWith('javascript:') || href.startsWith('data:')) {
          skipped++;
          continue;
        }

        const normalizedUrl = normalizeUrl(href);
        if (!normalizedUrl) {
          errors.push({
            item: title || 'Unknown',
            message: `Invalid URL: ${href}`,
          });
          skipped++;
          continue;
        }

        // Get folder path for tags
        const folderPath = getFolderPath(link);
        const tags = folderPathToTags(folderPath);

        // Parse add date if available
        const addDate = link.getAttribute('add_date');
        const createdAt = parseDate(addDate);

        // Get icon if available (for metadata)
        const icon = link.getAttribute('icon');

        const item: ImportItem = {
          title: sanitizeTitle(decodeHtmlEntities(title)),
          url: normalizedUrl,
          type: 'link',
          tags,
          createdAt,
          metadata: {
            source: 'bookmarks',
            folderPath: folderPath || undefined,
            ...(icon && { icon }),
          },
        };

        items.push(item);
      } catch (err) {
        errors.push({
          item: link.textContent || 'Unknown',
          message: err instanceof Error ? err.message : 'Unknown error',
        });
        skipped++;
      }
    }

    return {
      success: true,
      items,
      errors,
      warnings,
      stats: {
        total,
        parsed: items.length,
        skipped,
      },
    };
  } catch (err) {
    return {
      success: false,
      items: [],
      errors: [
        {
          message: `Failed to parse bookmarks file: ${err instanceof Error ? err.message : 'Unknown error'}`,
        },
      ],
      warnings: [],
      stats: {
        total: 0,
        parsed: 0,
        skipped: 0,
      },
    };
  }
}

/**
 * Get the folder path for a bookmark link by traversing up the DOM
 * node-html-parser creates a flat structure where H3 folder headers are siblings
 * to DT bookmark entries within the parent DL
 */
function getFolderPath(link: HTMLElement): string {
  const pathParts: string[] = [];

  // Start from the DT containing the link
  const current: HTMLElement | null = link.parentNode as HTMLElement | null;
  if (!current) return '';

  // Walk backwards through siblings to find H3 folder headers
  // The bookmark structure has H3 tags as siblings indicating folder boundaries
  const collectFolders = (element: HTMLElement | null): void => {
    if (!element) return;

    let sibling = element.previousElementSibling as HTMLElement | null;
    while (sibling) {
      const tag = sibling.tagName?.toLowerCase();
      if (tag === 'h3') {
        // Found a folder header - add to path
        const folderName = sibling.textContent?.trim();
        if (folderName) {
          pathParts.unshift(decodeHtmlEntities(folderName));
        }
      }
      sibling = sibling.previousElementSibling as HTMLElement | null;
    }

    // Recurse up to parent DL if exists
    const parent = element.parentNode as HTMLElement | null;
    if (parent?.tagName?.toLowerCase() === 'dl') {
      collectFolders(parent);
    }
  };

  collectFolders(current);

  return pathParts.join('/');
}

/**
 * Check if HTML content looks like a bookmarks file
 */
export function isBookmarksFile(html: string): boolean {
  const lowerHtml = html.toLowerCase();
  return (
    lowerHtml.includes('<!doctype netscape-bookmark-file') ||
    lowerHtml.includes('netscape-bookmark-file-1') ||
    (lowerHtml.includes('<dl>') && lowerHtml.includes('<dt>') && lowerHtml.includes('href='))
  );
}
