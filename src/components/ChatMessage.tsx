import React from 'react';
import { MessageSquare, Bot } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '../types';

interface Props {
  message: ChatMessageType;
}

export function ChatMessage({ message }: Props) {
  return (
    <div className={`flex gap-3 ${message.isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
        message.isUser ? 'bg-blue-500' : 'bg-gray-600'
      }`}>
        {message.isUser ? (
          <MessageSquare className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>
      <div className={`max-w-[80%] rounded-lg p-3 ${
        message.isUser ? 'bg-blue-500 text-white' : 'bg-gray-100'
      }`}>
        {message.content}
      </div>
    </div>
  );
}