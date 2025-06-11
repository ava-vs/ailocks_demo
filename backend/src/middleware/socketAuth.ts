import jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';
import config from '../config';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export const socketAuthMiddleware = (socket: AuthenticatedSocket, next: (err?: ExtendedError) => void) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = jwt.verify(token, config.jwt.secret) as any;
    socket.userId = decoded.userId;
    socket.user = {
      id: decoded.userId,
      name: decoded.name || 'User',
      email: decoded.email || ''
    };

    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Invalid authentication token'));
  }
};