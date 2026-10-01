import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { getAuthEnv } from '@/lib/auth/env';

let pool: Pool | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

function getPool(): Pool {
  if (!pool) {
    const databaseUrl = getAuthEnv().DATABASE_URL;
    const isCloudOrProd =
      databaseUrl.includes('sslmode=') ||
      (process.env.NODE_ENV === 'production' &&
        !databaseUrl.includes('localhost') &&
        !databaseUrl.includes('127.0.0.1'));

    pool = new Pool({
      connectionString: databaseUrl,
      ssl: isCloudOrProd ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

export function getDb() {
  if (!dbInstance) {
    dbInstance = drizzle(getPool());
  }
  return dbInstance;
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    dbInstance = null;
  }
}
