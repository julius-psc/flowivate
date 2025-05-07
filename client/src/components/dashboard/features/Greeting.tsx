"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { IconFlameFilled } from "@tabler/icons-react";
import styles from "../../../stylesheets/Greeting.module.css";
import { motivationalQuotes } from "../../../app/data/quotes";

const Greeting: React.FC = () => {
  const [streak, setStreak] = useState(0);
  const [quote, setQuote] = useState("");
  const { data: session } = useSession();
  const username = session?.user?.username;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Get random quote and fetch streak on mount
  useEffect(() => {
    // Set random quote
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    setQuote(motivationalQuotes[randomIndex]);
    
    // Fetch streak
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

  return (
    <div className={styles.container}>
      <div className={styles.background} />
      <div className={styles.content}>
        <h2 className="text-3xl font-semibold text-primary-black dark:text-white py-2">
          {`${getGreeting()}, ${username || 'there'}`}
        </h2>
        <p className="text-primary-blue font-medium text- mb-10 tracking-tight dark:text-blue-300">
          &#34;{quote || "Embrace discomfort"}&#34;
        </p>
        <div className="flex justify-between items-center gap-4">
          <div className="relative flex-grow">Submit search
          </div>
          <div className="flex items-center gap-1 px-3 py-1 rounded-full">
            <IconFlameFilled
              size={20}
              className="text-primary-blue dark:text-blue-300"
              aria-hidden="true"
            />
            <span className="text-sm font-medium text-primary-blue dark:text-blue-300 tabular-nums">
              {streak} 
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Greeting;