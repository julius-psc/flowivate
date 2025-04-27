"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import React from "react"; // Import React for React.Fragment if not implicitly available

// --- Skeleton Loader Component ---
// (Designed to mimic the structure, including the original items-center alignment for bars)
const SleepSkeleton = () => {
  // Using varying heights for a slightly more dynamic look during loading
  const placeholderBarHeights = ['h-2.5', 'h-10', 'h-5', 'h-16', 'h-10', 'h-2.5', 'h-5'];

  return (
    // Match outer container style
    <div className="p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col h-full animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div className="h-3 w-12 bg-gray-200 dark:bg-zinc-700 rounded"></div> {/* "SLEEP" */}
      </div>

      {/* Input Area Skeleton */}
      <div className="flex items-center justify-center mb-4"> {/* Added margin for spacing */}
        <div className="w-6 h-6 bg-gray-300 dark:bg-zinc-600 rounded-full"></div> {/* Minus Button placeholder */}
        <div className="h-8 w-10 bg-gray-200 dark:bg-zinc-700 rounded mx-3"></div> {/* Number display placeholder */}
        <div className="w-6 h-6 bg-gray-300 dark:bg-zinc-600 rounded-full"></div> {/* Plus Button placeholder */}
      </div>

      {/* Chart Area Skeleton */}
      <div className="flex flex-col mx-auto w-full max-w-xs mb-5 px-4"> {/* Adjusted margins/padding */}
        {/* Bars Skeleton - Use items-center like original component */}
        <div className="h-20 flex justify-around items-center mb-1">
          {placeholderBarHeights.map((heightClass, index) => (
             <div key={index} className="flex flex-col items-center">
                {/* Render dot or bar based on height class for visual variety */}
                {heightClass === 'h-2.5' ? (
                     <div className={`h-2.5 w-2.5 bg-gray-300 dark:bg-zinc-600 rounded-full opacity-50`}></div>
                ) : (
                     <div className={`w-2 ${heightClass} bg-gray-300 dark:bg-zinc-600 rounded-lg`}></div>
                )}
             </div>
          ))}
        </div>
        {/* Labels Skeleton */}
        <div className="flex justify-around items-center">
          {[...Array(7)].map((_, index) => (
            <div key={index} className="h-3 w-5 bg-gray-200 dark:bg-zinc-700 rounded"></div>
          ))}
        </div>
      </div>

      {/* Footer Button Skeleton */}
      {/* Use mt-auto to push to the bottom of the flex container */}
      <div className="flex justify-center mt-auto pt-2">
        <div className="h-10 w-28 bg-gray-300 dark:bg-zinc-600 rounded-full"></div> {/* Log sleep button placeholder */}
      </div>
    </div>
  );
};


// Helper function (Unchanged from your version)
function getWeekNumber(date: Date) {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const diff = target.getTime() - firstThursday.getTime();
  return 1 + Math.round(diff / (7 * 24 * 3600 * 1000));
}

