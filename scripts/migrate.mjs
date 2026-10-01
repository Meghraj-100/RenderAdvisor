import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.join(__dirname, '..', 'drizzle', '0000_init.sql');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://renderadvisor:renderadvisor@localhost:5433/renderadvisor';

const sql = fs.readFileSync(sqlPath, 'utf8');
const client = new pg.Client({ connectionString });

await client.connect();
await client.query(sql);
await client.end();
console.log('Database migration completed.');
