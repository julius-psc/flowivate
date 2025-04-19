"use client";

import { useState, useEffect, useMemo } from 'react';
import { useSession } from "next-auth/react";
import { motivationalQuotes } from '../../app/data/quotes';
import { IconFlameFilled } from '@tabler/icons-react';

interface TimeDisplayProps {
  isCenteredFullScreen?: boolean;
}

// Function to get the quote index based on a 2-hour interval
const getQuoteIndexForTime = (date: Date): number => {
    const twoHoursInMillis = 2 * 60 * 60 * 1000;
    const intervalIndex = Math.floor(date.getTime() / twoHoursInMillis);
    return intervalIndex % motivationalQuotes.length;
};

// Placeholder component for initial render to prevent hydration errors
const TimeDisplayPlaceholder: React.FC<{ isCenteredFullScreen?: boolean }> = ({ isCenteredFullScreen }) => {
    // Estimate height to minimize layout shift
    const placeholderHeight = isCenteredFullScreen ? "h-[250px]" : "h-[180px]";
    return (
        <div className={`flex flex-col items-center justify-center ${placeholderHeight} w-full max-w-xl opacity-0`}>
             {/* Content can be added here for structure if needed, but opacity-0 hides it */}
             <div className="h-6 w-3/4 bg-gray-300 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
             <div className="h-16 w-1/2 bg-gray-400 dark:bg-gray-600 rounded mb-4 animate-pulse"></div>
             <div className="h-10 w-full bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
    );
};


export default function TimeDisplay({
  isCenteredFullScreen = false,
}: TimeDisplayProps) {
  const [isMounted, setIsMounted] = useState(false); // State to track client mount
  const [currentTime, setCurrentTime] = useState(() => new Date()); // Initialize safely
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(() => getQuoteIndexForTime(new Date())); // Initialize safely
  const [streakCount, setStreakCount] = useState<number | null>(null);
  const [isStreakLoading, setIsStreakLoading] = useState(true);

  const { data: session, status: sessionStatus } = useSession();
  const username = session?.user?.username || "User";

  // Effect to set isMounted to true only on the client
  useEffect(() => {
    setIsMounted(true);

    // Set initial time again after mount to ensure client's time is used
    const now = new Date();
    setCurrentTime(now);
    setCurrentQuoteIndex(getQuoteIndexForTime(now));

    // Start the timer interval
    const timer = setInterval(() => {
      const newTime = new Date();
      setCurrentTime(newTime);

      const newQuoteIndex = getQuoteIndexForTime(newTime);
      // Use functional update for state based on previous state
      setCurrentQuoteIndex(prevIndex => newQuoteIndex !== prevIndex ? newQuoteIndex : prevIndex);

    }, 1000);

    return () => clearInterval(timer); // Cleanup interval
  }, []); // Empty dependency array ensures this runs only once on mount


  // Fetch streak data when session is available (runs after mount effect)
  useEffect(() => {
    if (sessionStatus === "authenticated") {
      setIsStreakLoading(true);
      fetch('/api/features/streaks')
        .then(res => {
          if (!res.ok) {
            console.error("Failed to fetch streak:", res.statusText);
            return { streak: 0 };
          }
          return res.json();
        })
        .then(data => {
          setStreakCount(data.streak > 0 ? data.streak : null);
        })
        .catch(error => {
          console.error("Error fetching streak:", error);
          setStreakCount(null);
        })
        .finally(() => {
          setIsStreakLoading(false);
        });
    } else if (sessionStatus !== "loading") { // Handle unauthenticated or error
        setIsStreakLoading(false);
        setStreakCount(null);
    }
  }, [sessionStatus]);


  // Memoize derived values
  const greeting = useMemo(() => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, [currentTime]);

  const formattedDate = useMemo(() => {
    return currentTime.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  }, [currentTime]);

  const formattedTime = useMemo(() => {
    return currentTime.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [currentTime]);

  const currentQuote = useMemo(() => {
      return motivationalQuotes[currentQuoteIndex];
  }, [currentQuoteIndex]);


  const containerClasses = isCenteredFullScreen
    ? "min-h-screen flex flex-col items-center justify-center text-center p-4"
    : "text-center px-4 py-6";

  return (
    <div className={containerClasses}>
      {/* Render placeholder on server and initial client render, actual content after mount */}
      {!isMounted ? (
        <TimeDisplayPlaceholder isCenteredFullScreen={isCenteredFullScreen} />
      ) : (
        <div className="flex flex-col items-center w-full max-w-xl">

          {/* Greeting and Date */}
          <div className="flex items-center justify-center gap-2 mb-1 text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium">
            <span>{greeting}, {username}</span>
            <span className="hidden sm:inline">• {formattedDate}</span>
          </div>

          {/* Wrapper for Time and Streak */}
          <div className="flex items-center justify-center gap-3 my-1"> {/* Added wrapper and gap */}
            {/* Main Time Display */}
            <h1 className="text-6xl sm:text-7xl font-bold text-gray-900 dark:text-gray-100 tracking-tight tabular-nums">
              {formattedTime}
            </h1>

            <div className="h-6 w-10 flex items-center justify-start"> {/* Height matches large text line-height roughly */}
                {!isStreakLoading && streakCount && streakCount > 0 && (
                    <span className="flex items-center gap-1 animate-fade-in" title={`${streakCount}-day streak`}> {/* Added fade-in animation */}
                        <IconFlameFilled className="w-5 h-auto text-primary-blue" />
                        <span className="text-md font-semibold text-primary-blue ">{streakCount}</span>
                    </span>
                )}
            </div>
          </div>

          {/* Quote Display */}
          <div className="mt-3 max-w-md text-center">
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 font-medium italic">
              &#34;{currentQuote}&#34;
            </p>
          </div>

        </div>
      )}
    </div>
  );
}