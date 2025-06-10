import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../db/schema';

// Default connection for development
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/ailocks_db';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('localhost') ? false : {
    rejectUnauthorized: false
  }
});

export const db = drizzle(pool, { schema, logger: false }); 