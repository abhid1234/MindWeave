/**
 * Import feature type definitions
 */

export type ImportSource = 'bookmarks' | 'pocket' | 'notion' | 'evernote';

export type ContentType = 'note' | 'link';

/**
 * Represents a single item to be imported
 */
export interface ImportItem {
  /** Content title */
  title: string;
  /** Content body (optional for links) */
  body?: string;
  /** URL for links */
  url?: string;
  /** User tags */
  tags: string[];
  /** Content type */
  type: ContentType;
  /** Original creation date if available */
  createdAt?: Date;
  /** Additional metadata */
  metadata?: {
    source: ImportSource;
    folderPath?: string;
    originalId?: string;
    [key: string]: unknown;
  };
}

/**
 * Error encountered during parsing
 */
export interface ParseError {
  /** Item identifier (title, index, etc.) */
  item?: string;
  /** Error message */
  message: string;
}

/**
 * Result of parsing an import file
 */
export interface ParseResult {
  /** Whether parsing completed without critical errors */
  success: boolean;
  /** Parsed items ready for import */
  items: ImportItem[];
  /** Errors encountered during parsing */
  errors: ParseError[];
  /** Non-critical warnings */
  warnings: string[];
  /** Parsing statistics */
  stats: {
    /** Total items found in file */
    total: number;
    /** Successfully parsed items */
    parsed: number;
    /** Skipped items (duplicates, invalid) */
    skipped: number;
  };
}

/**
 * Error for a specific failed import
 */
export interface ImportError {
  /** Item title or identifier */
  item: string;
  /** Reason for failure */
  reason: string;
}

/**
 * Result of the import operation
 */
export interface ImportResult {
  /** Whether import completed successfully */
  success: boolean;
  /** Human-readable message */
  message: string;
  /** Number of successfully imported items */
  imported: number;
  /** Number of skipped items (duplicates) */
  skipped: number;
  /** Number of failed items */
  failed: number;
  /** Details of failed items */
  errors: ImportError[];
  /** IDs of created content items */
  createdIds: string[];
}

/**
 * Options for the import operation
 */
export interface ImportOptions {
  /** Skip items that appear to be duplicates */
  skipDuplicates?: boolean;
  /** Generate auto-tags for imported items */
  generateAutoTags?: boolean;
  /** Generate embeddings for imported items */
  generateEmbeddings?: boolean;
  /** Additional tags to apply to all imported items */
  additionalTags?: string[];
}

/**
 * Import source configuration
 */
export interface ImportSourceConfig {
  /** Source identifier */
  id: ImportSource;
  /** Display name */
  name: string;
  /** Description */
  description: string;
  /** Accepted file extensions */
  acceptedExtensions: string[];
  /** Accepted MIME types */
  acceptedMimeTypes: string[];
  /** Maximum file size in bytes */
  maxFileSize: number;
  /** Icon name (Lucide icon) */
  icon: string;
}

/**
 * Import source configurations
 */
export const IMPORT_SOURCES: ImportSourceConfig[] = [
  {
    id: 'bookmarks',
    name: 'Browser Bookmarks',
    description: 'Import bookmarks from Chrome, Firefox, Safari, or Edge',
    acceptedExtensions: ['.html', '.htm'],
    acceptedMimeTypes: ['text/html'],
    maxFileSize: 50 * 1024 * 1024, // 50MB
    icon: 'Bookmark',
  },
  {
    id: 'pocket',
    name: 'Pocket',
    description: 'Import saved articles from Pocket (HTML export)',
    acceptedExtensions: ['.html', '.htm', '.csv'],
    acceptedMimeTypes: ['text/html', 'text/csv'],
    maxFileSize: 50 * 1024 * 1024, // 50MB
    icon: 'BookmarkCheck',
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Import pages from Notion (ZIP export with HTML/Markdown)',
    acceptedExtensions: ['.zip'],
    acceptedMimeTypes: ['application/zip', 'application/x-zip-compressed'],
    maxFileSize: 100 * 1024 * 1024, // 100MB
    icon: 'FileText',
  },
  {
    id: 'evernote',
    name: 'Evernote',
    description: 'Import notes from Evernote (ENEX export)',
    acceptedExtensions: ['.enex'],
    acceptedMimeTypes: ['application/xml', 'text/xml'],
    maxFileSize: 100 * 1024 * 1024, // 100MB
    icon: 'StickyNote',
  },
];

/**
 * Get import source configuration by ID
 */
export function getImportSource(id: ImportSource): ImportSourceConfig | undefined {
  return IMPORT_SOURCES.find((source) => source.id === id);
}
