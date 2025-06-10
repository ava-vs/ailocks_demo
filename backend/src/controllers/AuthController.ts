import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { validationResult } from 'express-validator';

export class AuthController {
  private authService = new AuthService();

  register = async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password } = req.body;

      const existingUser = await this.authService.findUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      const user = await this.authService.createUser({
        name,
        email,
        password
      });

      const tokens = await this.authService.generateTokens(user.id);

      return res.status(201).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        },
        ...tokens
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      const user = await this.authService.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await this.authService.validatePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Update user status to online
      await this.authService.updateUserStatus(user.id, 'online');

      const tokens = await this.authService.generateTokens(user.id);

      return res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          status: 'online'
        },
        ...tokens
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  logout = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;

      if (userId) {
        // Update user status to offline
        await this.authService.updateUserStatus(userId, 'offline');
      }

      return res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  getCurrentUser = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const user = await this.authService.findUserById(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          status: user.status,
          latitude: user.latitude,
          longitude: user.longitude,
          city: user.city,
          country: user.country
        }
      });
    } catch (error) {
      console.error('Get current user error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  refreshToken = async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token required' });
      }

      const tokens = await this.authService.refreshTokens(refreshToken);

      return res.json(tokens);
    } catch (error) {
      console.error('Refresh token error:', error);
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
  };
}