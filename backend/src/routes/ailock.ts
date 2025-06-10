import { Router } from 'express';
import { AilockController } from '../controllers/AilockController';
import { authenticateToken } from '../middleware/auth';
import { messageLimiter } from '../middleware/rateLimiter';

const router = Router();
const ailockController = new AilockController();

// All ailock routes require authentication
router.use(authenticateToken);

// Ailock session management
router.post('/session', ailockController.createSession);
router.get('/session', ailockController.getCurrentSession);
router.put('/session', ailockController.updateSession);
router.delete('/session', ailockController.endSession);

// Chat functionality
router.post('/chat', ailockController.startChat);
router.post('/query', messageLimiter, ailockController.processQuery);
router.get('/context/:sessionId', ailockController.getConversationContext);

// Context actions
router.get('/actions', ailockController.getContextActions);
router.post('/action/:actionId', ailockController.executeAction);

export { router as ailockRoutes };