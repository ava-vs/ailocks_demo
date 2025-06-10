import { Request, Response } from 'express';
import { ChatService } from '../services/ChatService';
import { MessageService } from '../services/MessageService';

export class ChatController {
  private chatService = new ChatService();
  private messageService = new MessageService();

  getUserChats = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const chats = await this.chatService.getUserChats(userId);
      res.json(chats);
    } catch (error) {
      console.error('Get user chats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  createChat = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { name, mode } = req.body;
      
      const chat = await this.chatService.create({
        name,
        mode,
        creatorId: userId
      });

      res.status(201).json(chat);
    } catch (error) {
      console.error('Create chat error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getChatById = async (req: Request, res: Response) => {
    try {
      const { chatId } = req.params;
      const userId = (req as any).userId;

      const chat = await this.chatService.getChatById(chatId, userId);
      if (!chat) {
        return res.status(404).json({ error: 'Chat not found' });
      }

      return res.json(chat);
    } catch (error) {
      console.error('Get chat error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  updateChat = async (req: Request, res: Response) => {
    try {
      const { chatId } = req.params;
      const userId = (req as any).userId;
      const updates = req.body;

      const chat = await this.chatService.update(chatId, userId, updates);
      res.json(chat);
    } catch (error) {
      console.error('Update chat error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  deleteChat = async (req: Request, res: Response) => {
    try {
      const { chatId } = req.params;
      const userId = (req as any).userId;

      await this.chatService.delete(chatId, userId);
      res.json({ message: 'Chat deleted successfully' });
    } catch (error) {
      console.error('Delete chat error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getChatMessages = async (req: Request, res: Response) => {
    try {
      const { chatId } = req.params;
      const userId = (req as any).userId;
      const { page = 1, limit = 50 } = req.query;

      const messages = await this.messageService.getChatMessages(
        chatId, 
        userId, 
        Number(page), 
        Number(limit)
      );

      res.json(messages);
    } catch (error) {
      console.error('Get chat messages error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  sendMessage = async (req: Request, res: Response) => {
    try {
      const { chatId } = req.params;
      const userId = (req as any).userId;
      const { content, type = 'text', metadata } = req.body;

      const message = await this.messageService.create({
        content,
        type,
        senderId: userId,
        chatId,
        metadata: metadata ? JSON.stringify(metadata) : undefined
      });

      return res.status(201).json(message);
    } catch (error) {
      console.error('Send message error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  addParticipant = async (req: Request, res: Response) => {
    try {
      const { chatId } = req.params;
      const userId = (req as any).userId;
      const { participantId, role = 'member' } = req.body;

      const participant = await this.chatService.addParticipant(
        chatId, 
        userId, 
        participantId, 
        role
      );

      res.status(201).json(participant);
    } catch (error) {
      console.error('Add participant error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  removeParticipant = async (req: Request, res: Response) => {
    try {
      const { chatId, userId: participantId } = req.params;
      const userId = (req as any).userId;

      await this.chatService.removeParticipant(chatId, userId, participantId);
      res.json({ message: 'Participant removed successfully' });
    } catch (error) {
      console.error('Remove participant error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}