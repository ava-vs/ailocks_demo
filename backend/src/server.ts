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
    origin: process.env.NODE_ENV === 'production' ? false : "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/intents', intentRoutes);
app.use('/api/ailock', ailockRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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