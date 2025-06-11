import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../db/schema';
import config from '../config';

const DATABASE_URL = config.database.url;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.error('💡 Create a .env file in the project root with:');
  console.error('   DATABASE_URL=postgresql://username:password@localhost:5432/ailocks_db');
  console.error('📖 See README.md for full setup instructions');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('localhost') ? false : {
    rejectUnauthorized: false
  }
});

export const db = drizzle(pool, { schema, logger: false }); 