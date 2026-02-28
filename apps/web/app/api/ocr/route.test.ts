import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { resetRateLimitStore } from '@/lib/rate-limit';

// Mock auth
const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

// Mock OCR
const mockExtractText = vi.fn();
vi.mock('@/lib/ai/ocr', () => ({
  extractTextFromImage: (...args: unknown[]) => mockExtractText(...args),
}));

import { POST } from './route';

function createRequest(file?: File): NextRequest {
  const formData = new FormData();
  if (file) {
    formData.append('image', file);
  }
  return new NextRequest('http://localhost:3000/api/ocr', {
    method: 'POST',
    body: formData,
  });
}

beforeEach(() => {
  mockAuth.mockReset();
  mockExtractText.mockReset();
  resetRateLimitStore();
});

describe('POST /api/ocr', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const file = new File(['fake'], 'test.png', { type: 'image/png' });
    const response = await POST(createRequest(file));
    expect(response.status).toBe(401);
  });

  it('returns 400 when no image provided', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    const response = await POST(createRequest());
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toContain('No image');
  });

  it('returns 400 for non-image files', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    const file = new File(['fake'], 'test.pdf', { type: 'application/pdf' });
    const response = await POST(createRequest(file));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toContain('not supported');
  });

  it('extracts text successfully', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockExtractText.mockResolvedValue({ text: 'Extracted text from image' });
    const file = new File(['fake-image-data'], 'screenshot.png', { type: 'image/png' });
    const response = await POST(createRequest(file));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.text).toBe('Extracted text from image');
  });

  it('handles no text found gracefully', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockExtractText.mockResolvedValue({ text: '' });
    const file = new File(['fake-image-data'], 'blank.png', { type: 'image/png' });
    const response = await POST(createRequest(file));
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.text).toBe('');
    expect(data.message).toContain('No text was found');
  });
});
