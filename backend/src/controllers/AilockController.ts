import { Request, Response } from 'express';
import { AilockService } from '../services/AilockService';

export class AilockController {
  private ailockService = new AilockService();

  createSession = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { mode, location, contextData } = req.body;

      const session = await this.ailockService.createSession({
        userId,
        mode,
        location: location ? JSON.stringify(location) : null,
        contextData: contextData ? JSON.stringify(contextData) : null
      });

      res.status(201).json(session);
    } catch (error) {
      console.error('Create session error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getCurrentSession = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const session = await this.ailockService.getCurrentSession(userId);

      if (!session) {
        return res.status(404).json({ error: 'No active session found' });
      }

      res.json(session);
    } catch (error) {
      console.error('Get current session error:', error);
      res.status(500).json({ error: 'Internal server error' });
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
      const userId = (req as any).userId;
      await this.ailockService.endSession(userId);
      res.json({ message: 'Session ended successfully' });
    } catch (error) {
      console.error('End session error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  processQuery = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { query, mode, context } = req.body;

      const response = await this.ailockService.processQuery(userId, {
        query,
        mode,
        context
      });

      res.json(response);
    } catch (error) {
      console.error('Process query error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getContextActions = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { mode, location } = req.query;

      const actions = await this.ailockService.getContextActions(userId, {
        mode: mode as string,
        location: location as string
      });

      res.json(actions);
    } catch (error) {
      console.error('Get context actions error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  executeAction = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { actionId, parameters } = req.body;

      const result = await this.ailockService.executeAction(userId, actionId, parameters);
      res.json(result);
    } catch (error) {
      console.error('Execute action error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}