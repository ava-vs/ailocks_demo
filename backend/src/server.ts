import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { apiRoutes } from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const prisma = new PrismaClient();

// Middleware
app.use(cors());
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

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('message', async (message) => {
    try {
      // Broadcast message to all connected clients
      io.emit('message', {
        ...message,
        timestamp: new Date()
      });

      // Store message in database if it has a chatId
      if (message.chatId) {
        await prisma.message.create({
          data: {
            content: message.content,
            type: message.type || 'text',
            senderId: message.senderId,
            chatId: message.chatId,
            metadata: message.metadata ? JSON.stringify(message.metadata) : null
          }
        });

        // Update chat's last activity
        await prisma.chat.update({
          where: { id: message.chatId },
          data: { lastActivity: new Date() }
        });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      socket.emit('error', { message: 'Failed to process message' });
    }
  });

  socket.on('typing', (data) => {
    // Broadcast typing status to other clients
    socket.broadcast.emit('typing', data);
  });

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    console.log(`User ${socket.id} left room ${roomId}`);
  });

  socket.on('user-status', async (data) => {
    try {
      if (data.userId && data.status) {
        await prisma.user.update({
          where: { id: data.userId },
          data: { status: data.status }
        });

        // Broadcast status update to all clients
        io.emit('user-status-update', {
          userId: data.userId,
          status: data.status,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Ailocks backend server running on port ${PORT}`);
  console.log(`📡 Socket.io server ready for connections`);
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