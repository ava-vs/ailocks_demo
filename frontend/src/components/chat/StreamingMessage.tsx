import React from 'react';
import { Brain } from 'lucide-react';

interface StreamingMessageProps {
  content: string;
}

export const StreamingMessage: React.FC<StreamingMessageProps> = ({ content }) => {
  return (
    <div className="flex items-start space-x-3 animate-fade-in">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-primary text-white flex items-center justify-center">
        <Brain className="w-5 h-5" />
      </div>
      
      <div className="max-w-[70%]">
        <div className="bg-white shadow-sm border border-gray-100 rounded-2xl px-4 py-3">
          <p className="text-sm leading-relaxed text-gray-800">
            {content}
            <span className="inline-block w-2 h-4 bg-primary-500 ml-1 animate-pulse"></span>
          </p>
        </div>
      </div>
    </div>
  );
};