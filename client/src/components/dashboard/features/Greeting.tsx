"use client";

import React, { useState } from 'react';
import { IconSend2, IconFlameFilled } from '@tabler/icons-react';
import styles from '../../../stylesheets/Greeting.module.css';

const Greeting: React.FC = () => {
  const [searchValue, setSearchValue] = useState('');

  // Get current time for dynamic greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  return (
    <div className={styles.container}>
      <div className={styles.background} />
      <div className={styles.content}>
        <h2 className="text-4xl font-semibold text-primary-black py-2">
          {`${getGreeting()}, Julius`}
        </h2>
        <p className="text-primary-blue font-medium text-lg  mb-14 tracking-tight">
          &#34;Embrace discomfort&#34;
        </p>
        <div className="flex justify-between items-center gap-4">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="What do you need help with?"
              value={searchValue}
              onChange={handleSearchChange}
              className="w-full px-4 py-2 pr-12 border-none bg-primary-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-200 ease-in-out placeholder-gray-400"
              aria-label="Search input"
            />
            <button
              className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-500 transition-colors duration-150 disabled:text-gray-300"
              disabled={!searchValue.trim()}
              aria-label="Submit search"
            >
              <IconSend2 size={20} />
            </button>
          </div>
          <div className="flex items-center gap-1 px-3 py-1 rounded-full">
            <IconFlameFilled 
              size={20} 
              className="text-primary-blue" 
              aria-hidden="true"
            />
            <span className="text-sm font-medium text-primary-blue tabular-nums">
              4
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Greeting;