"use client";

import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";

interface TimeDisplayProps {
  isCenteredFullScreen?: boolean;
  quote?: string;
}

export default function TimeDisplay({ 
  isCenteredFullScreen = false,
  quote = "embrace discomfort"
}: TimeDisplayProps) {
  const [time, setTime] = useState<Date | null>(null);
  const [greeting, setGreeting] = useState<string>("");

    const { data: session } = useSession();
    const username = session?.user?.username || "User";

  useEffect(() => {
    // Set initial time immediately on client mount
    const now = new Date();
    setTime(now);
    setGreeting(getGreeting(now));
    
    const timer = setInterval(() => {
      const newTime = new Date();
      setTime(newTime);
      setGreeting(getGreeting(newTime));
    }, 1000); // Update every second
    
    return () => clearInterval(timer); // Cleanup on unmount
  }, []);

  const getGreeting = (date: Date): string => {
    const hour = date.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Format date
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  // Render placeholder or null until time is available
  if (!time) {
    return <div className={isCenteredFullScreen ? "h-24" : "h-20"}></div>; // Reserve space
  }

  const containerClasses = isCenteredFullScreen
    ? "min-h-screen flex flex-col items-center justify-center text-center"
    : "text-center px-4 py-4";

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center">
        <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">
          {greeting}, {username} • {formatDate(time)}
        </p>
        
        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          {time.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </h1>
        
        <div className="mt-3 max-w-md">
          <p className="text-lg text-gray-600 dark:text-gray-400 font-medium italic">
            &#34;{quote}&#34;
          </p>
        </div>
      </div>
    </div>
  );
}