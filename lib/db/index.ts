import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { getAuthEnv } from '@/lib/auth/env';

let pool: Pool | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: getAuthEnv().DATABASE_URL });
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
