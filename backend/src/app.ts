// @ts-nocheck
import express from 'express';
import cors from 'cors';
import config from './config';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Routes
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/user';
import { chatRoutes } from './routes/chat';
import { intentRoutes } from './routes/intent';
import { ailockRoutes } from './routes/ailock';

const app = express();

// ----------------------------
// Global middleware
// ----------------------------
app.use(cors({
  origin: config.env === 'production' ? false : config.frontendUrl,
  credentials: true
}));
app.use(express.json());

// ----------------------------
// Routes (identical to previous server.ts)
// ----------------------------
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/intents', intentRoutes);
app.use('/api/ailock', ailockRoutes);

// Info & health endpoints
app.get('/api', (req, res) => {
  res.json({
    name: 'Ailocks AI2AI Network API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 and error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app; 