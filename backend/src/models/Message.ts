import { db } from '../models/database';
import { messages, users } from '../db/schema';
import { eq, and, desc, sql, ilike } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export interface CreateMessageData {
  content: string;
  type: string;
  senderId: string;
  chatId: string;
  metadata?: string;
}

export class MessageModel {
  async create(data: CreateMessageData) {
    const [newMessage] = await db.insert(messages).values({
      ...data,
      id: uuidv4()
    }).returning();

    const [sender] = await db.select({
        id: users.id,
        name: users.name,
        avatar: users.avatar
    }).from(users).where(eq(users.id, data.senderId));

    return { ...newMessage, sender };
  }

  async findById(id: string) {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    if (!message) return null;

    const [sender] = await db.select({
        id: users.id,
        name: users.name,
        avatar: users.avatar
    }).from(users).where(eq(users.id, message.senderId));

    return { ...message, sender };
  }

  async findChatMessages(chatId: string, page: number = 1, limit: number = 50) {
    const offset = (page - 1) * limit;
    
    const messageList = await db.select().from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    // Get all unique sender IDs
    const senderIds = [...new Set(messageList.map(m => m.senderId))];
    
    // Fetch all senders in one query
    const senders = await db.select({
        id: users.id,
        name: users.name,
        avatar: users.avatar
    }).from(users).where(sql`${users.id} = ANY(${senderIds})`);

    // Create a map for quick lookup
    const senderMap = new Map(senders.map(s => [s.id, s]));

    // Combine messages with sender data
    return messageList.map(message => ({
        ...message,
        sender: senderMap.get(message.senderId)
    }));
  }

  async update(id: string, data: Partial<CreateMessageData>) {
    const [updatedMessage] = await db.update(messages).set(data).where(eq(messages.id, id)).returning();
    return updatedMessage;
  }

  async delete(id: string) {
    const [deletedMessage] = await db.delete(messages).where(eq(messages.id, id)).returning();
    return deletedMessage;
  }

  async getMessageCount(chatId: string) {
    const [result] = await db.select({ count: sql<number>`count(*)` }).from(messages).where(eq(messages.chatId, chatId));
    return Number(result.count);
  }

  async searchMessages(chatId: string, query: string) {
    const messageList = await db.select().from(messages)
      .where(and(
        eq(messages.chatId, chatId),
        ilike(messages.content, `%${query}%`)
      ))
      .orderBy(desc(messages.createdAt));

    // Get all unique sender IDs
    const senderIds = [...new Set(messageList.map(m => m.senderId))];
    
    // Fetch all senders in one query
    const senders = await db.select({
        id: users.id,
        name: users.name,
        avatar: users.avatar
    }).from(users).where(sql`${users.id} = ANY(${senderIds})`);

    // Create a map for quick lookup
    const senderMap = new Map(senders.map(s => [s.id, s]));

    // Combine messages with sender data
    return messageList.map(message => ({
        ...message,
        sender: senderMap.get(message.senderId)
    }));
  }
}