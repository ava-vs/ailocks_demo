import { ChatModel, CreateChatData, UpdateChatData } from '../models/Chat';

export class ChatService {
  private chatModel = new ChatModel();

  async create(data: CreateChatData) {
    return await this.chatModel.create(data);
  }

  async getChatById(chatId: string, userId: string) {
    const isParticipant = await this.chatModel.isParticipant(chatId, userId);
    if (!isParticipant) {
      throw new Error('Access denied: Not a participant of this chat');
    }

    return await this.chatModel.findById(chatId);
  }

  async getUserChats(userId: string) {
    return await this.chatModel.findUserChats(userId);
  }

  async update(chatId: string, userId: string, data: UpdateChatData) {
    const isParticipant = await this.chatModel.isParticipant(chatId, userId);
    if (!isParticipant) {
      throw new Error('Access denied: Not a participant of this chat');
    }

    return await this.chatModel.update(chatId, data);
  }

  async delete(chatId: string, userId: string) {
    const isAdmin = await this.chatModel.isAdmin(chatId, userId);
    if (!isAdmin) {
      throw new Error('Access denied: Only admins can delete chats');
    }

    return await this.chatModel.delete(chatId);
  }

  async addParticipant(chatId: string, requesterId: string, participantId: string, role: string = 'member') {
    const isAdmin = await this.chatModel.isAdmin(chatId, requesterId);
    if (!isAdmin) {
      throw new Error('Access denied: Only admins can add participants');
    }

    return await this.chatModel.addParticipant(chatId, participantId, role);
  }

  async removeParticipant(chatId: string, requesterId: string, participantId: string) {
    const isAdmin = await this.chatModel.isAdmin(chatId, requesterId);
    const isSelf = requesterId === participantId;
    
    if (!isAdmin && !isSelf) {
      throw new Error('Access denied: Only admins can remove other participants');
    }

    return await this.chatModel.removeParticipant(chatId, participantId);
  }

  async updateLastActivity(chatId: string) {
    return await this.chatModel.updateLastActivity(chatId);
  }
}