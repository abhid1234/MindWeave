import neo4j, { type Driver, type Session } from 'neo4j-driver';

let driver: Driver | null = null;

/**
 * Check if Neo4j environment variables are configured
 */
export function isNeo4jConfigured(): boolean {
  return !!(
    process.env.NEO4J_URI &&
    process.env.NEO4J_USER &&
    process.env.NEO4J_PASSWORD
  );
}

/**
 * Get or create the Neo4j driver singleton
 */
export function getDriver(): Driver | null {
  if (!isNeo4jConfigured()) {
    return null;
  }

  if (!driver) {
    driver = neo4j.driver(
      process.env.NEO4J_URI!,
      neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!),
      {
        maxConnectionPoolSize: 10,
        connectionAcquisitionTimeout: 5000,
        maxTransactionRetryTime: 5000,
      }
    );
  }

  return driver;
}

/**
 * Get a Neo4j session, or null if not configured
 */
export function getNeo4jSession(): Session | null {
  const d = getDriver();
  if (!d) return null;
  return d.session();
}

/**
 * Execute a function with a Neo4j session, auto-closing afterward.
 * Returns the fallback value if Neo4j is not configured or on error.
 */
export async function withNeo4jSession<T>(
  fn: (session: Session) => Promise<T>,
  fallback?: T
): Promise<T | undefined> {
  const session = getNeo4jSession();
  if (!session) {
    return fallback;
  }

  try {
    return await fn(session);
  } catch (error) {
    console.error('Neo4j session error:', error);
    return fallback;
  } finally {
    await session.close();
  }
}

/**
 * Verify Neo4j connectivity
 */
export async function verifyNeo4jConnection(): Promise<boolean> {
  const d = getDriver();
  if (!d) return false;

  try {
    const info = await d.getServerInfo();
    console.log('Neo4j connected:', info.address);
    return true;
  } catch (error) {
    console.error('Neo4j connection failed:', error);
    return false;
  }
}
