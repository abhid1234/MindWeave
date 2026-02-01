import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockExecute } = vi.hoisted(() => ({
  mockExecute: vi.fn(),
}));

vi.mock('@/lib/db/client', () => ({
  db: {
    execute: (...args: unknown[]) => mockExecute(...args),
  },
}));

vi.mock('drizzle-orm', () => ({
  sql: (strings: TemplateStringsArray) => strings.join(''),
}));

import { GET } from './route';

beforeEach(() => {
  vi.clearAllMocks();
  mockExecute.mockResolvedValue([{ '?column?': 1 }]);
});

describe('GET /api/health', () => {
  it('returns healthy status when DB is reachable', async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('healthy');
    expect(body.db.status).toBe('healthy');
    expect(typeof body.db.latencyMs).toBe('number');
    expect(body.service).toBe('mindweave');
  });

  it('returns degraded status when DB is unreachable', async () => {
    mockExecute.mockRejectedValue(new Error('Connection refused'));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe('degraded');
    expect(body.db.status).toBe('unhealthy');
    expect(body.db.latencyMs).toBeNull();
  });

  it('includes version and uptime', async () => {
    const response = await GET();
    const body = await response.json();

    expect(body.version).toBeDefined();
    expect(typeof body.uptime).toBe('number');
    expect(body.uptime).toBeGreaterThanOrEqual(0);
  });

  it('includes ISO timestamp', async () => {
    const response = await GET();
    const body = await response.json();

    expect(body.timestamp).toBeDefined();
    // Verify it's a valid ISO date
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
  });
});
