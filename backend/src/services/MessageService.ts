import { MessageModel, CreateMessageData } from '../models/Message';
import { ChatModel } from '../models/Chat';

export class MessageService {
  private messageModel = new MessageModel();
  private chatModel = new ChatModel();

  async create(data: CreateMessageData) {
    // Verify user is participant of the chat
    const isParticipant = await this.chatModel.isParticipant(data.chatId, data.senderId);
    if (!isParticipant) {
      throw new Error('Access denied: Not a participant of this chat');
    }

    const message = await this.messageModel.create(data);
    
    // Update chat's last activity
    await this.chatModel.updateLastActivity(data.chatId);

    return message;
  }

  async getChatMessages(chatId: string, userId: string, page: number = 1, limit: number = 50) {
    // Verify user is participant of the chat
    const isParticipant = await this.chatModel.isParticipant(chatId, userId);
    if (!isParticipant) {
      throw new Error('Access denied: Not a participant of this chat');
    }

    return await this.messageModel.findChatMessages(chatId, page, limit);
  }

  async findById(id: string) {
    return await this.messageModel.findById(id);
  }

  async update(id: string, userId: string, data: Partial<CreateMessageData>) {
    const message = await this.messageModel.findById(id);
    if (!message) {
      throw new Error('Message not found');
    }

    if (message.senderId !== userId) {
      throw new Error('Access denied: Can only edit your own messages');
    }

    return await this.messageModel.update(id, data);
  }

  async delete(id: string, userId: string) {
    const message = await this.messageModel.findById(id);
    if (!message) {
      throw new Error('Message not found');
    }

    if (message.senderId !== userId) {
      throw new Error('Access denied: Can only delete your own messages');
    }

    return await this.messageModel.delete(id);
  }

  async searchMessages(chatId: string, userId: string, query: string) {
    // Verify user is participant of the chat
    const isParticipant = await this.chatModel.isParticipant(chatId, userId);
    if (!isParticipant) {
      throw new Error('Access denied: Not a participant of this chat');
    }

    return await this.messageModel.searchMessages(chatId, query);
  }
}