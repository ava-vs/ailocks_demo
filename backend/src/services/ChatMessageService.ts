import { db } from '../models/database';
import { chatMessages, chatSessions, users } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { UnifiedLLMService, LLMMessage } from './UnifiedLLMService';
import { ContextualActionGenerator } from './ContextualActionGenerator';
import { AilockMode } from '../types';

export interface ChatMessageData {
  content: string;
  sender: 'user' | 'ailock';
  sessionId: string;
  userId?: string;
  mode?: AilockMode;
}

export interface AIResponseData {
  content: string;
  actions?: any[];
  usage?: any;
  model?: string;
  provider?: string;
}

export class ChatMessageService {
  private llmService: UnifiedLLMService;
  private actionGenerator: ContextualActionGenerator;

  constructor() {
    this.llmService = new UnifiedLLMService();
    this.actionGenerator = new ContextualActionGenerator();
  }

  async saveMessage(data: ChatMessageData) {
    const [message] = await db.insert(chatMessages).values({
      id: uuidv4(),
      sessionId: data.sessionId,
      sender: data.sender,
      content: data.content,
      timestamp: new Date()
    }).returning();

    return message;
  }

  async getSessionMessages(sessionId: string, limit: number = 50) {
    const messages = await db.select().from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(desc(chatMessages.timestamp))
      .limit(limit);

    return messages.reverse(); // Return in chronological order
  }

  async generateAIResponse(
    userMessage: string,
    sessionId: string,
    userId: string,
    mode: AilockMode,
    userContext?: any,
    onStream?: (chunk: string) => void
  ): Promise<AIResponseData> {
    try {
      // Get conversation history
      const recentMessages = await this.getSessionMessages(sessionId, 10);
      
      // Convert to LLM format
      const llmMessages: LLMMessage[] = recentMessages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      // Add current user message
      llmMessages.push({
        role: 'user',
        content: userMessage
      });

      // Generate AI response
      const response = await this.llmService.generateResponse(
        llmMessages,
        mode,
        userContext,
        onStream ? (chunk) => {
          if (!chunk.done && chunk.content) {
            onStream(chunk.content);
          }
        } : undefined
      );

      // Generate context actions
      const actions = this.actionGenerator.generateActions(
        mode,
        llmMessages,
        userContext?.location
      );

      // Save AI response to database
      await this.saveMessage({
        content: response.content,
        sender: 'ailock',
        sessionId,
        mode
      });

      return {
        content: response.content,
        actions,
        usage: response.usage,
        model: response.model,
        provider: response.provider
      };
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Fallback response
      const fallbackContent = "I apologize, but I'm experiencing some technical difficulties right now. Please try again in a moment.";
      
      await this.saveMessage({
        content: fallbackContent,
        sender: 'ailock',
        sessionId,
        mode
      });

      return {
        content: fallbackContent,
        actions: []
      };
    }
  }

  async createOrGetSession(userId: string, mode: AilockMode) {
    // Check for existing active session
    const [existingSession] = await db.select().from(chatSessions)
      .where(and(
        eq(chatSessions.userId, userId),
        eq(chatSessions.ailockMode, mode)
      ))
      .orderBy(desc(chatSessions.lastActivity))
      .limit(1);

    if (existingSession) {
      // Update last activity
      await db.update(chatSessions).set({
        lastActivity: new Date()
      }).where(eq(chatSessions.id, existingSession.id));

      return existingSession;
    }

    // Create new session
    const [newSession] = await db.insert(chatSessions).values({
      id: uuidv4(),
      userId,
      ailockMode: mode,
      createdAt: new Date(),
      lastActivity: new Date()
    }).returning();

    return newSession;
  }

  async updateSessionActivity(sessionId: string) {
    await db.update(chatSessions).set({
      lastActivity: new Date()
    }).where(eq(chatSessions.id, sessionId));
  }

  async getUserContext(userId: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) return null;

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      location: user.latitude && user.longitude ? {
        latitude: user.latitude,
        longitude: user.longitude,
        city: user.city,
        country: user.country
      } : null
    };
  }
}