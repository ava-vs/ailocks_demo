import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticateToken } from '../middleware/auth';
import { validateUser } from '../middleware/validation';

const router = Router();
const userController = new UserController();

// All user routes require authentication
router.use(authenticateToken);

// User management routes
router.get('/profile', userController.getProfile);
router.put('/profile', validateUser, userController.updateProfile);
router.post('/location', userController.updateLocation);
router.get('/nearby', userController.getNearbyUsers);
router.put('/status', userController.updateStatus);

export { router as userRoutes };