import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAilockStore } from '../store/ailockStore';
import { useAuthStore } from '../store/authStore';
import { Message } from '../types';
import toast from 'react-hot-toast';

export const useSocket = () => {
  const socket = useRef<Socket | null>(null);
  const { setConnected, addMessage, setTyping } = useAilockStore();
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

    // Listen for AI responses
    socket.current.on('ailock_response', (message: Message) => {
      console.log('Received ailock response:', message);
      addMessage(message);
      setTyping(false);
    });

    socket.current.on('typing', (data: { isTyping: boolean; userId: string }) => {
      if (data.userId !== user.id) {
        setTyping(data.isTyping);
      }
    });

    socket.current.on('error', (error: any) => {
      console.error('Socket error:', error);
      toast.error(error.message || 'Connection error');
    });

    return () => {
      socket.current?.disconnect();
    };
  }, [isAuthenticated, accessToken, user, setConnected, addMessage, setTyping]);

  const sendMessage = (message: Message) => {
    if (socket.current?.connected) {
      console.log('Sending message:', message);
      socket.current.emit('user_message', message);
      setTyping(true);
    } else {
      toast.error('Not connected to server');
    }
  };

  const sendTyping = (isTyping: boolean) => {
    if (socket.current?.connected && user) {
      socket.current.emit('typing', { isTyping, userId: user.id });
    }
  };

  return { sendMessage, sendTyping };
};