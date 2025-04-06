"use client";

import React, { useState, useEffect } from "react";
import { IconSend2, IconFlameFilled } from "@tabler/icons-react";
import styles from "../../../stylesheets/Greeting.module.css";
import ChatPanel from "./ChatPanel";

const Greeting: React.FC = () => {
  const [searchValue, setSearchValue] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatQuery, setChatQuery] = useState("");
  const [streak, setStreak] = useState(0); // Add streak state

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Fetch streak on mount
  useEffect(() => {
    const fetchStreak = async () => {
      try {
        const response = await fetch("/api/features/streaks", {
          credentials: "include", 
        });
        const data = await response.json();
        if (response.ok) {
          setStreak(data.streak);
        } else {
          console.error("Failed to fetch streak:", data.error);
        }
      } catch (error) {
        console.error("Error fetching streak:", error);
      }
    };

    fetchStreak();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  const handleSubmit = () => {
    if (searchValue.trim()) {
      setChatQuery(searchValue);
      setIsChatOpen(true);
      setSearchValue("");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.background} />
      <div className={styles.content}>
        <h2 className="text-4xl font-semibold text-primary-black dark:text-white py-2">
          {`${getGreeting()}, Julius`}
        </h2>
        <p className="text-primary-blue font-medium text-lg mb-14 tracking-tight dark:text-blue-300">
          &#34;Embrace discomfort&#34;
        </p>
        <div className="flex justify-between items-center gap-4">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="What do you need help with?"
              value={searchValue}
              onChange={handleSearchChange}
              className="w-full px-4 pr-10 py-2 border rounded-md focus:outline-none border-gray-200/50 dark:border-gray-700/50 focus:border-primary-blue focus:ring-3 focus:ring-blue-200 text-sm text-dark:text-gray-300 placeholder-gray-400 bg-transparent dark:placeholder-primary-white/30 dark:focus:border-primary-blue-dark dark:focus:ring-primary-blue-dark/50"
              aria-label="Search input"
            />
            <button
              onClick={handleSubmit}
              className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 text-primary-black hover:text-blue-500 dark:text-primary-white dark:hover:text-blue-400 transition-colors duration-150 disabled:text-gray-400 dark:disabled:text-gray-700"
              disabled={!searchValue.trim()}
              aria-label="Submit search"
            >
              <IconSend2 size={20} />
            </button>
          </div>
          <div className="flex items-center gap-1 px-3 py-1 rounded-full">
            <IconFlameFilled
              size={20}
              className="text-primary-blue dark:text-blue-300"
              aria-hidden="true"
            />
            <span className="text-sm font-medium text-primary-blue dark:text-blue-300 tabular-nums">
              {streak} {/* Display dynamic streak */}
            </span>
          </div>
        </div>
      </div>
      <ChatPanel
        isOpen={isChatOpen}
        setIsOpen={setIsChatOpen}
        initialQuery={chatQuery}
      />
    </div>
  );
};

export default Greeting;