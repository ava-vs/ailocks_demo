import { Router } from 'express';
import { authRoutes } from './auth';
import { chatRoutes } from './chat';
import { userRoutes } from './user';
import { intentRoutes } from './intent';
import { ailockRoutes } from './ailock';

const router = Router();

// API Routes
router.use('/auth', authRoutes);
router.use('/chats', chatRoutes);
router.use('/users', userRoutes);
router.use('/intents', intentRoutes);
router.use('/ailock', ailockRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Ailocks API'
  });
});

export { router as apiRoutes };