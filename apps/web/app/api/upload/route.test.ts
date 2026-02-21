// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock rate limiter
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockReturnValue({ success: true, remaining: 10, limit: 10, reset: Date.now() + 60000 }),
  rateLimitHeaders: vi.fn().mockReturnValue({}),
  rateLimitExceededResponse: vi.fn(),
  RATE_LIMITS: { upload: { maxRequests: 10, windowMs: 60000 } },
}));

// Mock GCS storage module — simulate GCS being configured
vi.mock('@/lib/storage', () => ({
  isGCSConfigured: vi.fn().mockReturnValue(true),
  uploadToGCS: vi.fn().mockImplementation((objectPath: string) =>
    Promise.resolve(`https://storage.googleapis.com/mindweave-uploads/${objectPath}`)
  ),
}));

import { POST } from './route';
import { auth } from '@/lib/auth';

describe('Upload API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('should return 401 if not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as never);

      const formData = new FormData();
      formData.append('file', new Blob(['test'], { type: 'application/pdf' }), 'test.pdf');

      const request = new NextRequest('http://localhost/api/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Unauthorized');
    });

    it('should return 401 if user id is missing', async () => {
      vi.mocked(auth).mockResolvedValue({ user: {} } as never);

      const formData = new FormData();
      formData.append('file', new Blob(['test'], { type: 'application/pdf' }), 'test.pdf');

      const request = new NextRequest('http://localhost/api/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });
  });

  describe('file validation', () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user123' } } as never);
    });

    it('should return 400 if no file provided', async () => {
      const formData = new FormData();

      const request = new NextRequest('http://localhost/api/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('No file provided');
    });

    it('should return 400 for file exceeding size limit', async () => {
      // Create a file larger than 10MB
      const largeContent = new Uint8Array(11 * 1024 * 1024);
      const formData = new FormData();
      formData.append('file', new Blob([largeContent], { type: 'application/pdf' }), 'large.pdf');

      const request = new NextRequest('http://localhost/api/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('File size exceeds 10MB limit');
    });

    it('should return 400 for disallowed file extension', async () => {
      const formData = new FormData();
      formData.append('file', new File(['test'], 'evil.exe', { type: 'application/javascript' }));

      const request = new NextRequest('http://localhost/api/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toContain('not allowed');
    });

    it('should return 400 for disallowed MIME type', async () => {
      const formData = new FormData();
      formData.append('file', new File(['test'], 'test.pdf', { type: 'application/x-executable' }));

      const request = new NextRequest('http://localhost/api/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toContain('not allowed');
    });

    it('should return 400 for mismatched file signature', async () => {
      // A .pdf file with non-PDF content
      const formData = new FormData();
      formData.append(
        'file',
        new File(['not a real pdf'], 'fake.pdf', { type: 'application/pdf' })
      );

      const request = new NextRequest('http://localhost/api/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toContain('does not match');
    });
  });

  describe('successful upload', () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({ user: { id: 'user123' } } as never);
    });

    it('should upload text file successfully via GCS', async () => {
      const formData = new FormData();
      formData.append(
        'file',
        new File(['Hello world text file'], 'notes.txt', { type: 'text/plain' })
      );

      const request = new NextRequest('http://localhost/api/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.fileName).toBe('notes.txt');
      expect(data.data.filePath).toContain('https://storage.googleapis.com/mindweave-uploads/uploads/user123/');
    });

    it('should upload markdown file successfully', async () => {
      const formData = new FormData();
      formData.append(
        'file',
        new File(['# Heading\n\nContent'], 'readme.md', { type: 'text/markdown' })
      );

      const request = new NextRequest('http://localhost/api/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should upload PNG with valid magic bytes', async () => {
      // PNG magic bytes: 89 50 4e 47 0d 0a 1a 0a
      const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
      const formData = new FormData();
      formData.append(
        'file',
        new File([pngHeader], 'image.png', { type: 'image/png' })
      );

      const request = new NextRequest('http://localhost/api/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
