import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validateAuth } from '../middleware/validation';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();
const authController = new AuthController();

// Apply rate limiting to auth routes
router.use(rateLimiter);

// Authentication routes
router.post('/register', validateAuth, authController.register);
router.post('/login', validateAuth, authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refreshToken);
router.get('/me', authController.getCurrentUser);

export { router as authRoutes };