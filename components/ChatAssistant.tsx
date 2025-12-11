import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import { askChatbot } from '../services/geminiService';
import { ChatMessage } from '../types';

interface ChatAssistantProps {
  contextData: string;
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({ contextData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'model', text: 'Hallo! Ich bin dein Autocross-Assistent. Frag mich etwas zu Fahrern oder Ergebnissen.', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await askChatbot(input, contextData);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white rounded-full p-4 shadow-lg transition-transform hover:scale-110"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {isOpen && (
        <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl w-80 sm:w-96 flex flex-col h-[500px]">
          <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-800/50 rounded-t-lg">
            <div className="flex items-center gap-2">
              <Bot className="text-red-500" size={20} />
              <span className="font-semibold text-white">RaceBot</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 text-sm ${
                    msg.role === 'user'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-800 text-slate-200'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-slate-800 bg-slate-900 rounded-b-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Frag nach Statistiken..."
                className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-red-600 text-white p-2 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};