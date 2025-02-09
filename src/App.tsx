import React, { useEffect, useState } from 'react';
import { Video, MessageSquare } from 'lucide-react';
import { ChatMessage as ChatMessageType } from './types';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { VideoGenerator } from './components/VideoGenerator';
import { initClerk } from './lib/clerk';

function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'video'>('chat');
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [loading, setLoading] = useState(false);
  const [clerkReady, setClerkReady] = useState(false);

  useEffect(() => {
    const loadClerk = async () => {
      try {
        await initClerk();
        setClerkReady(true);
      } catch (error) {
        console.error('Failed to initialize Clerk:', error);
      }
    };
    loadClerk();
  }, []);

  const sendMessage = async (content: string) => {
    setLoading(true);
    setMessages(prev => [...prev, { isUser: true, content }]);

    try {
      const response = await fetch(`${API_CHAT_URL}?key=${API_CHAT_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: content })
      });
      
      const data = await response.json();
      setMessages(prev => [...prev, { 
        isUser: false, 
        content: data.candidates[0].output 
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        isUser: false, 
        content: "Sorry, I encountered an error while processing your message." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-200">
            <div className="flex gap-4 p-4">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'chat' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <MessageSquare className="h-5 w-5" />
                Chat
              </button>
              <button
                onClick={() => setActiveTab('video')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'video' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Video className="h-5 w-5" />
                Video Generator
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6">
            {activeTab === 'chat' ? (
              <div className="space-y-6">
                <div className="space-y-4 mb-4 max-h-[60vh] overflow-y-auto">
                  {messages.map((message, index) => (
                    <ChatMessage key={index} message={message} />
                  ))}
                </div>
                <ChatInput onSendMessage={sendMessage} disabled={loading} />
              </div>
            ) : (
              clerkReady ? <VideoGenerator /> : (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App