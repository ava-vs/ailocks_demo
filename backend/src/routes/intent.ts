import { Router } from 'express';
import { IntentController } from '../controllers/IntentController';
import { authenticateToken } from '../middleware/auth';
import { validateIntent } from '../middleware/validation';

const router = Router();
const intentController = new IntentController();

// All intent routes require authentication
router.use(authenticateToken);

// Intent management routes
router.get('/', intentController.getUserIntents);
router.post('/', validateIntent, intentController.createIntent);
router.get('/nearby', intentController.getNearbyIntents);
router.get('/:intentId', intentController.getIntentById);
router.put('/:intentId', validateIntent, intentController.updateIntent);
router.delete('/:intentId', intentController.deleteIntent);

// Intent interaction routes
router.post('/:intentId/respond', intentController.respondToIntent);
router.get('/category/:category', intentController.getIntentsByCategory);

export { router as intentRoutes };