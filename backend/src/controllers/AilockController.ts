import { Request, Response } from 'express';
import { AilockService } from '../services/AilockService';

export class AilockController {
  private ailockService = new AilockService();

  createSession = async (req: Request, res: Response) => {
    try {
      const { mode, location, contextData } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const session = await this.ailockService.createSession({
        userId,
        mode,
        location: location ? JSON.stringify(location) : undefined,
        contextData: contextData ? JSON.stringify(contextData) : undefined
      });

      return res.status(201).json({ session });
    } catch (error) {
      console.error('Error creating session:', error);
      return res.status(500).json({ error: 'Failed to create session' });
    }
  };

  getCurrentSession = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const session = await this.ailockService.getCurrentSession(userId);

      if (!session) {
        return res.status(404).json({ error: 'No active session found' });
      }

      return res.status(200).json({ session });
    } catch (error) {
      console.error('Error getting current session:', error);
      return res.status(500).json({ error: 'Failed to get current session' });
    }
  };

  updateSession = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const updates = req.body;

      const session = await this.ailockService.updateSession(userId, updates);
      res.json(session);
    } catch (error) {
      console.error('Update session error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  endSession = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      await this.ailockService.endSession(userId);

      return res.status(200).json({ message: 'Session ended successfully' });
    } catch (error) {
      console.error('Error ending session:', error);
      return res.status(500).json({ error: 'Failed to end session' });
    }
  };

  processQuery = async (req: Request, res: Response) => {
    try {
      const { query, mode, context } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      const result = await this.ailockService.processQuery(userId, {
        query,
        mode,
        context
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error processing query:', error);
      return res.status(500).json({ error: 'Failed to process query' });
    }
  };

  getContextActions = async (req: Request, res: Response) => {
    try {
      const { mode, location } = req.query;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const result = await this.ailockService.getContextActions(userId, {
        mode: mode as string,
        location: location as string
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error getting context actions:', error);
      return res.status(500).json({ error: 'Failed to get context actions' });
    }
  };

  executeAction = async (req: Request, res: Response) => {
    try {
      const { actionId, parameters } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (!actionId) {
        return res.status(400).json({ error: 'Action ID is required' });
      }

      const result = await this.ailockService.executeAction(userId, actionId, parameters);

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error executing action:', error);
      return res.status(500).json({ error: 'Failed to execute action' });
    }
  };
}