import React, { useState } from 'react';
import { IconBolt, IconCategoryPlus, IconBulb, IconTargetArrow, IconCircleDashedPlus } from '@tabler/icons-react';
import logo from '../../../assets/brand/logo-v1.4.png';
import Image from 'next/image';
import ChatPanel from './ChatPanel';

const Assistant: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [starterText, setStarterText] = useState<string | undefined>(undefined);

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

  return (
    <div className="bg-white dark:bg-bg-dark border border-gray-200 dark:border-gray-800/50 rounded-xl p-4 relative flex flex-col">
      <div className="w-full flex justify-center items-center mb-4">
        <Image className="w-24 h-auto" src={logo} alt="Flowivate's logo" priority />
      </div>

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
              onClick={() => handleOptionClick(option.starter)}
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
          onClick={() => handleOptionClick()}
          className="flex bg-primary-white dark:bg-gray-700 px-3 py-2 rounded-lg transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-blue dark:focus:ring-blue-400"
        >
          <IconCircleDashedPlus className="w-5 h-5 mr-1  opacity-50 text-primary-black dark:text-gray-200" />
          <span className="text-sm text-primary-black opacity-50 dark:text-gray-200">New chat</span>
        </button>
      </div>

      <ChatPanel 
        isOpen={isChatOpen}
        setIsOpen={setIsChatOpen}
        initialQuery={starterText || ''} // Convert undefined to empty string
      />
    </div>
  );
};

export default Assistant;