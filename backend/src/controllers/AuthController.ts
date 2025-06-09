import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { UserService } from '../services/UserService';

export class AuthController {
  private authService = new AuthService();
  private userService = new UserService();

  register = async (req: Request, res: Response) => {
    try {
      const { name, email, password } = req.body;
      
      // Check if user already exists
      const existingUser = await this.userService.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Create new user
      const user = await this.userService.create({ name, email, password });
      const tokens = await this.authService.generateTokens(user.id);

      res.status(201).json({
        user: { id: user.id, name: user.name, email: user.email },
        ...tokens
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const user = await this.authService.validateUser(email, password);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const tokens = await this.authService.generateTokens(user.id);

      res.json({
        user: { id: user.id, name: user.name, email: user.email },
        ...tokens
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  logout = async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;
      await this.authService.revokeToken(refreshToken);
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  refreshToken = async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;
      const tokens = await this.authService.refreshTokens(refreshToken);
      res.json(tokens);
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  };

  getCurrentUser = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const user = await this.userService.findById(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        status: user.status,
        location: user.latitude && user.longitude ? {
          latitude: user.latitude,
          longitude: user.longitude,
          city: user.city,
          country: user.country
        } : null
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}