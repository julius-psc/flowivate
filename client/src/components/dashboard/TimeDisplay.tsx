"use client";

import { useState, useEffect } from 'react';

interface TimeDisplayProps {
  isCenteredFullScreen?: boolean; // Optional prop for styling
}

export default function TimeDisplay({ isCenteredFullScreen = false }: TimeDisplayProps) {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    // Set initial time immediately on client mount
    setTime(new Date());
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000); // Update every second
    return () => clearInterval(timer); // Cleanup on unmount
  }, []);

  // Render placeholder or null until time is available
  if (!time) {
    // Optional: Add a subtle loading indicator or just render nothing
    return <div className={isCenteredFullScreen ? "h-20" : "h-16"}></div>; // Reserve space
  }

  const containerClasses = isCenteredFullScreen
    ? "min-h-screen flex flex-col items-center justify-center text-center"
    : "text-center mb-8"; // Center text, add margin bottom if not full screen

  return (
    <div className={containerClasses}>
      <h1 className="text-6xl font-bold text-primary-black dark:text-primary-white">
        {time.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </h1>
      <p className="text-xl text-primary-black dark:text-primary-white opacity-50 font-medium mt-1">
        embrace discomfort
      </p>
    </div>
  );
}