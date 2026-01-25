/**
 * Import utility functions
 */

/**
 * Sanitize a title by removing excessive whitespace and trimming
 */
export function sanitizeTitle(title: string | undefined | null): string {
  if (!title) return 'Untitled';

  // Remove excessive whitespace
  let sanitized = title.replace(/\s+/g, ' ').trim();

  // Remove null bytes and other control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  // Truncate to max length
  if (sanitized.length > 500) {
    sanitized = sanitized.substring(0, 497) + '...';
  }

  return sanitized || 'Untitled';
}

/**
 * Normalize a tag string to lowercase, trimmed, valid format
 */
export function normalizeTag(tag: string): string {
  // Lowercase, trim
  let normalized = tag.toLowerCase().trim();

  // Replace spaces and special chars with hyphens
  normalized = normalized.replace(/[^a-z0-9-_]/g, '-');

  // Remove multiple consecutive hyphens
  normalized = normalized.replace(/-+/g, '-');

  // Remove leading/trailing hyphens
  normalized = normalized.replace(/^-|-$/g, '');

  // Truncate to 50 chars
  if (normalized.length > 50) {
    normalized = normalized.substring(0, 50);
  }

  return normalized;
}

/**
 * Normalize an array of tags, removing duplicates and empty tags
 */
export function normalizeTags(tags: (string | undefined | null)[]): string[] {
  const normalizedSet = new Set<string>();

  for (const tag of tags) {
    if (!tag) continue;
    const normalized = normalizeTag(tag);
    if (normalized && normalized.length > 0) {
      normalizedSet.add(normalized);
    }
  }

  return Array.from(normalizedSet);
}

/**
 * Convert a folder path to tags
 * e.g., "Bookmarks Bar/Development/JavaScript" -> ["development", "javascript"]
 */
export function folderPathToTags(folderPath: string | undefined | null): string[] {
  if (!folderPath) return [];

  // Split by common separators
  const parts = folderPath.split(/[/\\>]+/);

  // Filter out common root folder names
  const excludedFolders = new Set([
    'bookmarks',
    'bookmarks bar',
    'bookmarks menu',
    'bookmarks toolbar',
    'other bookmarks',
    'mobile bookmarks',
    'favorites',
    'favorites bar',
    'unfiled bookmarks',
    'root',
    'export',
    'exported',
  ]);

  const tags: string[] = [];
  for (const part of parts) {
    const trimmed = part.trim().toLowerCase();
    if (trimmed && !excludedFolders.has(trimmed)) {
      tags.push(trimmed);
    }
  }

  return normalizeTags(tags);
}

/**
 * Extract domain from URL for potential tagging
 */
export function extractDomain(url: string | undefined | null): string | null {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
    // Remove www prefix
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

/**
 * Validate and normalize a URL
 */
export function normalizeUrl(url: string | undefined | null): string | null {
  if (!url) return null;

  let normalized = url.trim();

  // Add protocol if missing
  if (!normalized.match(/^https?:\/\//i)) {
    normalized = 'https://' + normalized;
  }

  // Validate
  try {
    new URL(normalized);
    return normalized;
  } catch {
    return null;
  }
}

/**
 * Strip HTML tags from content, preserving some structure
 */
export function stripHtml(html: string | undefined | null): string {
  if (!html) return '';

  let text = html;

  // Replace block elements with newlines
  text = text.replace(/<(br|p|div|h[1-6]|li|tr)[^>]*>/gi, '\n');

  // Replace list items with bullets
  text = text.replace(/<li[^>]*>/gi, '• ');

  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  text = decodeHtmlEntities(text);

  // Clean up whitespace
  text = text.replace(/\n\s*\n/g, '\n\n').trim();

  return text;
}

/**
 * Decode common HTML entities
 */
export function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#160;': ' ',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™',
    '&ndash;': '\u2013',
    '&mdash;': '\u2014',
    '&lsquo;': '\u2018',
    '&rsquo;': '\u2019',
    '&ldquo;': '\u201C',
    '&rdquo;': '\u201D',
    '&hellip;': '\u2026',
  };

  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'gi'), char);
  }

  // Handle numeric entities
  decoded = decoded.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));

  return decoded;
}

/**
 * Generate a unique ID for deduplication
 */
export function generateDedupKey(item: { url?: string; title: string; type: string }): string {
  if (item.url) {
    // For links, use normalized URL
    return `url:${normalizeUrl(item.url)}`;
  }
  // For notes, use normalized title
  return `title:${item.title.toLowerCase().trim()}`;
}

/**
 * Truncate text to a maximum length, preserving word boundaries
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
}

/**
 * Parse date from various formats commonly used in exports
 */
export function parseDate(dateStr: string | number | undefined | null): Date | undefined {
  if (!dateStr) return undefined;

  // Unix timestamp in seconds
  if (typeof dateStr === 'number') {
    const timestamp = dateStr > 1e12 ? dateStr : dateStr * 1000;
    const date = new Date(timestamp);
    return isValidDate(date) ? date : undefined;
  }

  // Check if it looks like an ISO date string first (contains letters or dashes)
  if (/[a-zA-Z-]/.test(dateStr)) {
    try {
      const date = new Date(dateStr);
      return isValidDate(date) ? date : undefined;
    } catch {
      return undefined;
    }
  }

  // String timestamp (only if purely numeric)
  const numericDate = parseInt(dateStr, 10);
  if (!isNaN(numericDate) && numericDate > 0 && /^\d+$/.test(dateStr.trim())) {
    const timestamp = numericDate > 1e12 ? numericDate : numericDate * 1000;
    const date = new Date(timestamp);
    return isValidDate(date) ? date : undefined;
  }

  // Try as generic date string
  try {
    const date = new Date(dateStr);
    return isValidDate(date) ? date : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Check if a date is valid and reasonable (not in far future or past)
 */
function isValidDate(date: Date): boolean {
  const timestamp = date.getTime();
  const now = Date.now();
  const minDate = new Date('1990-01-01').getTime();
  const maxDate = now + 24 * 60 * 60 * 1000; // tomorrow

  return !isNaN(timestamp) && timestamp >= minDate && timestamp <= maxDate;
}

/**
 * Batch array into chunks
 */
export function batchArray<T>(array: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
}
