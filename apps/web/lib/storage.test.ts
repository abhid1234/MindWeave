import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted so mocks and env are ready BEFORE vi.mock factory runs
// and before the module-level `const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME` executes.
const { mockSave, mockDelete, mockFile, mockBucket } = vi.hoisted(() => {
  // Set env var early so the module captures it at load time
  process.env.GCS_BUCKET_NAME = 'test-bucket';

  const mockSave = vi.fn().mockResolvedValue(undefined);
  const mockDelete = vi.fn().mockResolvedValue(undefined);
  const mockFile = vi.fn(() => ({ save: mockSave, delete: mockDelete }));
  const mockBucket = vi.fn(() => ({ file: mockFile }));

  return { mockSave, mockDelete, mockFile, mockBucket };
});

vi.mock('@google-cloud/storage', () => ({
  Storage: class MockStorage {
    bucket = mockBucket;
  },
}));

import {
  isGCSConfigured,
  getPublicUrl,
  extractGCSObjectPath,
  uploadToGCS,
  deleteFromGCS,
} from './storage';

describe('storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GCS_BUCKET_NAME = 'test-bucket';
  });

  // ── isGCSConfigured ──────────────────────────────────────────────

  describe('isGCSConfigured()', () => {
    it('returns true when GCS_BUCKET_NAME is set', () => {
      // The module captured the env var at import time as 'test-bucket'
      expect(isGCSConfigured()).toBe(true);
    });

    // Because GCS_BUCKET_NAME is captured at module level as a const,
    // deleting it after import won't change the cached value.
    it('returns true even after deleting env var (captured at module load)', () => {
      delete process.env.GCS_BUCKET_NAME;
      // Still true because the module-level const was already set
      expect(isGCSConfigured()).toBe(true);
    });
  });

  // ── getPublicUrl ─────────────────────────────────────────────────

  describe('getPublicUrl()', () => {
    it('returns correct URL format for a simple path', () => {
      const url = getPublicUrl('uploads/user1/photo.png');
      expect(url).toBe(
        'https://storage.googleapis.com/test-bucket/uploads/user1/photo.png'
      );
    });

    it('returns correct URL format for a nested path', () => {
      const url = getPublicUrl('uploads/abc123/subdir/file.pdf');
      expect(url).toBe(
        'https://storage.googleapis.com/test-bucket/uploads/abc123/subdir/file.pdf'
      );
    });

    it('handles a root-level object path', () => {
      const url = getPublicUrl('readme.txt');
      expect(url).toBe(
        'https://storage.googleapis.com/test-bucket/readme.txt'
      );
    });
  });

  // ── extractGCSObjectPath ─────────────────────────────────────────

  describe('extractGCSObjectPath()', () => {
    it('extracts object path from a full GCS URL', () => {
      const result = extractGCSObjectPath(
        'https://storage.googleapis.com/test-bucket/uploads/user1/file.png'
      );
      expect(result).toBe('uploads/user1/file.png');
    });

    it('extracts object path from a GCS URL with a different bucket', () => {
      const result = extractGCSObjectPath(
        'https://storage.googleapis.com/other-bucket/docs/report.pdf'
      );
      expect(result).toBe('docs/report.pdf');
    });

    it('converts legacy /api/files path to uploads path', () => {
      const result = extractGCSObjectPath('/api/files/user123/image.jpg');
      expect(result).toBe('uploads/user123/image.jpg');
    });

    it('returns null for null input', () => {
      const result = extractGCSObjectPath(null as unknown as string);
      expect(result).toBeNull();
    });

    it('returns null for empty string', () => {
      const result = extractGCSObjectPath('');
      expect(result).toBeNull();
    });

    it('returns null for a random unrecognized string', () => {
      const result = extractGCSObjectPath('some-random-string');
      expect(result).toBeNull();
    });

    it('returns null for a non-GCS https URL', () => {
      const result = extractGCSObjectPath('https://example.com/files/photo.png');
      expect(result).toBeNull();
    });
  });

  // ── uploadToGCS ──────────────────────────────────────────────────

  describe('uploadToGCS()', () => {
    it('calls bucket with the configured bucket name', async () => {
      await uploadToGCS('uploads/u1/test.txt', Buffer.from('hello'), 'text/plain');
      expect(mockBucket).toHaveBeenCalledWith('test-bucket');
    });

    it('calls file with the correct object path', async () => {
      await uploadToGCS('uploads/u1/test.txt', Buffer.from('hello'), 'text/plain');
      expect(mockFile).toHaveBeenCalledWith('uploads/u1/test.txt');
    });

    it('calls save with the buffer, contentType, and resumable: false', async () => {
      const buf = Buffer.from('file-content');
      await uploadToGCS('uploads/u1/doc.pdf', buf, 'application/pdf');

      expect(mockSave).toHaveBeenCalledWith(buf, {
        contentType: 'application/pdf',
        resumable: false,
      });
    });

    it('returns the public URL for the uploaded object', async () => {
      const url = await uploadToGCS('uploads/u1/img.png', Buffer.from('x'), 'image/png');
      expect(url).toBe(
        'https://storage.googleapis.com/test-bucket/uploads/u1/img.png'
      );
    });
  });

  // ── deleteFromGCS ────────────────────────────────────────────────

  describe('deleteFromGCS()', () => {
    it('calls file.delete for the given object path', async () => {
      await deleteFromGCS('uploads/u1/old.txt');

      expect(mockBucket).toHaveBeenCalledWith('test-bucket');
      expect(mockFile).toHaveBeenCalledWith('uploads/u1/old.txt');
      expect(mockDelete).toHaveBeenCalled();
    });

    it('swallows a 404 error (object already gone)', async () => {
      mockDelete.mockRejectedValueOnce({ code: 404 });

      // Should not throw
      await expect(deleteFromGCS('uploads/u1/gone.txt')).resolves.toBeUndefined();
    });

    it('rethrows non-404 errors', async () => {
      const err = { code: 403, message: 'Forbidden' };
      mockDelete.mockRejectedValueOnce(err);

      await expect(deleteFromGCS('uploads/u1/forbidden.txt')).rejects.toEqual(err);
    });
  });
});
