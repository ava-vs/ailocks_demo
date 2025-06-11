import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useAilockStore } from '../store/ailockStore';

class SocketService {
  private static instance: SocketService;
  public socket: Socket | null = null;

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public connect(): void {
    if (this.socket && this.socket.connected) {
      return;
    }
    
    const { accessToken } = useAuthStore.getState();
    if (!accessToken) {
      console.error("Socket connection failed: No access token provided.");
      return;
    }

    const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    
    this.socket = io(VITE_API_URL, {
      auth: { token: accessToken },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
    
    this.setupEventListeners();
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;
    
    const { 
      setConnected, 
      addMessage, 
      appendToStreamingMessage, 
      clearStreamingMessage, 
      setCurrentSessionId, 
      setContextActions 
    } = useAilockStore.getState();

    this.socket.on('connect', () => {
      setConnected(true);
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      setConnected(false);
      console.log('Socket disconnected');
    });

    this.socket.on('session_created', (data: { sessionId: string }) => {
      setCurrentSessionId(data.sessionId);
    });

    this.socket.on('ai_response_chunk', (data: { chunk: string }) => {
      appendToStreamingMessage(data.chunk);
    });
    
    this.socket.on('ai_response_complete', (data: any) => {
      addMessage({
        id: data.id || new Date().toISOString(),
        content: data.content,
        senderId: 'ailock',
        timestamp: new Date(),
        type: 'text',
        metadata: {
          usage: data.usage,
          model: data.model,
          provider: data.provider,
        }
      });
      if(data.actions) {
        setContextActions(data.actions);
      }
      clearStreamingMessage();
    });

    this.socket.on('context_actions_updated', (data: { actions: any[] }) => {
        setContextActions(data.actions);
    });
    
    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });
  }

  public emit(event: string, ...args: any[]): void {
    this.socket?.emit(event, ...args);
  }

  public on(event: string, listener: (...args: any[]) => void): void {
    this.socket?.on(event, listener);
  }

  public off(event: string, listener?: (...args: any[]) => void): void {
    this.socket?.off(event, listener);
  }
}

export const socketService = SocketService.getInstance(); 