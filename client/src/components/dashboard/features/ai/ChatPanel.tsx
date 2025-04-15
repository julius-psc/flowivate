"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconSend, IconX, IconMicrophone, IconLoader2, IconRobot, IconUser, IconChevronDown, IconLock } from '@tabler/icons-react';

interface ChatPanelProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  initialQuery: string;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  isTyping?: boolean;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, setIsOpen, initialQuery }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [showInfo, setShowInfo] = useState(false);

  // Generate unique message ID
  const generateMessageId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  // Fetch Claude response
  const fetchClaudeResponse = async (message: string, history: Message[] = []) => {
    // Convert messages to the format expected by the API
    const conversationHistory = history.map(msg => ({
      sender: msg.sender,
      text: msg.text
    }));

    const response = await fetch('/api/claude', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        conversationHistory
      }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  };

  // Handle initial query using useCallback to avoid dependency issues
  const handleInitialQuery = useCallback(async (query: string) => {
    const userMessageId = generateMessageId();
    const userMessage = { 
      id: userMessageId, 
      sender: 'user' as const, 
      text: query,
      timestamp: new Date()
    };
    
    setMessages([userMessage]);
    setIsLoading(true);
    
    try {
      const aiResponse = await fetchClaudeResponse(query, []);
      setMessages((prev) => [
        ...prev,
        { 
          id: generateMessageId(), 
          sender: 'assistant', 
          text: aiResponse,
          timestamp: new Date()
        },
      ]);
    } catch (error) {
      console.error('Error getting response:', error);
      setMessages((prev) => [
        ...prev,
        { 
          id: generateMessageId(), 
          sender: 'assistant', 
          text: "I'm having trouble processing your request. Please try again.",
          timestamp: new Date()
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle initial query and AI response
  useEffect(() => {
    if (initialQuery && isOpen) {
      handleInitialQuery(initialQuery);
    }
  }, [initialQuery, isOpen, handleInitialQuery]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat is opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  // Handle text area height adjustment
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const userMessageId = generateMessageId();
    const userMessage: Message = { 
      id: userMessageId, 
      sender: 'user', 
      text: inputText,
      timestamp: new Date()
    };
    
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInputText('');
    setIsLoading(true);
    
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    
    try {
      const aiResponse = await fetchClaudeResponse(inputText, messages);
      setMessages((prev) => [
        ...prev,
        { 
          id: generateMessageId(), 
          sender: 'assistant', 
          text: aiResponse,
          timestamp: new Date()
        },
      ]);
    } catch (error) {
      console.error('Error getting response:', error);
      setMessages((prev) => [
        ...prev,
        { 
          id: generateMessageId(), 
          sender: 'assistant', 
          text: "I'm having trouble processing your request. Please try again.",
          timestamp: new Date()
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6"
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
            className="relative w-full max-w-2xl h-[85vh] bg-white dark:bg-bg-dark 
              rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 
              flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b 
              border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="flex items-center">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-full mr-2">
                  <IconRobot className="w-5 h-5 text-primary-blue dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    Assistant
                  </h2>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <IconLock className="w-3 h-3 mr-1" />
                    <span>Privacy is our priority</span>
                    <button 
                      onClick={() => setShowInfo(!showInfo)} 
                      className="ml-1 flex items-center text-primary-blue dark:text-blue-400 hover:underline"
                    >
                      <span>Info</span>
                      <IconChevronDown className={`w-3 h-3 ml-0.5 transition-transform ${showInfo ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 
                  transition-colors duration-200"
              >
                <IconX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Privacy info */}
            <AnimatePresence>
              {showInfo && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-b border-gray-200 dark:border-gray-800"
                >
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/10 text-xs text-gray-700 dark:text-gray-300">
                    <p className="mb-1"><span className="font-medium">Data Privacy:</span> Your conversations are processed securely for the best experience.</p>
                    <p><span className="font-medium">Powered by Claude:</span> This assistant uses Anthropic&#39;s Claude API to provide intelligent responses.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div className="flex-1 px-4 py-3 overflow-y-auto space-y-4 bg-gray-50 dark:bg-gray-900/30">
              {messages.length === 0 && (
                <div className="flex justify-center items-center h-full text-center text-gray-500 dark:text-gray-400 p-4">
                  <div>
                    <div className="mx-auto bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-3">
                      <IconRobot className="w-8 h-8 text-primary-blue dark:text-blue-400" />
                    </div>
                    <p className="text-sm mb-2">How can I help your productivity today?</p>
                    <p className="text-xs opacity-70">Ask me about task management, focus techniques, or organization tips.</p>
                  </div>
                </div>
              )}
              
              {messages.map((msg) => (
                <div key={msg.id} className="space-y-1">
                  <div className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl ${
                        msg.sender === 'user'
                          ? 'bg-primary-blue text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center mb-1">
                        <div className={`flex items-center ${msg.sender === 'user' ? 'text-blue-100' : 'text-primary-blue dark:text-blue-400'}`}>
                          {msg.sender === 'user' ? (
                            <IconUser className="w-4 h-4 mr-1" />
                          ) : (
                            <IconRobot className="w-4 h-4 mr-1" />
                          )}
                          <span className="text-xs font-medium">
                            {msg.sender === 'user' ? 'You' : 'Assistant'}
                          </span>
                        </div>
                        <span className={`text-xs ml-2 ${msg.sender === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                      <div className="whitespace-pre-wrap text-sm">
                        {msg.text}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-200 dark:border-gray-700 max-w-[85%]">
                    <div className="flex items-center mb-1">
                      <div className="flex items-center text-primary-blue dark:text-blue-400">
                        <IconRobot className="w-4 h-4 mr-1" />
                        <span className="text-xs font-medium">Assistant</span>
                      </div>
                      <span className="text-xs ml-2 text-gray-500 dark:text-gray-400">
                        {formatTime(new Date())}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                      <IconLoader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    rows={1}
                    className="w-full p-3 max-h-32 rounded-lg border border-gray-300 dark:border-gray-700 
                      bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 
                      focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent
                      resize-none"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300
                      hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <IconMicrophone className="w-5 h-5" />
                  </button>
                  <button
                    type="submit"
                    className="p-3 rounded-lg bg-primary-blue text-white 
                      hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed
                      transition-colors duration-200 flex items-center justify-center"
                    disabled={!inputText.trim() || isLoading}
                  >
                    {isLoading ? (
                      <IconLoader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <IconSend className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              <div className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
                <p>Your privacy is important to us</p>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatPanel;