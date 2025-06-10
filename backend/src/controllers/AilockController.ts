import { Request, Response } from 'express';
import { AilockService } from '../services/AilockService';
import { ChatMessageService } from '../services/ChatMessageService';
import { ContextualActionGenerator } from '../services/ContextualActionGenerator';
import { AilockMode } from '../types';

export class AilockController {
  private ailockService = new AilockService();
  private chatMessageService = new ChatMessageService();
  private actionGenerator = new ContextualActionGenerator();

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
      const userId = (req as any).user?.id;
      const updates = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

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

  startChat = async (req: Request, res: Response) => {
    try {
      const { mode = 'researcher' } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Create or get existing chat session
      const session = await this.chatMessageService.createOrGetSession(userId, mode as AilockMode);
      
      // Get recent messages
      const messages = await this.chatMessageService.getSessionMessages(session.id, 20);
      
      // Get user context
      const userContext = await this.chatMessageService.getUserContext(userId);

      return res.status(200).json({
        session,
        messages,
        userContext
      });
    } catch (error) {
      console.error('Error starting chat:', error);
      return res.status(500).json({ error: 'Failed to start chat' });
    }
  };

  processQuery = async (req: Request, res: Response) => {
    try {
      const { query, mode = 'researcher', sessionId } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      // Get or create session
      let session;
      if (sessionId) {
        session = { id: sessionId };
      } else {
        session = await this.chatMessageService.createOrGetSession(userId, mode as AilockMode);
      }

      // Save user message
      await this.chatMessageService.saveMessage({
        content: query,
        sender: 'user',
        sessionId: session.id,
        userId
      });

      // Get user context
      const userContext = await this.chatMessageService.getUserContext(userId);

      // Generate AI response
      const aiResponse = await this.chatMessageService.generateAIResponse(
        query,
        session.id,
        userId,
        mode as AilockMode,
        userContext
      );

      return res.status(200).json({
        sessionId: session.id,
        response: aiResponse.content,
        actions: aiResponse.actions,
        usage: aiResponse.usage,
        model: aiResponse.model,
        provider: aiResponse.provider
      });
    } catch (error) {
      console.error('Error processing query:', error);
      return res.status(500).json({ error: 'Failed to process query' });
    }
  };

  getContextActions = async (req: Request, res: Response) => {
    try {
      const { mode = 'researcher', sessionId } = req.query;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get user context
      const userContext = await this.chatMessageService.getUserContext(userId);
      
      // Get conversation history if session provided
      let conversationHistory: any[] = [];
      if (sessionId) {
        const messages = await this.chatMessageService.getSessionMessages(sessionId as string, 10);
        conversationHistory = messages.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));
      }

      // Generate context actions
      const actions = this.actionGenerator.generateActions(
        mode as AilockMode,
        conversationHistory,
        userContext?.location
      );

      return res.status(200).json({
        actions,
        mode,
        userContext
      });
    } catch (error) {
      console.error('Error getting context actions:', error);
      return res.status(500).json({ error: 'Failed to get context actions' });
    }
  };

  executeAction = async (req: Request, res: Response) => {
    try {
      const { actionId } = req.params;
      const { parameters = {} } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (!actionId) {
        return res.status(400).json({ error: 'Action ID is required' });
      }

      // Get user context for action execution
      const userContext = await this.chatMessageService.getUserContext(userId);
      
      // Add user context to parameters
      const enrichedParameters = {
        ...parameters,
        userId,
        userContext
      };

      // Execute the action
      const result = await this.actionGenerator.executeAction(actionId, enrichedParameters);

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error executing action:', error);
      return res.status(500).json({ error: 'Failed to execute action' });
    }
  };

  getConversationContext = async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get conversation history
      const messages = await this.chatMessageService.getSessionMessages(sessionId, 50);
      
      // Get user context
      const userContext = await this.chatMessageService.getUserContext(userId);

      return res.status(200).json({
        sessionId,
        messages,
        userContext,
        messageCount: messages.length
      });
    } catch (error) {
      console.error('Error getting conversation context:', error);
      return res.status(500).json({ error: 'Failed to get conversation context' });
    }
  };
}