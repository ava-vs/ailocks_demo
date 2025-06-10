export type AilockMode = 'researcher' | 'creator' | 'analyst';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
  createdAt: Date;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file' | 'system';
  metadata?: {
    location?: string;
    intent?: string;
    actionType?: string;
    mode?: string;
    sessionId?: string;
  };
}

export interface ChatSession {
  id: string;
  userId: string;
  ailockMode: AilockMode;
  createdAt: Date;
  lastActivity: Date;
}

export interface AilockSession {
  id: string;
  userId: string;
  mode: AilockMode;
  location?: string;
  contextData?: string;
  isActive: boolean;
  createdAt: Date;
  lastActivity: Date;
}