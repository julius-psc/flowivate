"use client";

import React, { useState, useEffect } from 'react';

interface ChatPanelProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  initialQuery: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, setIsOpen, initialQuery }) => {
  const [messages, setMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([]);

  useEffect(() => {
    if (initialQuery) {
      setMessages([{ sender: 'user', text: initialQuery }]);
      // Simulate AI response (replace with actual API call)
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { sender: 'ai', text: getAIResponse(initialQuery) },
        ]);
      }, 500);
    }
  }, [initialQuery]);

  const getAIResponse = (query: string) => {
    // Placeholder logic - replace with API call to Grok or custom logic
    if (query.toLowerCase().includes('organize')) {
      return 'I can help you organize your dashboard! Would you like to prioritize tasks, Pomodoro, or meditation today?';
    }
    return 'I suggest starting with a 25-minute Pomodoro session to boost focus. Want me to set it up?';
  };

  return (
    <>
      {/* Overlay with blur effect */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Background blur overlay */}
        <div
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        ></div>

        {/* Chat panel */}
        <div
          className={`relative w-full max-w-md h-[80vh] bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-2xl transform transition-all duration-300 ${
            isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Chat
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
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
            <div className="flex-1 p-4 overflow-y-auto">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`mb-3 p-3 rounded-lg max-w-[80%] ${
                    msg.sender === 'user'
                      ? 'bg-blue-500 text-white ml-auto'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 mr-auto'
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatPanel;