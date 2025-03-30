import React, { useState, useRef, useEffect } from 'react';
import { IconBolt, IconCategoryPlus, IconBulb, IconTargetArrow, IconCircleDashedPlus, IconSend, IconX } from '@tabler/icons-react';
import logo from '../../../assets/brand/logo-v1.0.svg';
import Image from 'next/image';

const Assistant: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<{text: string, sender: 'user' | 'ai', timestamp?: string}[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isTyping, setIsTyping] = useState(false);

  const assistantOptions = [
    { icon: <IconBolt className="w-6 h-6 text-primary-blue dark:text-blue-400" />, text: "Plan my day", starter: "I would like to plan my day effectively..." },
    { icon: <IconCategoryPlus className="w-6 h-6 text-primary-blue dark:text-blue-400" />, text: "Organize my dashboard", starter: "I want to better organize my productivity dashboard..." },
    { icon: <IconBulb className="w-6 h-6 text-primary-blue dark:text-blue-400" />, text: "Give me ideas", starter: "I would like ideas for..." },
    { icon: <IconTargetArrow className="w-6 h-6 text-primary-blue dark:text-blue-400" />, text: "Create me an action plan", starter: "I need an action plan for..." }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (isChatOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isChatOpen]);

  const startNewChat = (starterText?: string) => {
    setIsChatOpen(true);
    setMessages(starterText 
      ? [{ text: starterText, sender: 'user', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }] 
      : []
    );
  };

  const handleSendMessage = () => {
    if (inputMessage.trim() === '') return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMessages: { text: string; sender: 'user' | 'ai'; timestamp?: string }[] = [
      ...messages, 
      { text: inputMessage, sender: 'user', timestamp }
    ];
    setMessages(newMessages);
    setIsTyping(true);

    setTimeout(() => {
      setMessages([
        ...newMessages,
        { 
          text: `I'm processing: "${inputMessage}". This is a simulated AI response.`, 
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsTyping(false);
    }, 1000);

    setInputMessage('');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 relative flex flex-col">
      <div className="w-full flex justify-center items-center mb-4">
        <Image className="w-24 h-auto" src={logo} alt="Flowivate's logo" priority />
      </div>

      {!isChatOpen ? (
        <>
          <div className="mx-4">
            <div className="mb-4">
              <p className="text-primary-black dark:text-gray-200 font-medium">
                How can I help make your day more <span className="text-primary-blue dark:text-blue-400">productive</span>?
              </p>
            </div>
            <div className="grid grid-cols-[1fr_1.5fr] gap-2 w-full mb-4">
              {assistantOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => startNewChat(option.starter)}
                  className="flex items-center bg-primary-white dark:bg-gray-700 rounded-lg px-1 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-blue dark:focus:ring-blue-400"
                  title={option.text}
                >
                  {option.icon}
                  <span className="text-xs text-gray-700 dark:text-gray-300 ml-1 my-2 truncate">{option.text}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <button 
              onClick={() => startNewChat()}
              className="flex bg-primary-white dark:bg-gray-700 px-3 py-2 rounded-lg transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-blue dark:focus:ring-blue-400"
            >
              <IconCircleDashedPlus className="w-5 h-5 mr-1 text-primary-black dark:text-gray-200" />
              <span className="text-sm text-primary-black dark:text-gray-200">New chat</span>
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col h-[400px]">
          {/* Chat Header */}
          <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-100 dark:border-gray-700">
            <button 
              onClick={() => setIsChatOpen(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
            >
              <IconX className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-white dark:bg-gray-800">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] p-2.5 rounded-lg ${
                  msg.sender === 'user' 
                    ? 'bg-primary-blue text-white dark:bg-blue-600' 
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                }`}>
                  <p className="text-sm">{msg.text}</p>
                  {msg.timestamp && (
                    <span className={`text-xs mt-1 block ${
                      msg.sender === 'user' ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {msg.timestamp}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                  <div className="flex space-x-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-300 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-300 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center bg-gray-50 dark:bg-gray-700 rounded-full p-1">
              <input 
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-transparent px-3 py-1.5 text-sm text-gray-800 dark:text-gray-200 focus:outline-none placeholder-gray-400 dark:placeholder-gray-500"
              />
              <button 
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className={`p-1.5 rounded-full ${
                  inputMessage.trim() 
                    ? 'text-primary-blue dark:text-blue-400 hover:bg-primary-blue/10 dark:hover:bg-blue-400/10' 
                    : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
              >
                <IconSend className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assistant;