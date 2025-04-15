import React, { useState } from 'react';
import { IconBolt, IconCategoryPlus, IconBulb, IconTargetArrow, IconCircleDashedPlus, IconChevronRight, IconMessage, IconTrash, IconLock } from '@tabler/icons-react';
import logo from '../../../../assets/brand/logo-v1.4.png';
import Image from 'next/image';
import ChatPanel from './ChatPanel';

const Assistant: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [starterText, setStarterText] = useState<string | undefined>(undefined);
  const [showRecentChats, setShowRecentChats] = useState(false);
  
  // Mock recent chats - in a real implementation, these would be fetched from your backend
  const [recentChats, setRecentChats] = useState([
    { id: '1', title: 'Planning my workweek', preview: 'I need to organize my tasks for the week...', timestamp: '2h ago' },
    { id: '2', title: 'Focus techniques', preview: 'What are some effective ways to maintain focus?', timestamp: '1d ago' },
    { id: '3', title: 'Goal setting', preview: 'How can I set better SMART goals?', timestamp: '3d ago' },
  ]);

  const assistantOptions = [
    { icon: <IconBolt className="w-6 h-6 text-primary-blue dark:text-blue-400" />, text: "Plan my day", starter: "I would like to plan my day effectively..." },
    { icon: <IconCategoryPlus className="w-6 h-6 text-primary-blue dark:text-blue-400" />, text: "Organize my dashboard", starter: "I want to better organize my productivity dashboard..." },
    { icon: <IconBulb className="w-6 h-6 text-primary-blue dark:text-blue-400" />, text: "Give me ideas", starter: "I would like ideas for..." },
    { icon: <IconTargetArrow className="w-6 h-6 text-primary-blue dark:text-blue-400" />, text: "Create me an action plan", starter: "I need an action plan for..." }
  ];

  const handleOptionClick = (starter?: string) => {
    setStarterText(starter);
    setIsChatOpen(true);
  };

  const handleRecentChatClick = (chatId: string) => {
    // In a real implementation, you would load the chat history here
    const selectedChat = recentChats.find(chat => chat.id === chatId);
    if (selectedChat) {
      setStarterText(selectedChat.preview);
      setIsChatOpen(true);
    }
  };

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    setRecentChats(recentChats.filter(chat => chat.id !== chatId));
  };

  return (
    <div className="bg-white dark:bg-bg-dark border border-gray-200 dark:border-gray-800/50 rounded-xl p-4 relative flex flex-col">
      <div className="w-full flex justify-center items-center mb-4">
        <Image className="w-24 h-auto" src={logo} alt="Flowivate's logo" priority />
      </div>

      {!showRecentChats ? (
        <div className="mx-4">
          <div className="mb-4">
            <p className="text-primary-black dark:text-gray-200 font-medium">
              How can I help make your day more <span className="text-primary-blue dark:text-blue-400">productive</span>?
            </p>
            <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
              <IconLock className="w-3 h-3 mr-1" />
              <span>Privacy is our priority</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 w-full mb-4">
            {assistantOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionClick(option.starter)}
                className="flex items-center justify-between bg-primary-white dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600/50 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-blue/30 dark:focus:ring-blue-400/30 group"
                title={option.text}
              >
                <div className="flex items-center">
                  {option.icon}
                  <span className="text-sm text-gray-700 dark:text-gray-300 ml-2 my-1 font-medium">{option.text}</span>
                </div>
                <IconChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mx-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent Conversations</h3>
            <button 
              onClick={() => setShowRecentChats(false)}
              className="text-xs text-primary-blue dark:text-blue-400 hover:underline"
            >
              Back to suggestions
            </button>
          </div>
          <div className="space-y-2">
            {recentChats.length > 0 ? (
              recentChats.map(chat => (
                <div 
                  key={chat.id}
                  onClick={() => handleRecentChatClick(chat.id)}
                  className="flex items-start p-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors duration-150"
                >
                  <div className="mr-3 mt-1">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                      <IconMessage className="w-4 h-4 text-primary-blue dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{chat.title}</h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 shrink-0">{chat.timestamp}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{chat.preview}</p>
                  </div>
                  <button 
                    onClick={(e) => handleDeleteChat(e, chat.id)}
                    className="ml-2 p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                  >
                    <IconTrash className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                No recent conversations
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <button 
          onClick={() => setShowRecentChats(!showRecentChats)}
          className="flex bg-primary-white dark:bg-gray-700/70 px-3 py-2 rounded-lg transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-blue/30 dark:focus:ring-blue-400/30"
        >
          <IconMessage className="w-5 h-5 mr-1 text-primary-black/60 dark:text-gray-300/60" />
          <span className="text-sm text-primary-black/60 dark:text-gray-300/60">
            {showRecentChats ? 'New chat' : 'Recent chats'}
          </span>
        </button>
        
        {!showRecentChats && (
          <button 
            onClick={() => handleOptionClick()}
            className="flex bg-primary-blue/10 dark:bg-blue-900/30 px-3 py-2 rounded-lg transition-colors duration-200 hover:bg-primary-blue/20 dark:hover:bg-blue-800/40 focus:outline-none focus:ring-2 focus:ring-primary-blue/30 dark:focus:ring-blue-400/30"
          >
            <IconCircleDashedPlus className="w-5 h-5 mr-1 text-primary-blue dark:text-blue-400" />
            <span className="text-sm text-primary-blue dark:text-blue-400 font-medium">New chat</span>
          </button>
        )}
      </div>

      <ChatPanel 
        isOpen={isChatOpen}
        setIsOpen={setIsChatOpen}
        initialQuery={starterText || ''} 
      />
    </div>
  );
};

export default Assistant;