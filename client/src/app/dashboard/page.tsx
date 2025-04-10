"use client";

import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [time, setTime] = useState<Date | null>(null); // Initialize as null

  useEffect(() => {
    setTime(new Date()); // Set initial time after mount
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Don't render time until it's available
  if (!time) return null;

  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary-black dark:text-primary-white">
          {time.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit'
          })}
        </h1>
        <p className="text-xl text-primary-black dark:text-primary-white opacity-50 font-medium">
          embrace discomfort
        </p>
      </div>
    </div>
  );
}