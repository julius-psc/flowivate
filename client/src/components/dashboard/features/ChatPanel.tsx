"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatPanelProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  initialQuery: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, setIsOpen, initialQuery }) => {
  const [messages, setMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle initial query and AI response
  useEffect(() => {
    if (initialQuery && isOpen) {
      setMessages([{ sender: 'user', text: initialQuery }]);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { sender: 'ai', text: getAIResponse(initialQuery) },
        ]);
      }, 500);
    }
  }, [initialQuery, isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getAIResponse = (query: string) => {
    if (query.toLowerCase().includes('organize')) {
      return 'I can help you organize your dashboard! Would you like to prioritize tasks, Pomodoro, or meditation today?';
    }
    return 'I suggest starting with a 25-minute Pomodoro session to boost focus. Want me to set it up?';
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setMessages((prev) => [...prev, { sender: 'user', text: inputText }]);
    setInputText('');
    
    // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: getAIResponse(inputText) },
      ]);
    }, 500);
  };

  const panelVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Chat Panel */}
          <motion.div
            variants={panelVariants}
            className="relative w-full max-w-lg h-[80vh] bg-white dark:bg-bg-dark 
              rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 
              flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b 
              border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                Assistant
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 
                  transition-colors duration-200"
              >
                <svg
                  className="w-6 h-6 text-gray-500 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] p-3 rounded-xl ${
                      msg.sender === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 p-2 rounded-lg border border-gray-300 dark:border-gray-700 
                    bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 
                    focus:border-transparent"
                />
                <button
                  type="submit"
                  className="p-2 rounded-lg bg-blue-500 text-white 
                    hover:bg-blue-600 disabled:bg-gray-400 
                    transition-colors duration-200"
                  disabled={!inputText.trim()}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatPanel;