import { Request, Response } from 'express';
import { IntentService } from '../services/IntentService';

export class IntentController {
  private intentService = new IntentService();

  getUserIntents = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { status, type, category } = req.query;

      const intents = await this.intentService.getUserIntents(userId, {
        status: status as string,
        type: type as string,
        category: category as string
      });

      res.json(intents);
    } catch (error) {
      console.error('Get user intents error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  createIntent = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { title, description, type, category, location, expiresAt } = req.body;

      const intent = await this.intentService.create({
        title,
        description,
        type,
        category,
        location,
        userId,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined
      });

      return res.status(201).json(intent);
    } catch (error) {
      console.error('Create intent error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  getNearbyIntents = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { radius = 10, type, category } = req.query;

      const intents = await this.intentService.getNearbyIntents(userId, {
        radius: Number(radius),
        type: type as string,
        category: category as string
      });

      res.json(intents);
    } catch (error) {
      console.error('Get nearby intents error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getIntentById = async (req: Request, res: Response) => {
    try {
      const { intentId } = req.params;
      const intent = await this.intentService.findById(intentId);

      if (!intent) {
        return res.status(404).json({ error: 'Intent not found' });
      }

      return res.json(intent);
    } catch (error) {
      console.error('Get intent error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  updateIntent = async (req: Request, res: Response) => {
    try {
      const { intentId } = req.params;
      const userId = (req as any).userId;
      const updates = req.body;

      const intent = await this.intentService.update(intentId, userId, updates);
      res.json(intent);
    } catch (error) {
      console.error('Update intent error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  deleteIntent = async (req: Request, res: Response) => {
    try {
      const { intentId } = req.params;
      const userId = (req as any).userId;

      await this.intentService.delete(intentId, userId);
      res.json({ message: 'Intent deleted successfully' });
    } catch (error) {
      console.error('Delete intent error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  respondToIntent = async (req: Request, res: Response) => {
    try {
      const { intentId } = req.params;
      const userId = (req as any).userId;
      const { message } = req.body;

      const response = await this.intentService.respondToIntent(intentId, userId, message);
      res.status(201).json(response);
    } catch (error) {
      console.error('Respond to intent error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getIntentsByCategory = async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const intents = await this.intentService.getByCategory(
        category,
        Number(page),
        Number(limit)
      );

      res.json(intents);
    } catch (error) {
      console.error('Get intents by category error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}