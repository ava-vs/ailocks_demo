import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, MicOff } from 'lucide-react';
import { useAilockStore } from '../../store/ailockStore';
import { Message } from '../../types';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { ContextActions } from './ContextActions';

export const ChatInterface: React.FC = () => {
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, addMessage, isTyping, currentMode } = useAilockStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      senderId: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    addMessage(newMessage);
    setInputMessage('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: generateAIResponse(inputMessage, currentMode),
        senderId: 'ailock',
        timestamp: new Date(),
        type: 'text'
      };
      addMessage(aiResponse);
    }, 1000 + Math.random() * 2000);
  };

  const generateAIResponse = (userMessage: string, mode: string): string => {
    const responses = {
      researcher: [
        "I've found some interesting research on that topic. Let me analyze the latest data patterns...",
        "Based on my analysis, here are the key findings from recent studies...",
        "I can help you explore this topic further. Would you like me to search for related research?"
      ],
      creator: [
        "That's a fascinating idea! Let me help you develop it further...",
        "I can assist you in creating something amazing. What would you like to build?",
        "Your creativity sparks new possibilities. Here's how we can bring this to life..."
      ],
      analyst: [
        "Let me analyze this data for you and provide insights...",
        "Based on the patterns I'm seeing, here are my recommendations...",
        "The metrics indicate several interesting trends. Would you like a detailed breakdown?"
      ]
    };

    const modeResponses = responses[mode as keyof typeof responses];
    return modeResponses[Math.floor(Math.random() * modeResponses.length)];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Hello! I'm Ailock, your AI assistant
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              I'm here to help you in {currentMode} mode. Ask me anything or use the context actions below!
            </p>
          </div>
        )}
        
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Context Actions */}
      <ContextActions />

      {/* Input Area */}
      <div className="p-6 bg-white/50 backdrop-blur-sm border-t border-gray-200/50">
        <div className="flex items-end space-x-4">
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Ask Ailock anything in ${currentMode} mode...`}
              className="w-full resize-none border border-gray-300 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            <button className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
              <Paperclip className="w-5 h-5" />
            </button>
          </div>
          
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`p-3 rounded-xl transition-all duration-200 ${
              isRecording 
                ? 'bg-red-500 text-white shadow-lg' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            className="p-3 bg-gradient-primary text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};