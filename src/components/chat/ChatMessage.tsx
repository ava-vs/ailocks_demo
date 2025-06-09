import React from 'react';
import { format } from 'date-fns';
import { Message } from '../../types';
import { Brain, User } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isAI = message.senderId === 'ailock';
  
  return (
    <div className={`flex items-start space-x-3 animate-fade-in ${isAI ? '' : 'flex-row-reverse space-x-reverse'}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
        isAI 
          ? 'bg-gradient-primary text-white' 
          : 'bg-gray-200 text-gray-600'
      }`}>
        {isAI ? <Brain className="w-5 h-5" /> : <User className="w-5 h-5" />}
      </div>

      {/* Message Content */}
      <div className={`max-w-[70%] ${isAI ? '' : 'flex flex-col items-end'}`}>
        <div className={`px-4 py-3 rounded-2xl ${
          isAI 
            ? 'bg-white shadow-sm border border-gray-100' 
            : 'bg-gradient-primary text-white'
        }`}>
          <p className={`text-sm leading-relaxed ${isAI ? 'text-gray-800' : 'text-white'}`}>
            {message.content}
          </p>
        </div>
        
        <div className={`mt-1 text-xs text-gray-500 ${isAI ? 'text-left' : 'text-right'}`}>
          {format(message.timestamp, 'HH:mm')}
        </div>
      </div>
    </div>
  );
};