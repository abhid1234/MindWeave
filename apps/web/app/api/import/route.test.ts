import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock rate limiter to always allow requests in tests
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(() => ({
    success: true,
    remaining: 99,
    resetTime: Date.now() + 3600000,
  })),
  rateLimitHeaders: vi.fn(() => ({})),
  rateLimitExceededResponse: vi.fn(),
  RATE_LIMITS: {
    import: { maxRequests: 5, windowMs: 3600000 },
  },
}));

// Mock parsers
vi.mock('@/lib/import/parsers', () => ({
  parseBookmarks: vi.fn(),
  isBookmarksFile: vi.fn(),
  parsePocket: vi.fn(),
  parsePocketCsv: vi.fn(),
  isPocketFile: vi.fn(),
  parseNotion: vi.fn(),
  parseEvernote: vi.fn(),
  isEvernoteFile: vi.fn(),
}));

import { auth } from '@/lib/auth';
import {
  parseBookmarks,
  isBookmarksFile,
  parsePocket,
  isPocketFile,
  parseNotion,
  parseEvernote,
  isEvernoteFile,
} from '@/lib/import/parsers';

const mockAuth = auth as ReturnType<typeof vi.fn>;
const mockParseBookmarks = parseBookmarks as ReturnType<typeof vi.fn>;
const mockIsBookmarksFile = isBookmarksFile as ReturnType<typeof vi.fn>;
const mockParsePocket = parsePocket as ReturnType<typeof vi.fn>;
const mockIsPocketFile = isPocketFile as ReturnType<typeof vi.fn>;
const mockParseNotion = parseNotion as ReturnType<typeof vi.fn>;
const mockParseEvernote = parseEvernote as ReturnType<typeof vi.fn>;
const mockIsEvernoteFile = isEvernoteFile as ReturnType<typeof vi.fn>;

function createRequest(file: File | null, source: string | null): NextRequest {
  const formData = new FormData();
  if (file) formData.append('file', file);
  if (source) formData.append('source', source);

  return new NextRequest('http://localhost/api/import', {
    method: 'POST',
    body: formData,
  });
}

describe('Import API Route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('POST /api/import', () => {
    it('should return 401 for unauthenticated requests', async () => {
      mockAuth.mockResolvedValue(null);

      const file = new File(['content'], 'bookmarks.html', { type: 'text/html' });
      const request = createRequest(file, 'bookmarks');

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Unauthorized');
    });

    it('should return 400 when no file is provided', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } });

      const request = createRequest(null, 'bookmarks');

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('No file');
    });

    it('should return 400 when no source is provided', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } });

      const file = new File(['content'], 'bookmarks.html', { type: 'text/html' });
      const request = createRequest(file, null);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('source');
    });

    it('should return 400 for invalid source type', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } });

      const file = new File(['content'], 'file.txt', { type: 'text/plain' });
      const request = createRequest(file, 'invalid-source');

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Invalid import source');
    });

    it('should parse bookmarks file successfully', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
      mockIsBookmarksFile.mockReturnValue(true);
      mockParseBookmarks.mockReturnValue({
        success: true,
        items: [
          { title: 'Test', url: 'https://example.com', type: 'link', tags: [] },
        ],
        errors: [],
        warnings: [],
        stats: { total: 1, parsed: 1, skipped: 0 },
      });

      const file = new File(['bookmark content'], 'bookmarks.html', { type: 'text/html' });
      const request = createRequest(file, 'bookmarks');

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.items).toHaveLength(1);
      expect(data.items[0].title).toBe('Test');
    });

    it('should return 400 when file is not a valid bookmarks file', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
      mockIsBookmarksFile.mockReturnValue(false);

      const file = new File(['not bookmarks'], 'file.html', { type: 'text/html' });
      const request = createRequest(file, 'bookmarks');

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('valid bookmarks');
    });

    it('should parse Pocket file successfully', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
      mockIsPocketFile.mockReturnValue(true);
      mockParsePocket.mockReturnValue({
        success: true,
        items: [
          { title: 'Article', url: 'https://example.com', type: 'link', tags: ['tech'] },
        ],
        errors: [],
        warnings: [],
        stats: { total: 1, parsed: 1, skipped: 0 },
      });

      const file = new File(['pocket content'], 'pocket.html', { type: 'text/html' });
      const request = createRequest(file, 'pocket');

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.items).toHaveLength(1);
      expect(data.items[0].tags).toContain('tech');
    });

    it('should parse Evernote file successfully', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
      mockIsEvernoteFile.mockReturnValue(true);
      mockParseEvernote.mockReturnValue({
        success: true,
        items: [
          { title: 'Note', body: 'Content', type: 'note', tags: ['work'] },
        ],
        errors: [],
        warnings: [],
        stats: { total: 1, parsed: 1, skipped: 0 },
      });

      const file = new File(['enex content'], 'notes.enex', { type: 'application/xml' });
      const request = createRequest(file, 'evernote');

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.items).toHaveLength(1);
      expect(data.items[0].type).toBe('note');
    });

    it('should return parse errors and warnings', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
      mockIsBookmarksFile.mockReturnValue(true);
      mockParseBookmarks.mockReturnValue({
        success: true,
        items: [{ title: 'Valid', url: 'https://example.com', type: 'link', tags: [] }],
        errors: [{ item: 'Bad link', message: 'Invalid URL' }],
        warnings: ['Some bookmarks had no title'],
        stats: { total: 3, parsed: 1, skipped: 2 },
      });

      const file = new File(['bookmarks'], 'bookmarks.html', { type: 'text/html' });
      const request = createRequest(file, 'bookmarks');

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.errors).toHaveLength(1);
      expect(data.warnings).toHaveLength(1);
      expect(data.stats.skipped).toBe(2);
    });

    it('should parse Notion ZIP file successfully', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
      mockParseNotion.mockResolvedValue({
        success: true,
        items: [
          { title: 'Notion Page', body: 'Content', type: 'note', tags: [] },
        ],
        errors: [],
        warnings: [],
        stats: { total: 1, parsed: 1, skipped: 0 },
      });

      const file = new File(['zip content'], 'export.zip', { type: 'application/zip' });
      const request = createRequest(file, 'notion');

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.items).toHaveLength(1);
    });

    it('should return 400 for invalid Evernote file', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
      mockIsEvernoteFile.mockReturnValue(false);

      const file = new File(['not enex'], 'notes.enex', { type: 'application/xml' });
      const request = createRequest(file, 'evernote');

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('valid Evernote');
    });

    it('should handle parsing errors gracefully', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
      mockIsBookmarksFile.mockReturnValue(true);
      mockParseBookmarks.mockImplementation(() => {
        throw new Error('Parse error');
      });

      const file = new File(['bad content'], 'bookmarks.html', { type: 'text/html' });
      const request = createRequest(file, 'bookmarks');

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Parse error');
    });
  });
});
