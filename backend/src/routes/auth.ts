import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validateAuth } from '../middleware/validation';
import { rateLimiter } from '../middleware/rateLimiter';
import { authenticateToken } from '../middleware/auth';
import { body } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation';

const router = Router();
const authController = new AuthController();

// Apply rate limiting to auth routes
router.use(rateLimiter);

// Authentication routes
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('name').notEmpty().withMessage('Name is required'),
    handleValidationErrors,
  ],
  authController.register
);
router.post('/login', validateAuth, authController.login);
router.post('/logout', authenticateToken, authController.logout);
router.post('/refresh', authController.refreshToken);
router.get('/me', authenticateToken, authController.getCurrentUser);

export { router as authRoutes };