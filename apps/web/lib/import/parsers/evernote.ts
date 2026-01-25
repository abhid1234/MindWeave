/**
 * Evernote ENEX Parser
 *
 * Parses Evernote's ENEX XML export format
 */

import { ImportItem, ParseResult, ParseError } from '../types';
import { sanitizeTitle, normalizeTags, stripHtml, parseDate } from '../utils';

/**
 * Parse Evernote ENEX export
 */
export function parseEvernote(xml: string): ParseResult {
  const items: ImportItem[] = [];
  const errors: ParseError[] = [];
  const warnings: string[] = [];
  let total = 0;
  let skipped = 0;

  try {
    // Basic XML validation
    if (!xml.includes('<en-export') && !xml.includes('<note>')) {
      return {
        success: false,
        items: [],
        errors: [{ message: 'Invalid ENEX format. File does not contain Evernote export data.' }],
        warnings: [],
        stats: { total: 0, parsed: 0, skipped: 0 },
      };
    }

    // Extract all <note> elements
    const noteRegex = /<note>([\s\S]*?)<\/note>/gi;
    let noteMatch;

    while ((noteMatch = noteRegex.exec(xml)) !== null) {
      total++;
      const noteXml = noteMatch[1];

      try {
        const item = parseNote(noteXml);
        if (item) {
          items.push(item);
        } else {
          skipped++;
        }
      } catch (err) {
        const title = extractXmlValue(noteXml, 'title') || `Note ${total}`;
        errors.push({
          item: title,
          message: err instanceof Error ? err.message : 'Unknown error',
        });
        skipped++;
      }
    }

    if (total === 0) {
      warnings.push('No notes found in ENEX file. Make sure this is a valid Evernote export.');
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
          message: `Failed to parse Evernote export: ${err instanceof Error ? err.message : 'Unknown error'}`,
        },
      ],
      warnings: [],
      stats: { total: 0, parsed: 0, skipped: 0 },
    };
  }
}

/**
 * Parse a single <note> element
 */
function parseNote(noteXml: string): ImportItem | null {
  // Extract title
  const title = sanitizeTitle(extractXmlValue(noteXml, 'title'));

  // Extract content (ENML format in CDATA)
  let content = extractXmlValue(noteXml, 'content');

  // Content is usually in CDATA, extract it
  const cdataMatch = content.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  if (cdataMatch) {
    content = cdataMatch[1];
  }

  // Convert ENML to plain text
  const body = convertEnmlToText(content);

  // Skip empty notes
  if (!body.trim() && title === 'Untitled') {
    return null;
  }

  // Extract tags
  const tagMatches = noteXml.matchAll(/<tag>([\s\S]*?)<\/tag>/gi);
  const tags: string[] = [];
  for (const match of tagMatches) {
    if (match[1]) {
      tags.push(match[1].trim());
    }
  }

  // Extract dates
  const createdStr = extractXmlValue(noteXml, 'created');
  const updatedStr = extractXmlValue(noteXml, 'updated');
  const createdAt = parseEvernoteDate(createdStr) || parseEvernoteDate(updatedStr);

  // Extract source URL if present
  const sourceUrl = extractXmlValue(noteXml, 'source-url');

  // Extract notebook name for metadata
  const notebook = extractXmlAttribute(noteXml, 'note', 'notebook');

  return {
    title,
    body: body.trim(),
    type: 'note',
    tags: normalizeTags(tags),
    createdAt,
    metadata: {
      source: 'evernote',
      ...(sourceUrl && { sourceUrl }),
      ...(notebook && { notebook }),
    },
  };
}

/**
 * Extract value from XML element
 */
function extractXmlValue(xml: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

/**
 * Extract attribute from XML element
 */
function extractXmlAttribute(xml: string, tagName: string, attrName: string): string | null {
  const regex = new RegExp(`<${tagName}[^>]*${attrName}=["']([^"']*)["']`, 'i');
  const match = xml.match(regex);
  return match ? match[1] : null;
}

/**
 * Convert Evernote ENML to plain text
 */
function convertEnmlToText(enml: string): string {
  if (!enml) return '';

  let text = enml;

  // Remove en-note wrapper
  text = text.replace(/<\/?en-note[^>]*>/gi, '');

  // Handle en-todo checkboxes
  text = text.replace(/<en-todo checked="true"[^>]*>/gi, '[x] ');
  text = text.replace(/<en-todo[^>]*>/gi, '[ ] ');

  // Handle en-media (attachments) - note them as placeholders
  text = text.replace(/<en-media[^>]*>/gi, '[attachment]');

  // Handle en-crypt (encrypted text)
  text = text.replace(/<en-crypt[^>]*>[\s\S]*?<\/en-crypt>/gi, '[encrypted content]');

  // Convert common HTML elements
  text = stripHtml(text);

  return text;
}

/**
 * Parse Evernote date format (YYYYMMDDTHHMMSSZ)
 */
function parseEvernoteDate(dateStr: string | undefined): Date | undefined {
  if (!dateStr) return undefined;

  // Evernote format: 20240115T143022Z
  const match = dateStr.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/);
  if (!match) {
    return parseDate(dateStr);
  }

  const [, year, month, day, hour, minute, second] = match;
  const date = new Date(
    Date.UTC(
      parseInt(year, 10),
      parseInt(month, 10) - 1,
      parseInt(day, 10),
      parseInt(hour, 10),
      parseInt(minute, 10),
      parseInt(second, 10)
    )
  );

  return isNaN(date.getTime()) ? undefined : date;
}

/**
 * Check if content looks like an ENEX file
 */
export function isEvernoteFile(content: string): boolean {
  const lower = content.toLowerCase();
  return (
    lower.includes('<en-export') ||
    lower.includes('evernote') ||
    (lower.includes('<note>') && lower.includes('<content>'))
  );
}
