import dotenv from 'dotenv';
import path from 'path';

// Load .env file from the project root (located one level up from the backend directory)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3001,
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-strong-secret-key-for-dev',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-strong-refresh-secret-for-dev',
  },
  
  database: {
    url: process.env.DATABASE_URL,
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  openAI: {
    apiKey: process.env.OPENAI_API_KEY,
  },

  openRouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
  },
};

export function validateEnvironment() {
  if (!config.database.url) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.error('💡 Create a .env file in the project root with:');
    console.error('   DATABASE_URL=postgresql://username:password@localhost:5432/ailocks_db');
    console.error('📖 See README.md for full setup instructions');
    process.exit(1);
  }

  if (process.env.NODE_ENV === 'production') {
      if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
          console.error('❌ JWT_SECRET and JWT_REFRESH_SECRET must be set in production!');
          process.exit(1);
      }
  } else {
      if (!process.env.JWT_SECRET) {
          console.warn('⚠️ JWT_SECRET is not set in .env, using default insecure key for development.');
      }
      if (!process.env.JWT_REFRESH_SECRET) {
          console.warn('⚠️ JWT_REFRESH_SECRET is not set in .env, using default insecure key for development.');
      }
  }
}

export default config; 