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
    <div
      className={`fixed top-0 z-1000 right-0 h-full w-80 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="p-4">
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
        >
          Close
        </button>
        <div className="mt-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-2 p-2 rounded-lg ${
                msg.sender === 'user'
                  ? 'bg-blue-100 text-right'
                  : 'bg-gray-100 text-left'
              }`}
            >
              {msg.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;