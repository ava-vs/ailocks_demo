import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { db } from './models/database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { socketAuthMiddleware, AuthenticatedSocket } from './middleware/socketAuth';
import { ChatMessageService } from './services/ChatMessageService';
import { ContextualActionGenerator } from './services/ContextualActionGenerator';

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
    origin: process.env.NODE_ENV === 'production' ? false : process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Initialize services
const chatMessageService = new ChatMessageService();
const actionGenerator = new ContextualActionGenerator();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : process.env.FRONTEND_URL || "http://localhost:5173",
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
        'POST /api/ailock/chat': 'Start AI chat session',
        'POST /api/ailock/query': 'Process ailock query',
        'GET /api/ailock/context/:sessionId': 'Get conversation context',
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

// Socket.io authentication middleware
io.use(socketAuthMiddleware);

// Socket.io connection handling
io.on('connection', (socket: AuthenticatedSocket) => {
  console.log('User connected:', socket.id, 'User ID:', socket.userId);
  
  // Join user to their personal room
  if (socket.userId) {
    socket.join(`user:${socket.userId}`);
  }
  
  // Handle joining specific chat sessions
  socket.on('join_session', (sessionId: string) => {
    socket.join(`session:${sessionId}`);
    console.log(`Socket ${socket.id} joined session: ${sessionId}`);
  });
  
  socket.on('leave_session', (sessionId: string) => {
    socket.leave(`session:${sessionId}`);
    console.log(`Socket ${socket.id} left session: ${sessionId}`);
  });

  // Handle user messages
  socket.on('user_message', async (data: {
    content: string;
    sessionId?: string;
    mode?: string;
  }) => {
    try {
      if (!socket.userId) {
        socket.emit('error', { message: 'User not authenticated' });
        return;
      }

      console.log('Received user message:', data);

      // Get or create session
      const mode = (data.mode || 'researcher') as any;
      let sessionId = data.sessionId;
      
      if (!sessionId) {
        const session = await chatMessageService.createOrGetSession(socket.userId, mode);
        sessionId = session.id;
        socket.emit('session_created', { sessionId });
      }

      // Join session room
      socket.join(`session:${sessionId}`);

      // Save user message
      await chatMessageService.saveMessage({
        content: data.content,
        sender: 'user',
        sessionId,
        userId: socket.userId
      });

      // Emit typing indicator
      socket.to(`session:${sessionId}`).emit('typing', { 
        isTyping: true, 
        userId: 'ailock' 
      });

      // Get user context
      const userContext = await chatMessageService.getUserContext(socket.userId);

      // Generate AI response with streaming
      const aiResponse = await chatMessageService.generateAIResponse(
        data.content,
        sessionId,
        socket.userId,
        mode,
        userContext,
        (chunk: string) => {
          // Stream response chunks to client
          socket.emit('ai_response_chunk', {
            sessionId,
            chunk,
            done: false
          });
        }
      );

      // Send final response with actions
      socket.emit('ai_response_complete', {
        sessionId,
        content: aiResponse.content,
        actions: aiResponse.actions,
        usage: aiResponse.usage,
        model: aiResponse.model,
        provider: aiResponse.provider
      });

      // Stop typing indicator
      socket.to(`session:${sessionId}`).emit('typing', { 
        isTyping: false, 
        userId: 'ailock' 
      });

      // Update session activity
      await chatMessageService.updateSessionActivity(sessionId);

    } catch (error) {
      console.error('Error processing user message:', error);
      socket.emit('error', { 
        message: 'Failed to process message',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Handle action execution
  socket.on('execute_action', async (data: {
    actionId: string;
    parameters?: any;
    sessionId?: string;
  }) => {
    try {
      if (!socket.userId) {
        socket.emit('error', { message: 'User not authenticated' });
        return;
      }

      console.log('Executing action:', data);

      // Get user context
      const userContext = await chatMessageService.getUserContext(socket.userId);
      
      // Execute action
      const result = await actionGenerator.executeAction(data.actionId, {
        ...data.parameters,
        userId: socket.userId,
        userContext
      });

      socket.emit('action_result', {
        actionId: data.actionId,
        result,
        sessionId: data.sessionId
      });

      // If action was successful and has follow-up actions, send them
      if (result.success && result.followUpActions) {
        socket.emit('context_actions_updated', {
          actions: result.followUpActions,
          sessionId: data.sessionId
        });
      }

    } catch (error) {
      console.error('Error executing action:', error);
      socket.emit('error', { 
        message: 'Failed to execute action',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Handle typing indicators
  socket.on('typing', (data: { isTyping: boolean; sessionId: string }) => {
    socket.to(`session:${data.sessionId}`).emit('typing', {
      isTyping: data.isTyping,
      userId: socket.userId
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id, 'User ID:', socket.userId);
  });

  // Handle connection errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
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
    
    // Test database connection with timeout
    console.log('🗄️  Testing Drizzle database connection...');
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database connection timeout')), 10000)
    );
    
    try {
      await Promise.race([db.execute('SELECT 1'), timeout]);
      console.log('✅ Database connection successful!');
    } catch (dbError) {
      console.warn('⚠️  Database connection failed, continuing without DB:', dbError);
    }
    
    server.listen(PORT, () => {
      console.log(`🚀 Ailocks backend server running on port ${PORT}`);
      console.log('📡 Socket.io server ready for authenticated connections');
      console.log('🤖 LLM integration enabled');
      console.log('🗄️  Database status: attempting connection');
      console.log(`🔗 API available at http://localhost:${PORT}/api`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    // Don't exit, try to start anyway
    server.listen(PORT, () => {
      console.log(`🚀 Ailocks backend server running on port ${PORT} (degraded mode)`);
    });
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