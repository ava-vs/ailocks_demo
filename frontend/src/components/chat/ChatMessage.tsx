import React from 'react';
import { format } from 'date-fns';
import { Message } from '../../types';
import { Brain, User, Settings } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { user } = useAuthStore();
  const isCurrentUser = message.senderId === user?.id;
  const isAI = message.senderId === 'ailock';
  const isSystem = message.type === 'system';
  
  return (
    <div className={`flex items-start space-x-3 animate-fade-in ${isCurrentUser && !isAI ? 'flex-row-reverse space-x-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
        isAI 
          ? 'bg-gradient-primary text-white' 
          : isSystem
          ? 'bg-gray-400 text-white'
          : isCurrentUser
          ? 'bg-gray-200 text-gray-600'
          : 'bg-blue-100 text-blue-600'
      }`}>
        {isAI ? (
          <Brain className="w-5 h-5" />
        ) : isSystem ? (
          <Settings className="w-5 h-5" />
        ) : (
          <User className="w-5 h-5" />
        )}
      </div>

      {/* Message Content */}
      <div className={`max-w-[70%] ${isCurrentUser && !isAI ? 'flex flex-col items-end' : ''}`}>
        <div className={`px-4 py-3 rounded-2xl ${
          isAI 
            ? 'bg-white shadow-sm border border-gray-100' 
            : isSystem
            ? 'bg-gray-100 border border-gray-200'
            : isCurrentUser
            ? 'bg-gradient-primary text-white'
            : 'bg-gray-100 text-gray-800'
        }`}>
          <p className={`text-sm leading-relaxed ${
            isAI ? 'text-gray-800' : 
            isSystem ? 'text-gray-600' :
            isCurrentUser ? 'text-white' : 'text-gray-800'
          }`}>
            {message.content}
          </p>
          
          {/* Show metadata for AI messages */}
          {isAI && message.metadata && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                {message.metadata.model && (
                  <span>Model: {message.metadata.model}</span>
                )}
                {message.metadata.provider && (
                  <span>• {message.metadata.provider}</span>
                )}
                {message.metadata.usage && (
                  <span>• {message.metadata.usage.total_tokens} tokens</span>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className={`mt-1 text-xs text-gray-500 ${isCurrentUser && !isAI ? 'text-right' : 'text-left'}`}>
          {format(message.timestamp, 'HH:mm')}
        </div>
      </div>
    </div>
  );
};