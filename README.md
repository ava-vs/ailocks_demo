# Ailocks: Ai2Ai Network Demo

Ai2Ai Network was inspired by the concept of secure, user-controlled AI assistants ('Ailocks') and the need for a system that allows specialised AI to easily collaborate to solve complex problems for users. The project aims to provide location-aware and user-aware products and services by facilitating interaction between personalised AI assistants.

We believe that a world where everyone has their own "Jarvis" (Ailock) is more attractive than a world full of Terminators and Agent Smiths.

## Quick Start

1. **Setup PostgreSQL Database:**
   ```bash
   # Install PostgreSQL if not installed
   # Create database
   createdb ailocks_db
   ```

2. **Setup environment variables:**
   ```bash
   # Create .env file in project root
   cp .env.example .env
   # Edit .env file with your actual values:
   # - DATABASE_URL: Your PostgreSQL connection string
   # - JWT_SECRET: Strong random string for JWT signing
   # - JWT_REFRESH_SECRET: Another strong random string
   # - OPENROUTER_API_KEY: Your OpenRouter API key (optional)
   # - OPENAI_API_KEY: Your OpenAI API key (optional)
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Run database migrations:**
   ```bash
   npm run db:migrate
   ```

5. **Start development servers:**
   ```bash
   npm run dev
   ```

6. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001/api
   - API Documentation: http://localhost:3001/api

## Features

- **Three AI Modes**: Researcher, Creator, Analyst
- **Real-time Chat**: WebSocket-based communication with AI
- **Location-aware**: Geolocation integration
- **Context Actions**: Dynamic action suggestions
- **User Authentication**: JWT-based auth system
- **Intent System**: Create and manage user intents
- **Modern UI**: React + TypeScript + Tailwind CSS

## Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# Required
DATABASE_URL=postgresql://username:password@localhost:5432/ailocks_db
JWT_SECRET=your-strong-jwt-secret-key
JWT_REFRESH_SECRET=your-strong-refresh-secret-key

# Optional
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
ENABLE_STREAMING=true
DEFAULT_LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=your-openrouter-api-key
OPENAI_API_KEY=your-openai-api-key
```

## Commands

- `npm run dev` - Start development servers
- `npm run build` - Build both frontend and backend
- `npm run build:frontend` - Build frontend only
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Drizzle Studio

## Database Requirement

**PostgreSQL database is required for the application to run.** The application will not start without a valid database connection. Make sure to:

1. Install and start PostgreSQL
2. Create the database: `createdb ailocks_db`
3. Set correct DATABASE_URL in .env file
4. Run migrations: `npm run db:migrate`
