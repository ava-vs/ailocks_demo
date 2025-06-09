import React from 'react';
import { Brain } from 'lucide-react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-start space-x-3 animate-fade-in">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-primary text-white flex items-center justify-center">
        <Brain className="w-5 h-5" />
      </div>
      
      <div className="bg-white shadow-sm border border-gray-100 rounded-2xl px-4 py-3">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};