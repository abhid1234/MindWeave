import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const { mockIsConfigured, mockFullSync, mockAuth } = vi.hoisted(() => ({
  mockIsConfigured: vi.fn().mockReturnValue(false),
  mockFullSync: vi.fn().mockResolvedValue({ nodesCreated: 0, edgesCreated: 0 }),
  mockAuth: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/neo4j/client', () => ({
  isNeo4jConfigured: mockIsConfigured,
}));

vi.mock('@/lib/neo4j/sync', () => ({
  fullSyncUserGraph: mockFullSync,
}));

vi.mock('@/lib/auth', () => ({
  auth: mockAuth,
}));

import { POST } from '@/app/api/neo4j/sync/route';

describe('POST /api/neo4j/sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsConfigured.mockReturnValue(false);
    mockFullSync.mockResolvedValue({ nodesCreated: 0, edgesCreated: 0 });
    mockAuth.mockResolvedValue(null);
    delete process.env.CRON_SECRET;
  });

  it('returns 503 when Neo4j is not configured', async () => {
    mockIsConfigured.mockReturnValue(false);

    const req = new NextRequest('http://localhost/api/neo4j/sync', { method: 'POST' });
    const res = await POST(req);

    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe('Neo4j not configured');
  });

  it('returns 401 when not authenticated (no session, no cron secret)', async () => {
    mockIsConfigured.mockReturnValue(true);
    mockAuth.mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/neo4j/sync', { method: 'POST' });
    const res = await POST(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns sync result when authenticated via session', async () => {
    mockIsConfigured.mockReturnValue(true);
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockFullSync.mockResolvedValue({ nodesCreated: 5, edgesCreated: 10 });

    const req = new NextRequest('http://localhost/api/neo4j/sync', { method: 'POST' });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true, nodesCreated: 5, edgesCreated: 10 });
    expect(mockFullSync).toHaveBeenCalledWith('user-1');
  });

  it('returns sync result when authenticated via CRON_SECRET', async () => {
    mockIsConfigured.mockReturnValue(true);
    process.env.CRON_SECRET = 'test-secret';
    mockFullSync.mockResolvedValue({ nodesCreated: 3, edgesCreated: 7 });

    const req = new NextRequest('http://localhost/api/neo4j/sync', {
      method: 'POST',
      headers: { Authorization: 'Bearer test-secret', 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'user-1' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true, nodesCreated: 3, edgesCreated: 7 });
    expect(mockFullSync).toHaveBeenCalledWith('user-1');
    expect(mockAuth).not.toHaveBeenCalled();
  });

  it('returns 500 when sync throws an error', async () => {
    mockIsConfigured.mockReturnValue(true);
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockFullSync.mockRejectedValue(new Error('Connection failed'));

    const req = new NextRequest('http://localhost/api/neo4j/sync', { method: 'POST' });
    const res = await POST(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Sync failed');
  });
});
