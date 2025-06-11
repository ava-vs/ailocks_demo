import type { Config } from 'drizzle-kit';
import config from './src/config';

const DATABASE_URL = config.database.url;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.error('💡 Create a .env file in the project root with:');
  console.error('   DATABASE_URL=postgresql://username:password@localhost:5432/ailocks_db');
  console.error('📖 See README.md for full setup instructions');
  process.exit(1);
}

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config; 