// Main Sleep Component (Unchanged logic, only loading replaced)
export default function Sleep() {
  const [sleepHours, setSleepHours] = useState(8);
  const [weeklySleep, setWeeklySleep] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession(); // Unchanged call

  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];
  const currentDayIndex = (new Date().getDay() + 6) % 7;

  // Unchanged useEffect
  useEffect(() => {
    const fetchSleepData = async () => {
      if (status === "loading" || !session?.user?.email) {
         // If session is loading, keep component loading state true
         if (status === "loading") setLoading(true);
         else {
            // If not authenticated, stop loading
            setLoading(false);
            setWeeklySleep(Array(7).fill(0)); // Optionally clear data
         }
         return;
      }

      setLoading(true);
      try {
        const res = await fetch("/api/features/sleep", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch sleep data");
        const data = await res.json();

        const sleepArray = Array(7).fill(0);
        const now = new Date();
        const currentWeek = getWeekNumber(now);
        const currentYear = now.getFullYear();

        // Basic check if data is array
        if (Array.isArray(data)) {
            data.forEach((entry: { hours: number; timestamp: string }) => {
               try {
                   const entryDate = new Date(entry.timestamp);
                   if (isNaN(entryDate.getTime())) return;

                   const entryWeek = getWeekNumber(entryDate);
                   const entryYear = entryDate.getFullYear();

                   if (entryWeek === currentWeek && entryYear === currentYear) {
                     const dayIndex = (entryDate.getDay() + 6) % 7;
                     const hours = Number(entry.hours);
                     if (!isNaN(hours) && hours >= 0 && hours <= 24) {
                         sleepArray[dayIndex] = hours;
                     }
                   }
               } catch(e) { console.error("Error processing sleep entry", e); }
            });
        }
        setWeeklySleep(sleepArray);
      } catch (error) {
        console.error("Failed to fetch sleep data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSleepData();
  }, [session, status]); // Unchanged dependencies

  // Unchanged handlers
  const handleIncrement = () => {
    if (sleepHours < 12) setSleepHours(sleepHours + 1);
  };

  const handleDecrement = () => {
    if (sleepHours > 0) setSleepHours(sleepHours - 1);
  };

  const handleSave = async () => {
    if (!session?.user?.email) return;

    const currentSleep = weeklySleep[currentDayIndex]; // Store current value for potential rollback
    const newWeeklySleep = [...weeklySleep];
    newWeeklySleep[currentDayIndex] = sleepHours;
    setWeeklySleep(newWeeklySleep); // Optimistic update

    try {
      const now = new Date();
      const res = await fetch("/api/features/sleep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours: sleepHours, timestamp: now }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save sleep");
    } catch (error) {
      console.error("Error saving sleep:", error);
      // Rollback optimistic update on failure
      const rollbackSleep = [...weeklySleep];
      rollbackSleep[currentDayIndex] = currentSleep;
      setWeeklySleep(rollbackSleep);
    }
  };

  // Unchanged style function
  const getSleepBarStyle = (value: number | null) => {
    if (!value) return { height: "10px", colorClass: "bg-secondary-black" }; // Keep original logic exactly
    if (value >= 8) return { height: "70px", colorClass: "bg-primary-blue" };
    if (value >= 4) return { height: "40px", colorClass: "bg-primary-blue" };
    if (value >= 1) return { height: "20px", colorClass: "bg-primary-blue" };
    return { height: "10px", colorClass: "bg-gray-500" };
  };

  // --- Loading Check --- (Replaced content with Skeleton)
  if (loading || status === "loading") {
    return (
        <SleepSkeleton /> // Use the skeleton component
    );
  }

  // Unchanged authentication check
  if (!session) return (
    // Match original styling for this message container if needed, or keep simple
    <div>Please sign in to track your sleep</div>
  );

  // --- Unchanged main return ---
  return (
    <div className="p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col h-full">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h1 className="text-sm text-secondary-black dark:text-secondary-white opacity-40">SLEEP</h1>
      </div>
      {/* Input Area */}
      <div className=""> {/* Keep original className (empty) */}
        <div className="flex items-center justify-center">
          <button
            onClick={handleDecrement}
            className="text-primary-blue text-2xl font-bold bg-transparent border-none cursor-pointer" // Original classes
          >
            -
          </button>
          <p className="text-secondary-black dark:text-secondary-white font-medium text-2xl mx-1.5 my-1"> {/* Original classes */}
            {sleepHours}
          </p>
          <button
            onClick={handleIncrement}
            className="text-primary-blue text-2xl font-bold bg-transparent border-none cursor-pointer" // Original classes
          >
            +
          </button>
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex flex-col mx-24 pb-5"> {/* Original classes */}
        {/* Bars - Original alignment: items-center */}
        <div className="h-20 flex justify-around items-center">
          {weeklySleep.map((value, index) => {
            const { height, colorClass } = getSleepBarStyle(value); // Original call
            return (
              <div key={index} className="flex flex-col items-center">
                {value === 0 ? (
                  // Original rendering for 0 value
                  <div className={`h-2.5 w-2.5 rounded-full opacity-20 ${colorClass}`}></div>
                ) : (
                  // Original rendering for > 0 value
                  <div
                    className={`w-2 rounded-lg ${colorClass}`}
                    style={{ height }}
                  ></div>
                )}
              </div>
            );
          })}
        </div>
        {/* Labels */}
        <div className="flex justify-around items-center">
          {dayLabels.map((day, index) => (
            <span
              key={index}
              // Original classes - Note: dark:primary-black-dark might be a typo in your original? Assuming dark:text-gray-500 or similar was intended. Keeping as provided.
              className="text-xs text-gray-500 dark:primary-black-dark w-5 text-center"
            >
              {day}
            </span>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-center">
        <button
          // Original classes
          className="dark:bg-secondary-black bg-secondary-white dark:text-secondary-white text-primary-black mx-2.5 px-6 py-2 rounded-full text-sm font-normal transition-colors duration-200"
          onClick={handleSave}
          // Optionally disable button based on original logic (e.g., disable if !session)
          disabled={!session}
        >
          Log sleep
        </button>
      </div>
    </div>
  );
}