import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAilockStore } from '../store/ailockStore';
import { Message } from '../types';

export const useSocket = () => {
  const socket = useRef<Socket | null>(null);
  const { setConnected, addMessage, setTyping } = useAilockStore();

  useEffect(() => {
    // Initialize socket connection
    socket.current = io('http://localhost:3001', {
      transports: ['websocket', 'polling']
    });

    socket.current.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
    });

    socket.current.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    socket.current.on('message', (message: Message) => {
      addMessage(message);
    });

    socket.current.on('typing', (data: { isTyping: boolean; userId: string }) => {
      if (data.userId !== 'user') {
        setTyping(data.isTyping);
      }
    });

    return () => {
      socket.current?.disconnect();
    };
  }, [setConnected, addMessage, setTyping]);

  const sendMessage = (message: Message) => {
    socket.current?.emit('message', message);
  };

  const sendTyping = (isTyping: boolean) => {
    socket.current?.emit('typing', { isTyping, userId: 'user' });
  };

  return { sendMessage, sendTyping };
};