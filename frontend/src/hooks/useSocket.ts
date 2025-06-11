import { useEffect } from 'react';
import { socketService } from '../services/socketService';
import { useAilockStore } from '../store/ailockStore';
// import { Message } from '../types';

export const useSocket = () => {
  const addMessage = useAilockStore((state) => state.addMessage);
  const setContextActions = useAilockStore((state) => state.setContextActions);

  useEffect(() => {
    const handleActionResult = (data: any) => {
      console.log('Action result received:', data);
      if (data.result.success) {
        addMessage({
          id: new Date().toISOString(),
          senderId: 'system',
          content: data.result.message,
          timestamp: new Date(),
          type: 'system',
          metadata: {
            actionId: data.actionId,
            actionResult: data.result.data,
          }
        });
        if (data.result.followUpActions) {
          setContextActions(data.result.followUpActions);
        }
      } else {
        addMessage({
          id: new Date().toISOString(),
          senderId: 'system',
          content: `Action failed: ${data.result.message}`,
          timestamp: new Date(),
          type: 'system',
        });
      }
    };
    
    socketService.on('action_result', handleActionResult);

    return () => {
      socketService.off('action_result', handleActionResult);
    };
  }, [addMessage, setContextActions]);

  const sendMessage = (message: { content: string, sessionId?: string | null, mode: string }) => {
    socketService.emit('user_message', message);
  };

  const executeAction = (actionId: string, parameters: any = {}, sessionId?: string | null) => {
    socketService.emit('execute_action', { actionId, parameters, sessionId });
  };

  const sendTyping = (isTyping: boolean, sessionId?: string | null) => {
    if (sessionId) {
      socketService.emit('typing', { isTyping, sessionId });
    }
  };

  const joinSession = (sessionId: string) => {
    socketService.emit('join_session', sessionId);
  };
  
  return {
    sendMessage,
    executeAction,
    sendTyping,
    joinSession,
  };
};