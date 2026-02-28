import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { resetRateLimitStore } from '@/lib/rate-limit';

// Mock auth
const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

// Mock url-content
const mockExtractUrlContent = vi.fn();
vi.mock('@/lib/ai/url-content', () => ({
  extractUrlContent: (...args: unknown[]) => mockExtractUrlContent(...args),
}));

// Mock url-summarizer
const mockSummarizeUrlContent = vi.fn();
vi.mock('@/lib/ai/url-summarizer', () => ({
  summarizeUrlContent: (...args: unknown[]) => mockSummarizeUrlContent(...args),
}));

import { POST } from './route';

function createRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/summarize-url', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  mockAuth.mockReset();
  mockExtractUrlContent.mockReset();
  mockSummarizeUrlContent.mockReset();
  resetRateLimitStore();
});

describe('POST /api/summarize-url', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const response = await POST(createRequest({ url: 'https://example.com' }));
    expect(response.status).toBe(401);
  });

  it('returns 400 for missing URL', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    const response = await POST(createRequest({}));
    expect(response.status).toBe(400);
  });

  it('returns 400 for invalid URL', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    const response = await POST(createRequest({ url: 'not-a-url' }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toContain('Invalid URL');
  });

  it('blocks SSRF attempts to private IPs', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });

    for (const url of [
      'http://localhost:3000',
      'http://127.0.0.1',
      'http://192.168.1.1',
      'http://10.0.0.1',
    ]) {
      const response = await POST(createRequest({ url }));
      const data = await response.json();
      expect(data.message).toContain('private or internal');
    }
  });

  it('summarizes URL successfully', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockExtractUrlContent.mockResolvedValue({
      sourceType: 'article',
      url: 'https://example.com/post',
      title: 'Test Article',
      text: 'Content here',
      domain: 'example.com',
    });
    mockSummarizeUrlContent.mockResolvedValue({
      summary: 'Article about testing.',
      keyTakeaways: ['Tests matter'],
      formattedBody: '## Summary\n\nArticle about testing.',
    });

    const response = await POST(createRequest({ url: 'https://example.com/post' }));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.formattedBody).toContain('Summary');
    expect(data.data.metadata.sourceType).toBe('article');
  });

  it('returns 500 on extraction errors', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockExtractUrlContent.mockRejectedValue(new Error('Network timeout'));

    const response = await POST(createRequest({ url: 'https://example.com' }));
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.message).toContain('Network timeout');
  });
});
