/**
 * Notion Export Parser
 *
 * Parses Notion ZIP exports containing HTML and Markdown files
 */

import JSZip from 'jszip';
import { parse as parseHtml } from 'node-html-parser';
import { ImportItem, ParseResult, ParseError } from '../types';
import { sanitizeTitle, normalizeTags, folderPathToTags, stripHtml, decodeHtmlEntities } from '../utils';

/**
 * Parse Notion ZIP export
 */
export async function parseNotion(zipBuffer: ArrayBuffer): Promise<ParseResult> {
  const items: ImportItem[] = [];
  const errors: ParseError[] = [];
  const warnings: string[] = [];
  let total = 0;
  let skipped = 0;

  try {
    const zip = await JSZip.loadAsync(zipBuffer);
    const files = Object.keys(zip.files);

    // Filter for HTML and Markdown files, excluding CSV exports
    const contentFiles = files.filter(
      (f) =>
        (f.endsWith('.html') || f.endsWith('.md')) &&
        !f.startsWith('__MACOSX') &&
        !f.includes('.DS_Store') &&
        !zip.files[f].dir
    );

    total = contentFiles.length;

    if (total === 0) {
      warnings.push(
        'No content files found in ZIP. Make sure this is a Notion export with HTML or Markdown format.'
      );
    }

    for (const filePath of contentFiles) {
      try {
        const file = zip.files[filePath];
        const content = await file.async('string');

        // Extract folder path for tags (excluding the filename)
        const pathParts = filePath.split('/');
        const fileName = pathParts.pop() || '';
        const folderPath = pathParts.join('/');

        // Parse based on file type
        let item: ImportItem | null = null;

        if (filePath.endsWith('.html')) {
          item = parseNotionHtml(content, fileName, folderPath);
        } else if (filePath.endsWith('.md')) {
          item = parseNotionMarkdown(content, fileName, folderPath);
        }

        if (item) {
          items.push(item);
        } else {
          skipped++;
        }
      } catch (err) {
        errors.push({
          item: filePath,
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
          message: `Failed to parse Notion export: ${err instanceof Error ? err.message : 'Unknown error'}`,
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
 * Parse a Notion HTML file
 */
function parseNotionHtml(html: string, fileName: string, folderPath: string): ImportItem | null {
  try {
    const root = parseHtml(html, {
      lowerCaseTagName: true,
      comment: false,
    });

    // Get title from various sources
    let title =
      root.querySelector('h1.page-title')?.textContent ||
      root.querySelector('title')?.textContent ||
      root.querySelector('h1')?.textContent ||
      extractTitleFromFileName(fileName);

    title = sanitizeTitle(decodeHtmlEntities(title));

    // Get body content
    const article = root.querySelector('article') || root.querySelector('.page-body') || root;

    // Remove title from body if present
    const titleElement =
      article.querySelector('h1.page-title') ||
      article.querySelector('header') ||
      article.querySelector('h1');
    if (titleElement) {
      titleElement.remove();
    }

    let body = article.innerHTML;
    body = stripHtml(body);

    // Skip empty pages
    if (!body.trim() && !title) {
      return null;
    }

    // Generate tags from folder path
    const tags = folderPathToTags(folderPath);

    // Extract inline tags if present (Notion uses #tag format)
    const inlineTags = extractInlineTags(body);
    const allTags = normalizeTags([...tags, ...inlineTags]);

    return {
      title,
      body: body.trim(),
      type: 'note',
      tags: allTags,
      metadata: {
        source: 'notion',
        folderPath: folderPath || undefined,
        originalFileName: fileName,
      },
    };
  } catch (err) {
    console.error('Error parsing Notion HTML:', err);
    return null;
  }
}

/**
 * Parse a Notion Markdown file
 */
function parseNotionMarkdown(markdown: string, fileName: string, folderPath: string): ImportItem | null {
  try {
    const lines = markdown.split('\n');

    // Extract title from first H1 or filename
    let title = '';
    let bodyStartIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('# ')) {
        title = line.substring(2).trim();
        bodyStartIndex = i + 1;
        break;
      }
      // Skip empty lines at the start
      if (line && !title) {
        break;
      }
    }

    if (!title) {
      title = extractTitleFromFileName(fileName);
    }

    title = sanitizeTitle(title);

    // Get body (everything after title)
    const body = lines.slice(bodyStartIndex).join('\n').trim();

    // Skip empty pages
    if (!body && title === 'Untitled') {
      return null;
    }

    // Generate tags from folder path
    const tags = folderPathToTags(folderPath);

    // Extract inline tags
    const inlineTags = extractInlineTags(body);
    const allTags = normalizeTags([...tags, ...inlineTags]);

    return {
      title,
      body,
      type: 'note',
      tags: allTags,
      metadata: {
        source: 'notion',
        folderPath: folderPath || undefined,
        originalFileName: fileName,
      },
    };
  } catch (err) {
    console.error('Error parsing Notion Markdown:', err);
    return null;
  }
}

/**
 * Extract title from Notion's filename format (Name UUID.ext)
 */
function extractTitleFromFileName(fileName: string): string {
  // Remove extension
  let name = fileName.replace(/\.(html|md)$/i, '');

  // Notion appends a UUID to filenames, try to remove it
  // Format: "Page Name 32characteruuid" or "Page Name (UUID)"
  name = name.replace(/\s+[a-f0-9]{32}$/i, '');
  name = name.replace(/\s+\([a-f0-9-]+\)$/i, '');

  // Also handle URL-encoded spaces
  name = decodeURIComponent(name);
  name = name.replace(/%20/g, ' ');

  return name.trim() || 'Untitled';
}

/**
 * Extract inline tags from content (hashtag format)
 */
function extractInlineTags(content: string): string[] {
  const tagRegex = /#([a-zA-Z][a-zA-Z0-9_-]*)/g;
  const tags: string[] = [];
  let match;

  while ((match = tagRegex.exec(content)) !== null) {
    // Filter out common non-tag patterns
    const tag = match[1];
    if (tag.length > 1 && tag.length <= 30) {
      tags.push(tag);
    }
  }

  return tags;
}

/**
 * Check if buffer looks like a Notion export ZIP
 */
export async function isNotionZip(zipBuffer: ArrayBuffer): Promise<boolean> {
  try {
    const zip = await JSZip.loadAsync(zipBuffer);
    const files = Object.keys(zip.files);

    // Notion exports typically have HTML/MD files in folders
    const hasContentFiles = files.some((f) => f.endsWith('.html') || f.endsWith('.md'));
    const hasNotionStructure = files.some(
      (f) => f.includes('/') && (f.endsWith('.html') || f.endsWith('.md'))
    );

    return hasContentFiles && hasNotionStructure;
  } catch {
    return false;
  }
}
