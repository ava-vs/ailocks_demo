import { Request, Response } from 'express';
import { UserService } from '../services/UserService';

export class UserController {
  private userService = new UserService();

  getProfile = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const user = await this.userService.findById(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json({
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
        } : null,
        createdAt: user.createdAt
      });
    } catch (error) {
      console.error('Get profile error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  updateProfile = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { name, avatar } = req.body;

      const user = await this.userService.update(userId, { name, avatar });
      res.json(user);
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  updateLocation = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { latitude, longitude, city, country } = req.body;

      const user = await this.userService.updateLocation(userId, {
        latitude,
        longitude,
        city,
        country
      });

      res.json(user);
    } catch (error) {
      console.error('Update location error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getNearbyUsers = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { radius = 10 } = req.query; // radius in km

      const users = await this.userService.getNearbyUsers(userId, Number(radius));
      res.json(users);
    } catch (error) {
      console.error('Get nearby users error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  updateStatus = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { status } = req.body;

      const user = await this.userService.updateStatus(userId, status);
      res.json(user);
    } catch (error) {
      console.error('Update status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}