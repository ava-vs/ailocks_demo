import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const userController = new UserController();

// All user routes require authentication
router.use(authenticateToken);

// User profile management
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/location', userController.updateLocation);
router.put('/status', userController.updateStatus);

// User discovery
router.get('/nearby', userController.getNearbyUsers);

export { router as userRoutes };