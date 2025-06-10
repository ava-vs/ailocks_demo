import { db } from '../models/database';
import { chats, chatParticipants, users, messages } from '../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export interface CreateChatData {
  name?: string;
  mode: string;
  creatorId: string;
}

export interface UpdateChatData {
  name?: string;
  mode?: string;
}

export class ChatModel {
  async create(data: CreateChatData) {
    // Create chat
    const [newChat] = await db.insert(chats).values({
      id: uuidv4(),
      name: data.name,
      mode: data.mode
    }).returning();

    // Add creator as admin participant
    await db.insert(chatParticipants).values({
      id: uuidv4(),
      userId: data.creatorId,
      chatId: newChat.id,
      role: 'admin'
    });

    // Get the creator's user data
    const [creator] = await db.select({
      id: users.id,
      name: users.name,
      avatar: users.avatar,
      status: users.status
    }).from(users).where(eq(users.id, data.creatorId));

    // Get the latest message (if any)
    const [latestMessage] = await db.select().from(messages)
      .where(eq(messages.chatId, newChat.id))
      .orderBy(desc(messages.createdAt))
      .limit(1);

    return {
      ...newChat,
      participants: [{ ...creator, role: 'admin' }],
      messages: latestMessage ? [latestMessage] : []
    };
  }

  async findById(id: string) {
    const [chat] = await db.select().from(chats).where(eq(chats.id, id));
    if (!chat) return null;

    // Get participants with user data
    const participantList = await db.select({
      userId: chatParticipants.userId,
      role: chatParticipants.role,
      id: users.id,
      name: users.name,
      avatar: users.avatar,
      status: users.status
    }).from(chatParticipants)
      .innerJoin(users, eq(chatParticipants.userId, users.id))
      .where(eq(chatParticipants.chatId, id));

    // Get recent messages with sender data
    const messageList = await db.select({
      id: messages.id,
      content: messages.content,
      type: messages.type,
      senderId: messages.senderId,
      chatId: messages.chatId,
      metadata: messages.metadata,
      createdAt: messages.createdAt,
      senderName: users.name,
      senderAvatar: users.avatar
    }).from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.chatId, id))
      .orderBy(desc(messages.createdAt))
      .limit(50);

    return {
      ...chat,
      participants: participantList.map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        status: p.status,
        role: p.role
      })),
      messages: messageList.map(m => ({
        id: m.id,
        content: m.content,
        type: m.type,
        senderId: m.senderId,
        chatId: m.chatId,
        metadata: m.metadata,
        createdAt: m.createdAt,
        sender: {
          id: m.senderId,
          name: m.senderName,
          avatar: m.senderAvatar
        }
      }))
    };
  }

  async findUserChats(userId: string) {
    // Get chats where user is a participant
    const userChatList = await db.select({
      chatId: chatParticipants.chatId,
      chatName: chats.name,
      chatMode: chats.mode,
      chatCreatedAt: chats.createdAt,
      chatLastActivity: chats.lastActivity
    }).from(chatParticipants)
      .innerJoin(chats, eq(chatParticipants.chatId, chats.id))
      .where(eq(chatParticipants.userId, userId))
      .orderBy(desc(chats.lastActivity));

    // For each chat, get participants and latest message
    const chatIds = userChatList.map(c => c.chatId);
    
    if (chatIds.length === 0) return [];

    // Get all participants for these chats
    const allParticipants = await db.select({
      chatId: chatParticipants.chatId,
      userId: chatParticipants.userId,
      role: chatParticipants.role,
      id: users.id,
      name: users.name,
      avatar: users.avatar,
      status: users.status
    }).from(chatParticipants)
      .innerJoin(users, eq(chatParticipants.userId, users.id))
      .where(sql`${chatParticipants.chatId} = ANY(${chatIds})`);

    // Get latest messages for these chats
    const latestMessages = await db.select({
      chatId: messages.chatId,
      id: messages.id,
      content: messages.content,
      type: messages.type,
      senderId: messages.senderId,
      metadata: messages.metadata,
      createdAt: messages.createdAt,
      senderName: users.name,
      senderAvatar: users.avatar
    }).from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(sql`${messages.chatId} = ANY(${chatIds})`)
      .orderBy(desc(messages.createdAt));

    // Group data by chat
    const participantMap = new Map<string, any[]>();
    const messageMap = new Map<string, any>();

    allParticipants.forEach(p => {
      if (!participantMap.has(p.chatId)) {
        participantMap.set(p.chatId, []);
      }
      participantMap.get(p.chatId)!.push({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        status: p.status,
        role: p.role
      });
    });

    latestMessages.forEach(m => {
      if (!messageMap.has(m.chatId)) {
        messageMap.set(m.chatId, {
          id: m.id,
          content: m.content,
          type: m.type,
          senderId: m.senderId,
          metadata: m.metadata,
          createdAt: m.createdAt,
          sender: {
            id: m.senderId,
            name: m.senderName,
            avatar: m.senderAvatar
          }
        });
      }
    });

    return userChatList.map(chat => ({
      id: chat.chatId,
      name: chat.chatName,
      mode: chat.chatMode,
      createdAt: chat.chatCreatedAt,
      lastActivity: chat.chatLastActivity,
      participants: participantMap.get(chat.chatId) || [],
      messages: messageMap.has(chat.chatId) ? [messageMap.get(chat.chatId)] : []
    }));
  }

  async update(id: string, data: UpdateChatData) {
    const [updatedChat] = await db.update(chats).set({
      ...data,
      lastActivity: new Date()
    }).where(eq(chats.id, id)).returning();
    return updatedChat;
  }

  async addParticipant(chatId: string, userId: string, role: string = 'member') {
    const [participant] = await db.insert(chatParticipants).values({
      id: uuidv4(),
      chatId,
      userId,
      role
    }).returning();

    const [user] = await db.select({
      id: users.id,
      name: users.name,
      avatar: users.avatar,
      status: users.status
    }).from(users).where(eq(users.id, userId));

    return { ...participant, user };
  }

  async removeParticipant(chatId: string, userId: string) {
    const [removed] = await db.delete(chatParticipants)
      .where(and(
        eq(chatParticipants.chatId, chatId),
        eq(chatParticipants.userId, userId)
      ))
      .returning();
    return removed;
  }

  async isParticipant(chatId: string, userId: string) {
    const [participant] = await db.select().from(chatParticipants)
      .where(and(
        eq(chatParticipants.chatId, chatId),
        eq(chatParticipants.userId, userId)
      ));
    return !!participant;
  }

  async isAdmin(chatId: string, userId: string) {
    const [participant] = await db.select().from(chatParticipants)
      .where(and(
        eq(chatParticipants.chatId, chatId),
        eq(chatParticipants.userId, userId)
      ));
    return participant?.role === 'admin';
  }

  async delete(id: string) {
    const [deletedChat] = await db.delete(chats).where(eq(chats.id, id)).returning();
    return deletedChat;
  }

  async updateLastActivity(id: string) {
    const [updatedChat] = await db.update(chats).set({
      lastActivity: new Date()
    }).where(eq(chats.id, id)).returning();
    return updatedChat;
  }
}