import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { apiRoutes } from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { AilockService } from './services/AilockService';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const prisma = new PrismaClient();
const ailockService = new AilockService();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// API Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Ailocks API',
    version: '1.0.0'
  });
});

// WebSocket Authentication Middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        status: true
      }
    });

    if (!user) {
      return next(new Error('User not found'));
    }

    // Attach user to socket
    socket.data.user = user;
    socket.data.userId = user.id;
    
    console.log(`User ${user.name} (${user.id}) connected via WebSocket`);
    next();
  } catch (error) {
    console.error('WebSocket authentication error:', error);
    next(new Error('Authentication failed'));
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  const user = socket.data.user;
  console.log('Authenticated user connected:', user.name);

  // Update user status to online
  prisma.user.update({
    where: { id: user.id },
    data: { status: 'online' }
  }).catch(console.error);

  // Handle user messages
  socket.on('user_message', async (message) => {
    try {
      console.log('Received user message:', message);

      // Ensure we have a valid session
      let session = await ailockService.getCurrentSession(user.id);
      if (!session) {
        session = await ailockService.createSession({
          userId: user.id,
          mode: 'researcher',
          location: null,
          contextData: null
        });
      }

      // Process the query with Ailock service
      const response = await ailockService.processQuery(user.id, {
        query: message.content,
        mode: session.mode,
        context: message.metadata
      });

      // Create AI response message
      const aiMessage = {
        id: `ai_${Date.now()}`,
        content: response.response,
        senderId: 'ailock',
        timestamp: new Date(),
        type: 'text',
        metadata: {
          mode: response.mode,
          sessionId: response.sessionId
        }
      };

      // Send response back to the specific user
      socket.emit('ailock_response', aiMessage);
      
      console.log('Sent ailock response to user:', user.name);

    } catch (error) {
      console.error('Error processing user message:', error);
      socket.emit('error', { 
        message: 'Failed to process message',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  socket.on('typing', (data) => {
    // Broadcast typing status to other clients (if needed for multi-user chats)
    socket.broadcast.emit('typing', {
      ...data,
      userId: user.id,
      userName: user.name
    });
  });

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${user.name} joined room ${roomId}`);
  });

  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    console.log(`User ${user.name} left room ${roomId}`);
  });

  socket.on('disconnect', async () => {
    console.log('User disconnected:', user.name);
    
    // Update user status to offline
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { status: 'offline' }
      });
    } catch (error) {
      console.error('Error updating user status on disconnect:', error);
    }
  });
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Ailocks backend server running on port ${PORT}`);
  console.log(`📡 Socket.io server ready for authenticated connections`);
  console.log(`🗄️  Database connected via Prisma`);
  console.log(`🔗 API available at http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});