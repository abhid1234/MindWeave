import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockSession = {
  close: vi.fn().mockResolvedValue(undefined),
  run: vi.fn(),
};

const mockDriver = {
  session: vi.fn().mockReturnValue(mockSession),
  getServerInfo: vi.fn().mockResolvedValue({ address: 'localhost:7687' }),
};

vi.mock('neo4j-driver', () => ({
  default: {
    driver: vi.fn().mockReturnValue(mockDriver),
    auth: {
      basic: vi.fn().mockReturnValue({ scheme: 'basic' }),
    },
  },
}));

describe('Neo4j client', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.clearAllMocks();
  });

  describe('isNeo4jConfigured', () => {
    it('returns false when env vars are missing', async () => {
      delete process.env.NEO4J_URI;
      delete process.env.NEO4J_USER;
      delete process.env.NEO4J_PASSWORD;

      const { isNeo4jConfigured } = await import('@/lib/neo4j/client');
      expect(isNeo4jConfigured()).toBe(false);
    });

    it('returns true when all env vars are set', async () => {
      vi.stubEnv('NEO4J_URI', 'bolt://localhost:7687');
      vi.stubEnv('NEO4J_USER', 'neo4j');
      vi.stubEnv('NEO4J_PASSWORD', 'password');

      const { isNeo4jConfigured } = await import('@/lib/neo4j/client');
      expect(isNeo4jConfigured()).toBe(true);
    });
  });

  describe('getDriver', () => {
    it('returns null when not configured', async () => {
      delete process.env.NEO4J_URI;
      delete process.env.NEO4J_USER;
      delete process.env.NEO4J_PASSWORD;

      const { getDriver } = await import('@/lib/neo4j/client');
      expect(getDriver()).toBeNull();
    });

    it('returns driver when configured', async () => {
      vi.stubEnv('NEO4J_URI', 'bolt://localhost:7687');
      vi.stubEnv('NEO4J_USER', 'neo4j');
      vi.stubEnv('NEO4J_PASSWORD', 'password');

      const { getDriver } = await import('@/lib/neo4j/client');
      const driver = getDriver();
      expect(driver).toBe(mockDriver);
    });
  });

  describe('withNeo4jSession', () => {
    it('returns fallback on error', async () => {
      vi.stubEnv('NEO4J_URI', 'bolt://localhost:7687');
      vi.stubEnv('NEO4J_USER', 'neo4j');
      vi.stubEnv('NEO4J_PASSWORD', 'password');

      const { withNeo4jSession } = await import('@/lib/neo4j/client');
      const fallbackValue = { items: [] };

      const result = await withNeo4jSession(async () => {
        throw new Error('query failed');
      }, fallbackValue);

      expect(result).toBe(fallbackValue);
      expect(mockSession.close).toHaveBeenCalled();
    });
  });

  describe('verifyNeo4jConnection', () => {
    it('returns false when not configured', async () => {
      delete process.env.NEO4J_URI;
      delete process.env.NEO4J_USER;
      delete process.env.NEO4J_PASSWORD;

      const { verifyNeo4jConnection } = await import('@/lib/neo4j/client');
      const result = await verifyNeo4jConnection();
      expect(result).toBe(false);
    });
  });
});
