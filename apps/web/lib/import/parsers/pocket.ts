/**
 * Pocket Export Parser
 *
 * Parses Pocket HTML export format
 */

import { parse as parseHtml } from 'node-html-parser';
import { ImportItem, ParseResult, ParseError } from '../types';
import { sanitizeTitle, normalizeUrl, normalizeTags, parseDate, decodeHtmlEntities } from '../utils';

/**
 * Parse Pocket HTML export
 */
export function parsePocket(html: string): ParseResult {
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

    // Pocket exports have two sections: "Unread" and "Read"
    // Each contains a <ul> with <li> items containing <a> links
    const links = root.querySelectorAll('a');
    total = links.length;

    if (total === 0) {
      // Check if this looks like a Pocket file at all
      if (!isPocketFile(html)) {
        warnings.push(
          'This does not appear to be a Pocket export file. Please export from Pocket settings.'
        );
      } else {
        warnings.push('No items found in Pocket export.');
      }
    }

    for (const link of links) {
      try {
        const href = link.getAttribute('href');
        const title = link.textContent;

        if (!href) {
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

        // Pocket includes tags as comma-separated attribute
        const tagsAttr = link.getAttribute('tags');
        const tags = tagsAttr ? normalizeTags(tagsAttr.split(',')) : [];

        // Parse time_added attribute
        const timeAdded = link.getAttribute('time_added');
        const createdAt = parseDate(timeAdded);

        // Determine if from read or unread section
        let section = 'unknown';
        let parent = link.parentNode;
        while (parent) {
          const textContent = parent.toString?.() || '';
          if (textContent.toLowerCase().includes('<h1>unread</h1>')) {
            section = 'unread';
            break;
          } else if (textContent.toLowerCase().includes('<h1>read</h1>')) {
            section = 'read';
            break;
          }
          parent = parent.parentNode;
        }

        const item: ImportItem = {
          title: sanitizeTitle(decodeHtmlEntities(title)),
          url: normalizedUrl,
          type: 'link',
          tags,
          createdAt,
          metadata: {
            source: 'pocket',
            section,
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
          message: `Failed to parse Pocket export: ${err instanceof Error ? err.message : 'Unknown error'}`,
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
 * Check if HTML content looks like a Pocket export
 */
export function isPocketFile(html: string): boolean {
  const lowerHtml = html.toLowerCase();
  return (
    lowerHtml.includes('pocket') ||
    lowerHtml.includes('getpocket.com') ||
    (lowerHtml.includes('<h1>unread</h1>') || lowerHtml.includes('<h1>read</h1>'))
  );
}

/**
 * Parse Pocket CSV export (alternative format)
 */
export function parsePocketCsv(csv: string): ParseResult {
  const items: ImportItem[] = [];
  const errors: ParseError[] = [];
  const warnings: string[] = [];
  let total = 0;
  let skipped = 0;

  try {
    const lines = csv.split('\n');

    // Check header
    const header = lines[0]?.toLowerCase();
    if (!header?.includes('url') && !header?.includes('title')) {
      return {
        success: false,
        items: [],
        errors: [{ message: 'Invalid CSV format. Expected columns: url, title, tags' }],
        warnings: [],
        stats: { total: 0, parsed: 0, skipped: 0 },
      };
    }

    // Parse header to get column indices
    const columns = parseCSVLine(header);
    const urlIndex = columns.findIndex((c) => c === 'url' || c === 'link');
    const titleIndex = columns.findIndex((c) => c === 'title' || c === 'name');
    const tagsIndex = columns.findIndex((c) => c === 'tags' || c === 'tag');
    const dateIndex = columns.findIndex((c) => c === 'date' || c === 'time_added' || c === 'added');

    if (urlIndex === -1) {
      return {
        success: false,
        items: [],
        errors: [{ message: 'CSV must have a URL column' }],
        warnings: [],
        stats: { total: 0, parsed: 0, skipped: 0 },
      };
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      total++;

      try {
        const values = parseCSVLine(line);
        const url = values[urlIndex];
        const title = titleIndex >= 0 ? values[titleIndex] : undefined;
        const tagsStr = tagsIndex >= 0 ? values[tagsIndex] : undefined;
        const dateStr = dateIndex >= 0 ? values[dateIndex] : undefined;

        const normalizedUrl = normalizeUrl(url);
        if (!normalizedUrl) {
          errors.push({
            item: title || url || `Row ${i + 1}`,
            message: `Invalid URL: ${url}`,
          });
          skipped++;
          continue;
        }

        const tags = tagsStr ? normalizeTags(tagsStr.split(/[,|;]/)) : [];
        const createdAt = parseDate(dateStr);

        const item: ImportItem = {
          title: sanitizeTitle(title || normalizedUrl),
          url: normalizedUrl,
          type: 'link',
          tags,
          createdAt,
          metadata: {
            source: 'pocket',
          },
        };

        items.push(item);
      } catch (err) {
        errors.push({
          item: `Row ${i + 1}`,
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
          message: `Failed to parse CSV: ${err instanceof Error ? err.message : 'Unknown error'}`,
        },
      ],
      warnings: [],
      stats: { total: 0, parsed: 0, skipped: 0 },
    };
  }
}

/**
 * Simple CSV line parser handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}
