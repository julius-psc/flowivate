"use client";

import { useState, useEffect, useMemo } from 'react';
import { useSession } from "next-auth/react";
import { motivationalQuotes } from '../../app/data/quotes';
import { IconFlameFilled } from '@tabler/icons-react';
import { toast } from "sonner"; // Import Sonner toast

interface TimeDisplayProps {
  isCenteredFullScreen?: boolean;
}

// Function to get the quote index based on a 2-hour interval (Unchanged)
const getQuoteIndexForTime = (date: Date): number => {
    const twoHoursInMillis = 2 * 60 * 60 * 1000;
    const intervalIndex = Math.floor(date.getTime() / twoHoursInMillis);
    return intervalIndex % motivationalQuotes.length;
};

// Placeholder component (Unchanged)
const TimeDisplayPlaceholder: React.FC<{ isCenteredFullScreen?: boolean }> = ({ isCenteredFullScreen }) => {
    const placeholderHeight = isCenteredFullScreen ? "h-[250px]" : "h-[180px]";
    return (
        <div className={`flex flex-col items-center justify-center ${placeholderHeight} w-full max-w-xl opacity-0`}>
             <div className="h-6 w-3/4 bg-gray-300 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
             <div className="h-16 w-1/2 bg-gray-400 dark:bg-gray-600 rounded mb-4 animate-pulse"></div>
             <div className="h-10 w-full bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
    );
};


export default function TimeDisplay({
  isCenteredFullScreen = false,
}: TimeDisplayProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(() => getQuoteIndexForTime(new Date()));
  const [streakCount, setStreakCount] = useState<number | null>(null);
  const [isStreakLoading, setIsStreakLoading] = useState(true);

  const { data: session, status: sessionStatus } = useSession();
  const username = session?.user?.username || "User";

  // Effect to set isMounted (Unchanged)
  useEffect(() => {
    setIsMounted(true);
    const now = new Date();
    setCurrentTime(now);
    setCurrentQuoteIndex(getQuoteIndexForTime(now));
    const timer = setInterval(() => {
      const newTime = new Date();
      setCurrentTime(newTime);
      const newQuoteIndex = getQuoteIndexForTime(newTime);
      setCurrentQuoteIndex(prevIndex => newQuoteIndex !== prevIndex ? newQuoteIndex : prevIndex);
    }, 1000);
    return () => clearInterval(timer);
  }, []);


  // Fetch streak data with toast error handling
  useEffect(() => {
    if (sessionStatus === "authenticated") {
      setIsStreakLoading(true);
      fetch('/api/features/streaks')
        .then(async res => { // Make async to await potential error JSON parsing
          if (!res.ok) {
            console.error("Failed to fetch streak:", res.status, res.statusText); // Keep for debugging
            // Try to parse error message from response body
            let errorMsg = `Failed to fetch streak data (${res.status})`;
            try {
              const errorData = await res.json();
              if (errorData && errorData.message) {
                errorMsg = errorData.message;
              }
            } catch (parseError) {
              toast.error(String(parseError));
            }
            throw new Error(errorMsg); // Throw error to be caught below
          }
          return res.json(); // Parse JSON if response is OK
        })
        .then(data => {
          // Set streak count, ensuring data and streak property exist
          setStreakCount(data && data.streak > 0 ? data.streak : null);
        })
        .catch(error => {
          console.error("Error fetching streak:", error); // Keep for debugging
          // USE TOAST INSTEAD OF JUST CONSOLE.ERROR
          const message = error instanceof Error ? error.message : "An unknown error occurred.";
          toast.error(`Could not load streak: ${message}`); // Show toast to user
          setStreakCount(null); // Ensure streak is cleared on error
        })
        .finally(() => {
          setIsStreakLoading(false);
        });
    } else if (sessionStatus !== "loading") { // Handle unauthenticated or initial loading state
        setIsStreakLoading(false);
        setStreakCount(null);
    }
  }, [sessionStatus]);


  // Memoized derived values (Unchanged)
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
      // Ensure index is always within bounds, fallback to 0 if somehow invalid
      const safeIndex = Number.isInteger(currentQuoteIndex) && currentQuoteIndex >= 0 && currentQuoteIndex < motivationalQuotes.length
          ? currentQuoteIndex
          : 0;
      return motivationalQuotes[safeIndex];
  }, [currentQuoteIndex]);


  const containerClasses = isCenteredFullScreen
    ? "min-h-screen flex flex-col items-center justify-center text-center p-4"
    : "text-center px-4 py-6";

  // Rendering logic (Unchanged structure, only error handling is modified)
  return (
    <div className={containerClasses}>
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
          <div className="flex items-center justify-center gap-3 my-1">
            {/* Main Time Display */}
            <h1 className="text-6xl sm:text-7xl font-bold text-gray-900 dark:text-gray-100 tracking-tight tabular-nums">
              {formattedTime}
            </h1>

             {/* Placeholder div to reserve space for streak indicator */}
            <div className="h-10 w-12 flex items-center justify-start"> {/* Adjusted height/width for better alignment */}
                {isStreakLoading ? (
                    <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div> /* Basic loading pulse */
                ) : streakCount && streakCount > 0 ? (
                    <span className="flex items-center gap-1 animate-fade-in" title={`${streakCount}-day streak`}>
                        <IconFlameFilled className="w-5 h-auto text-primary-blue" />
                        <span className="text-md font-semibold text-primary-blue ">{streakCount}</span>
                    </span>
                ) : null /* No streak or not loading, render nothing */}
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