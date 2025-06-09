import { Router } from 'express';
import { IntentController } from '../controllers/IntentController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const intentController = new IntentController();

// All intent routes require authentication
router.use(authenticateToken);

// Intent management
router.get('/', intentController.getUserIntents);
router.post('/', intentController.createIntent);
router.get('/nearby', intentController.getNearbyIntents);
router.get('/category/:category', intentController.getIntentsByCategory);
router.get('/:intentId', intentController.getIntentById);
router.put('/:intentId', intentController.updateIntent);
router.delete('/:intentId', intentController.deleteIntent);

// Intent actions
router.post('/:intentId/respond', intentController.respondToIntent);

export { router as intentRoutes };