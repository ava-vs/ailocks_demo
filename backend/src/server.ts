import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { db } from './models/database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Import routes
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/user';
import { chatRoutes } from './routes/chat';
import { intentRoutes } from './routes/intent';
import { ailockRoutes } from './routes/ailock';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : "https://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : "https://localhost:5173",
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/intents', intentRoutes);
app.use('/api/ailock', ailockRoutes);

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Ailocks AI2AI Network API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      authentication: {
        'POST /api/auth/register': 'Register new user',
        'POST /api/auth/login': 'Login user',
        'GET /api/auth/me': 'Get current user',
        'POST /api/auth/refresh': 'Refresh access token',
        'POST /api/auth/logout': 'Logout user'
      },
      users: {
        'GET /api/users/profile': 'Get user profile',
        'PUT /api/users/profile': 'Update user profile',
        'PUT /api/users/location': 'Update user location',
        'PUT /api/users/status': 'Update user status',
        'GET /api/users/nearby': 'Get nearby users'
      },
      chats: {
        'GET /api/chats': 'Get user chats',
        'POST /api/chats': 'Create new chat',
        'GET /api/chats/:id': 'Get chat by ID',
        'PUT /api/chats/:id': 'Update chat',
        'DELETE /api/chats/:id': 'Delete chat',
        'GET /api/chats/:id/messages': 'Get chat messages',
        'POST /api/chats/:id/messages': 'Send message',
        'POST /api/chats/:id/participants': 'Add participant',
        'DELETE /api/chats/:id/participants/:userId': 'Remove participant'
      },
      intents: {
        'GET /api/intents': 'Get user intents',
        'POST /api/intents': 'Create new intent',
        'GET /api/intents/nearby': 'Get nearby intents',
        'GET /api/intents/category/:category': 'Get intents by category',
        'GET /api/intents/:id': 'Get intent by ID',
        'PUT /api/intents/:id': 'Update intent',
        'DELETE /api/intents/:id': 'Delete intent',
        'POST /api/intents/:id/respond': 'Respond to intent'
      },
      ailock: {
        'POST /api/ailock/session': 'Create ailock session',
        'GET /api/ailock/session': 'Get current session',
        'PUT /api/ailock/session': 'Update session',
        'DELETE /api/ailock/session': 'End session',
        'POST /api/ailock/query': 'Process ailock query',
        'GET /api/ailock/actions': 'Get context actions',
        'POST /api/ailock/action/:actionId': 'Execute action'
      }
    },
    documentation: {
      'GET /api/health': 'Health check endpoint',
      'GET /api': 'This API information endpoint'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Ailocks API'
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room: ${roomId}`);
  });
  
  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    console.log(`Socket ${socket.id} left room: ${roomId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

// Start server
async function startServer() {
  try {
    console.log('🔄 Starting Ailocks backend server...');
    
    // Test database connection
    console.log('🗄️  Testing Drizzle database connection...');
    await db.execute('SELECT 1');
    console.log('✅ Database connection successful!');
    
    server.listen(PORT, () => {
      console.log(`🚀 Ailocks backend server running on port ${PORT}`);
      console.log('📡 Socket.io server ready for authenticated connections');
      console.log('🗄️  Database connected via Drizzle ORM');
      console.log(`🔗 API available at http://localhost:${PORT}/api`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('📴 Shutting down server...');
  try {
    server.close(() => {
      console.log('✅ Server shutdown complete');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

startServer();