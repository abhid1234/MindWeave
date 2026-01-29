import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const connectionString = process.env.DATABASE_URL;

// Cloud SQL on Cloud Run uses Unix sockets at /cloudsql/INSTANCE_CONNECTION_NAME
// The postgres.js driver needs the socket path passed via the `host` option
const cloudSqlSocket = process.env.CLOUD_SQL_CONNECTION_NAME
  ? `/cloudsql/${process.env.CLOUD_SQL_CONNECTION_NAME}`
  : undefined;

const connectionConfig = cloudSqlSocket
  ? { host: cloudSqlSocket }
  : undefined;

// For migrations
export const migrationClient = postgres(connectionString, { max: 1, ...connectionConfig });

// For queries
const queryClient = postgres(connectionString, connectionConfig);
export const db = drizzle(queryClient, { schema });

// Export schema for easy access
export { schema };
