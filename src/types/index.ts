export interface User {
  id: string;
  name: string;
  avatar?: string;
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
  };
  status: 'online' | 'offline' | 'busy';
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
  };
}

export interface Chat {
  id: string;
  participants: User[];
  messages: Message[];
  lastActivity: Date;
  mode: AilockMode;
}

export type AilockMode = 'researcher' | 'creator' | 'analyst';

export interface Intent {
  id: string;
  title: string;
  description: string;
  type: 'offer' | 'request';
  category: string;
  location?: string;
  userId: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  expiresAt?: Date;
}

export interface AilockState {
  currentMode: AilockMode;
  isTyping: boolean;
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
  };
  contextActions: ContextAction[];
}

export interface ContextAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  category: 'research' | 'create' | 'analyze';
}