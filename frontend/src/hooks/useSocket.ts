import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAilockStore } from '../store/ailockStore';
import { useAuthStore } from '../store/authStore';
import { Message } from '../types';
import toast from 'react-hot-toast';

export const useSocket = () => {
  const socket = useRef<Socket | null>(null);
  const { setConnected, addMessage, setTyping, updateContextActions, currentMode } = useAilockStore();
  const { accessToken, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !accessToken || !user) {
      return;
    }

    // Initialize socket connection with authentication
    socket.current = io('http://localhost:3001', {
      auth: {
        token: accessToken
      },
      transports: ['websocket', 'polling']
    });

    socket.current.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
      toast.success('Connected to Ailock network');
    });

    socket.current.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
      toast.error('Disconnected from network');
    });

    socket.current.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnected(false);
      toast.error('Failed to connect to Ailock network');
    });

    // Handle session creation
    socket.current.on('session_created', (data: { sessionId: string }) => {
      console.log('Session created:', data.sessionId);
      useAilockStore.getState().setCurrentSessionId(data.sessionId);
    });

    // Handle streaming AI response chunks
    socket.current.on('ai_response_chunk', (data: {
      sessionId: string;
      chunk: string;
      done: boolean;
    }) => {
      console.log('Received AI chunk:', data.chunk);
      useAilockStore.getState().appendToStreamingMessage(data.chunk);
    });

    // Handle complete AI responses
    socket.current.on('ai_response_complete', (data: {
      sessionId: string;
      content: string;
      actions: any[];
      usage?: any;
      model?: string;
      provider?: string;
    }) => {
      console.log('Received complete AI response:', data);
      
      const aiMessage: Message = {
        id: Date.now().toString(),
        content: data.content,
        senderId: 'ailock',
        timestamp: new Date(),
        type: 'text',
        metadata: {
          sessionId: data.sessionId,
          mode: currentMode,
          usage: data.usage,
          model: data.model,
          provider: data.provider
        }
      };

      addMessage(aiMessage);
      setTyping(false);
      
      // Update context actions if provided
      if (data.actions && data.actions.length > 0) {
        useAilockStore.getState().setContextActions(data.actions);
      }
    });

    // Handle action execution results
    socket.current.on('action_result', (data: {
      actionId: string;
      result: any;
      sessionId?: string;
    }) => {
      console.log('Action result:', data);
      
      if (data.result.success) {
        toast.success(data.result.message || 'Action completed successfully');
        
        // If the action result contains data to display, add it as a system message
        if (data.result.data) {
          const systemMessage: Message = {
            id: Date.now().toString(),
            content: `Action "${data.actionId}" completed: ${data.result.message}`,
            senderId: 'ailock',
            timestamp: new Date(),
            type: 'system',
            metadata: {
              actionId: data.actionId,
              actionResult: data.result.data,
              sessionId: data.sessionId
            }
          };
          addMessage(systemMessage);
        }
      } else {
        toast.error(data.result.message || 'Action failed');
      }
    });

    // Handle context actions updates
    socket.current.on('context_actions_updated', (data: {
      actions: any[];
      sessionId?: string;
    }) => {
      console.log('Context actions updated:', data.actions);
      useAilockStore.getState().setContextActions(data.actions);
    });

    // Handle typing indicators
    socket.current.on('typing', (data: { isTyping: boolean; userId: string }) => {
      if (data.userId === 'ailock') {
        setTyping(data.isTyping);
      }
    });

    // Handle errors
    socket.current.on('error', (error: any) => {
      console.error('Socket error:', error);
      toast.error(error.message || 'Connection error');
    });

    return () => {
      socket.current?.disconnect();
    };
  }, [isAuthenticated, accessToken, user, setConnected, addMessage, setTyping, currentMode]);

  const sendMessage = (message: Message) => {
    if (socket.current?.connected) {
      console.log('Sending message:', message);
      
      // Add message to local state immediately for responsive UI
      addMessage(message);
      
      // Send to server
      socket.current.emit('user_message', {
        content: message.content,
        sessionId: useAilockStore.getState().currentSessionId,
        mode: currentMode
      });
      
      setTyping(true);
    } else {
      toast.error('Not connected to server');
    }
  };

  const executeAction = (actionId: string, parameters: any = {}) => {
    if (socket.current?.connected) {
      console.log('Executing action:', actionId, parameters);
      socket.current.emit('execute_action', {
        actionId,
        parameters,
        sessionId: useAilockStore.getState().currentSessionId
      });
    } else {
      toast.error('Not connected to server');
    }
  };

  const sendTyping = (isTyping: boolean) => {
    if (socket.current?.connected && user) {
      socket.current.emit('typing', { 
        isTyping, 
        sessionId: useAilockStore.getState().currentSessionId 
      });
    }
  };

  const joinSession = (sessionId: string) => {
    if (socket.current?.connected) {
      socket.current.emit('join_session', sessionId);
      useAilockStore.getState().setCurrentSessionId(sessionId);
    }
  };

  return { sendMessage, executeAction, sendTyping, joinSession };
};