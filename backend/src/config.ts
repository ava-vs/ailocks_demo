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
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  
  database: {
    url: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  supabase: {
    url: process.env.VITE_SUPABASE_URL,
    anonKey: process.env.VITE_SUPABASE_ANON_KEY,
  },

  openAI: {
    apiKey: process.env.OPENAI_API_KEY,
  },

  openRouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
  },

  llm: {
    defaultProvider: process.env.DEFAULT_LLM_PROVIDER || 'openrouter',
    enableStreaming: process.env.ENABLE_STREAMING === 'true',
    maxTokens: process.env.MAX_TOKENS || '1000',
    temperature: process.env.LLM_TEMPERATURE || '0.7',
    models: {
      researcher: process.env.LLM_MODEL_RESEARCHER || 'deepseek/deepseek-r1-0528:free',
      creator: process.env.LLM_MODEL_CREATOR || 'deepseek/deepseek-r1-0528-qwen3-8b:free',
      analyst: process.env.LLM_MODEL_ANALYST || 'deepseek/deepseek-r1-0528:free',
    }
  }
};

export function validateEnvironment() {
  console.log('🔍 Validating environment configuration...');
  
  if (!config.database.url) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.error('💡 For Supabase integration, set DATABASE_URL to your Supabase connection string:');
    console.error('   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres');
    console.error('📖 You can find this in your Supabase project settings under Database > Connection string');
    process.exit(1);
  }

  // Check if DATABASE_URL is still the placeholder
  if (config.database.url.includes('username:password@hostname:port')) {
    console.error('❌ DATABASE_URL is still set to placeholder values');
    console.error('💡 Please update DATABASE_URL with your actual Supabase connection string:');
    console.error('   1. Go to your Supabase project dashboard');
    console.error('   2. Navigate to Settings > Database');
    console.error('   3. Copy the connection string and replace [YOUR-PASSWORD] with your actual password');
    console.error('   4. Update the DATABASE_URL in your .env file');
    process.exit(1);
  }

  // Validate PORT is a valid number
  const portNum = Number(config.port);
  if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
    console.error('❌ PORT must be a valid number between 1 and 65535');
    console.error(`   Current value: ${process.env.PORT}`);
    process.exit(1);
  }

  // Validate LLM configuration
  const maxTokens = Number(config.llm.maxTokens);
  if (isNaN(maxTokens) || maxTokens < 1) {
    console.error('❌ MAX_TOKENS must be a valid positive number');
    console.error(`   Current value: ${process.env.MAX_TOKENS}`);
    process.exit(1);
  }

  const temperature = Number(config.llm.temperature);
  if (isNaN(temperature) || temperature < 0 || temperature > 2) {
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
  console.log(`   - Database: ${config.database.url ? 'Configured (Supabase)' : 'Not configured'}`);
  console.log(`   - Supabase URL: ${config.supabase.url ? 'Configured' : 'Not configured'}`);
  console.log(`   - LLM Provider: ${config.llm.defaultProvider}`);
  console.log(`   - Streaming: ${config.llm.enableStreaming ? 'Enabled' : 'Disabled'}`);
}

export default config;