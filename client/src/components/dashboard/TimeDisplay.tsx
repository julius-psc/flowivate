"use client";

import { useState, useEffect, useMemo } from 'react';
import { useSession } from "next-auth/react";
import { useTheme } from 'next-themes';
import { motivationalQuotes } from '../../app/data/quotes';
import { IconFlameFilled } from '@tabler/icons-react';
import { toast } from "sonner";

interface TimeDisplayProps {
  isCenteredFullScreen?: boolean;
}

const getQuoteIndexForTime = (date: Date): number => {
  const twoHoursInMillis = 2 * 60 * 60 * 1000;
  const intervalIndex = Math.floor(date.getTime() / twoHoursInMillis);
  return intervalIndex % motivationalQuotes.length;
};

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
  const { theme } = useTheme();
  const { data: session, status: sessionStatus } = useSession();
  const username = session?.user?.username || "User";

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

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      setIsStreakLoading(true);
      fetch('/api/features/streaks')
        .then(async res => {
          if (!res.ok) {
            let errorMsg = `Failed to fetch streak data (${res.status})`;
            try {
              const errorData = await res.json();
              if (errorData && errorData.message) errorMsg = errorData.message;
            } catch (parseError) {
              toast.error(String(parseError));
            }
            throw new Error(errorMsg);
          }
          return res.json();
        })
        .then(data => {
          setStreakCount(data && data.streak > 0 ? data.streak : null);
        })
        .catch(error => {
          const message = error instanceof Error ? error.message : "An unknown error occurred.";
          toast.error(`Could not load streak: ${message}`);
          setStreakCount(null);
        })
        .finally(() => {
          setIsStreakLoading(false);
        });
    } else if (sessionStatus !== "loading") {
      setIsStreakLoading(false);
      setStreakCount(null);
    }
  }, [sessionStatus]);

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
    const safeIndex = Number.isInteger(currentQuoteIndex) && currentQuoteIndex >= 0 && currentQuoteIndex < motivationalQuotes.length
      ? currentQuoteIndex
      : 0;
    return motivationalQuotes[safeIndex];
  }, [currentQuoteIndex]);

  const greetingTextClass = !isMounted
    ? 'text-transparent'
    : theme === 'jungle' || theme === 'ocean'
      ? 'text-white/80'
      : 'text-zinc-500 dark:text-zinc-500';

  const timeTextClass = !isMounted
    ? 'text-transparent'
    : theme === 'jungle' || theme === 'ocean'
      ? 'text-white'
      : 'text-gray-900 dark:text-gray-100';

  const quoteTextClass = !isMounted
    ? 'text-transparent'
    : theme === 'jungle' || theme === 'ocean'
      ? 'text-white/70'
      : 'text-zinc-400 dark:text-zinc-600';

  const streakColorClass = !isMounted
    ? 'text-transparent'
    : theme === 'jungle' || theme === 'ocean'
      ? 'text-white'
      : 'text-orange-500 dark:text-orange-400';

  const containerClasses = isCenteredFullScreen
    ? "min-h-screen flex flex-col items-center justify-center text-center p-4"
    : "text-center px-4 py-6 z-50";

  return (
    <div className={containerClasses}>
      {!isMounted ? (
        <TimeDisplayPlaceholder isCenteredFullScreen={isCenteredFullScreen} />
      ) : (
        <div className="flex flex-col items-center w-full max-w-xl space-y-3">
          <div className="text-sm font-medium flex items-center gap-1">
            <span className={quoteTextClass}>{greeting},</span>
            <span className={greetingTextClass}>{username}</span>
            <span className={quoteTextClass}>• {formattedDate}</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className={`text-6xl sm:text-7xl font-semibold tracking-tight tabular-nums ${timeTextClass}`}>
              {formattedTime}
            </h1>

            {isStreakLoading ? (
              <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
            ) : streakCount && streakCount > 0 ? (
              <div className="flex items-center gap-1.5 animate-fade-in" title={`${streakCount}-day streak`}>
                <IconFlameFilled className={`w-6 h-6 ${streakColorClass}`} />
                <span className={`text-lg font-semibold ${streakColorClass}`}>{streakCount}</span>
              </div>
            ) : null}
          </div>

          <p className={`text-sm font-medium max-w-md ${quoteTextClass}`}>
            {currentQuote}
          </p>
        </div>
      )}
    </div>
  );
}