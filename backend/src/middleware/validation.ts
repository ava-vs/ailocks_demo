import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

export const validateAuth = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').optional().isLength({ min: 2, max: 50 }).trim(),
  handleValidationErrors
];

export const validateUser = [
  body('name').optional().isLength({ min: 2, max: 50 }).trim(),
  body('avatar').optional().isURL(),
  handleValidationErrors
];

export const validateChat = [
  body('name').optional().isLength({ min: 1, max: 100 }).trim(),
  body('mode').isIn(['researcher', 'creator', 'analyst']),
  handleValidationErrors
];

export const validateIntent = [
  body('title').isLength({ min: 1, max: 200 }).trim(),
  body('description').isLength({ min: 1, max: 1000 }).trim(),
  body('type').isIn(['offer', 'request']),
  body('category').isLength({ min: 1, max: 50 }).trim(),
  body('location').optional().isString(),
  body('expiresAt').optional().isISO8601(),
  handleValidationErrors
];

export const validateMessage = [
  body('content').isLength({ min: 1, max: 5000 }).trim(),
  body('type').optional().isIn(['text', 'image', 'file', 'system']),
  body('metadata').optional().isObject(),
  handleValidationErrors
];