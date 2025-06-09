import { Router } from 'express';
import { AilockController } from '../controllers/AilockController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const ailockController = new AilockController();

// All ailock routes require authentication
router.use(authenticateToken);

// Ailock session management
router.post('/session', ailockController.createSession);
router.get('/session', ailockController.getCurrentSession);
router.put('/session', ailockController.updateSession);
router.delete('/session', ailockController.endSession);

// Ailock interaction
router.post('/query', ailockController.processQuery);
router.get('/actions', ailockController.getContextActions);
router.post('/action/:actionId', ailockController.executeAction);

export { router as ailockRoutes };