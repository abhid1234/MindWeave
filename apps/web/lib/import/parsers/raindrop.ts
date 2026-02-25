/**
 * Raindrop.io Export Parser
 *
 * Parses Raindrop.io CSV export format
 */

import { ImportItem, ParseResult, ParseError } from '../types';
import { sanitizeTitle, normalizeUrl, normalizeTags, folderPathToTags, parseDate } from '../utils';

/**
 * Check if CSV content looks like a Raindrop.io export
 */
export function isRaindropFile(csv: string): boolean {
  const firstLine = csv.split('\n')[0]?.toLowerCase() || '';
  return (
    firstLine.includes('folder') &&
    firstLine.includes('url') &&
    (firstLine.includes('excerpt') || firstLine.includes('highlights'))
  );
}

/**
 * Parse Raindrop.io CSV export
 */
export function parseRaindrop(csv: string): ParseResult {
  const items: ImportItem[] = [];
  const errors: ParseError[] = [];
  const warnings: string[] = [];
  let total = 0;
  let skipped = 0;

  try {
    const lines = csv.split('\n');

    // Check header
    const header = lines[0]?.toLowerCase();
    if (!header || !isRaindropFile(csv)) {
      return {
        success: false,
        items: [],
        errors: [{ message: 'Invalid CSV format. This does not appear to be a Raindrop.io export.' }],
        warnings: [],
        stats: { total: 0, parsed: 0, skipped: 0 },
      };
    }

    // Parse header to get column indices
    const columns = parseCSVLine(header);
    const titleIndex = columns.findIndex((c) => c === 'title');
    const noteIndex = columns.findIndex((c) => c === 'note');
    const excerptIndex = columns.findIndex((c) => c === 'excerpt');
    const urlIndex = columns.findIndex((c) => c === 'url');
    const folderIndex = columns.findIndex((c) => c === 'folder');
    const tagsIndex = columns.findIndex((c) => c === 'tags');
    const createdIndex = columns.findIndex((c) => c === 'created');
    const highlightsIndex = columns.findIndex((c) => c === 'highlights');

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
        const url = urlIndex >= 0 ? values[urlIndex] : undefined;
        const title = titleIndex >= 0 ? values[titleIndex] : undefined;
        const note = noteIndex >= 0 ? values[noteIndex] : undefined;
        const excerpt = excerptIndex >= 0 ? values[excerptIndex] : undefined;
        const folder = folderIndex >= 0 ? values[folderIndex] : undefined;
        const tagsStr = tagsIndex >= 0 ? values[tagsIndex] : undefined;
        const created = createdIndex >= 0 ? values[createdIndex] : undefined;
        const highlights = highlightsIndex >= 0 ? values[highlightsIndex] : undefined;

        const normalizedUrl = normalizeUrl(url);
        if (!normalizedUrl) {
          errors.push({
            item: title || url || `Row ${i + 1}`,
            message: `Invalid URL: ${url || 'empty'}`,
          });
          skipped++;
          continue;
        }

        // Build body from note, excerpt, and highlights
        const bodyParts: string[] = [];
        if (note?.trim()) bodyParts.push(note.trim());
        if (excerpt?.trim()) bodyParts.push(excerpt.trim());
        if (highlights?.trim()) bodyParts.push(`**Highlights:** ${highlights.trim()}`);
        const body = bodyParts.join('\n\n') || undefined;

        // Build tags from explicit tags + folder path
        const explicitTags = tagsStr ? normalizeTags(tagsStr.split(',')) : [];
        const folderTags = folderPathToTags(folder);
        const allTags = normalizeTags([...explicitTags, ...folderTags]);

        const createdAt = parseDate(created);

        const item: ImportItem = {
          title: sanitizeTitle(title || normalizedUrl),
          url: normalizedUrl,
          body,
          type: 'link',
          tags: allTags,
          createdAt,
          metadata: {
            source: 'raindrop',
            folderPath: folder || undefined,
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

    if (total === 0) {
      warnings.push('No items found in Raindrop.io export.');
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
          message: `Failed to parse Raindrop.io CSV: ${err instanceof Error ? err.message : 'Unknown error'}`,
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
