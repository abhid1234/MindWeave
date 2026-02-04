import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { logger } from '@/lib/logger';
import { performanceStats } from '@/lib/performance';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const connectionString = process.env.DATABASE_URL;

// Cloud SQL on Cloud Run uses Unix sockets at /cloudsql/INSTANCE_CONNECTION_NAME
// The postgres.js driver needs the socket path passed via the `host` option
const cloudSqlSocket = process.env.CLOUD_SQL_CONNECTION_NAME
  ? `/cloudsql/${process.env.CLOUD_SQL_CONNECTION_NAME}`
  : undefined;

// Track query start times for performance measurement
const queryTimers = new Map<number, number>();
let queryCounter = 0;

const connectionConfig = {
  ...(cloudSqlSocket ? { host: cloudSqlSocket } : {}),
  // Enable query logging with timing
  debug: process.env.ENABLE_DB_LOGGING === 'true'
    ? (connection: number, query: string) => {
        const queryId = ++queryCounter;
        queryTimers.set(queryId, performance.now());

        // Extract the operation type (SELECT, INSERT, UPDATE, DELETE)
        const operation = query.trim().split(/\s+/)[0]?.toUpperCase() || 'UNKNOWN';

        // Log query start (only in dev for verbose output)
        if (process.env.NODE_ENV !== 'production') {
          logger.debug(`DB Query [${queryId}]: ${operation}`, {
            type: 'db_query',
            queryId,
            operation,
            query: query.substring(0, 200), // Truncate long queries
          });
        }
      }
    : undefined,
  onnotice: () => {}, // Suppress postgres notices
};

// For migrations
export const migrationClient = postgres(connectionString, { max: 1, ...connectionConfig });

// For queries
const queryClient = postgres(connectionString, connectionConfig);
export const db = drizzle(queryClient, { schema });

/**
 * Utility to measure a database operation
 * Use this for explicit timing of critical queries
 */
export async function measureDbQuery<T>(
  operationName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  let success = true;

  try {
    return await queryFn();
  } catch (error) {
    success = false;
    throw error;
  } finally {
    const durationMs = Math.round(performance.now() - start);
    performanceStats.record(`db.${operationName}`, durationMs);

    if (durationMs > 100) {
      logger.warn(`Slow DB query: ${operationName}`, {
        type: 'db_slow_query',
        operation: operationName,
        durationMs,
        success,
      });
    }
  }
}

// Export schema for easy access
export { schema };
