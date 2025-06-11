import dotenv from 'dotenv';
import path from 'path';

// Load .env file from the project root (located one level up from the backend directory)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-strong-secret-key-for-dev',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-strong-refresh-secret-for-dev',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
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

  llm: {
    defaultProvider: process.env.DEFAULT_LLM_PROVIDER || 'openrouter',
    enableStreaming: process.env.ENABLE_STREAMING === 'true',
    maxTokens: parseInt(process.env.MAX_TOKENS || '1000', 10),
    temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
    models: {
      researcher: process.env.LLM_MODEL_RESEARCHER || 'anthropic/claude-3-haiku',
      creator: process.env.LLM_MODEL_CREATOR || 'anthropic/claude-3-haiku',
      analyst: process.env.LLM_MODEL_ANALYST || 'anthropic/claude-3-haiku',
    }
  }
};

export function validateEnvironment() {
  console.log('🔍 Validating environment configuration...');
  
  if (!config.database.url) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.error('💡 Create a .env file in the project root with:');
    console.error('   DATABASE_URL=postgresql://username:password@localhost:5432/ailocks_db');
    console.error('📖 See README.md for full setup instructions');
    process.exit(1);
  }

  // Validate PORT is a valid number
  if (isNaN(config.port) || config.port < 1 || config.port > 65535) {
    console.error('❌ PORT must be a valid number between 1 and 65535');
    console.error(`   Current value: ${process.env.PORT}`);
    process.exit(1);
  }

  // Validate LLM configuration
  if (isNaN(config.llm.maxTokens) || config.llm.maxTokens < 1) {
    console.error('❌ MAX_TOKENS must be a valid positive number');
    console.error(`   Current value: ${process.env.MAX_TOKENS}`);
    process.exit(1);
  }

  if (isNaN(config.llm.temperature) || config.llm.temperature < 0 || config.llm.temperature > 2) {
    console.error('❌ LLM_TEMPERATURE must be a number between 0 and 2');
    console.error(`   Current value: ${process.env.LLM_TEMPERATURE}`);
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

  console.log('✅ Environment configuration validated successfully');
  console.log(`📊 Configuration summary:`);
  console.log(`   - Environment: ${config.env}`);
  console.log(`   - Port: ${config.port}`);
  console.log(`   - Database: ${config.database.url ? 'Configured' : 'Not configured'}`);
  console.log(`   - LLM Provider: ${config.llm.defaultProvider}`);
  console.log(`   - Streaming: ${config.llm.enableStreaming ? 'Enabled' : 'Disabled'}`);
}

export default config;