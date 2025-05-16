"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import React from "react";
import { toast } from "sonner"; // Import Sonner toast

const SleepSkeleton = () => {
  const placeholderBarHeights = ['h-2.5', 'h-10', 'h-5', 'h-16', 'h-10', 'h-2.5', 'h-5'];
  return (
    <div className="p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col h-full animate-pulse">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div className="h-3 w-12 bg-gray-200 dark:bg-zinc-700 rounded"></div>
      </div>
      <div className="flex items-center justify-center mb-4">
        <div className="w-6 h-6 bg-gray-300 dark:bg-zinc-600 rounded-full"></div>
        <div className="h-8 w-10 bg-gray-200 dark:bg-zinc-700 rounded mx-3"></div>
        <div className="w-6 h-6 bg-gray-300 dark:bg-zinc-600 rounded-full"></div>
      </div>
      <div className="flex flex-col mx-auto w-full max-w-xs mb-5 px-4">
        <div className="h-20 flex justify-around items-center mb-1">
          {placeholderBarHeights.map((heightClass, index) => (
             <div key={index} className="flex flex-col items-center">
                {heightClass === 'h-2.5' ? (
                     <div className={`h-2.5 w-2.5 bg-gray-300 dark:bg-zinc-600 rounded-full opacity-50`}></div>
                ) : (
                     <div className={`w-2 ${heightClass} bg-gray-300 dark:bg-zinc-600 rounded-lg`}></div>
                )}
             </div>
          ))}
        </div>
        <div className="flex justify-around items-center">
          {[...Array(7)].map((_, index) => (
            <div key={index} className="h-3 w-5 bg-gray-200 dark:bg-zinc-700 rounded"></div>
          ))}
        </div>
      </div>
      <div className="flex justify-center mt-auto pt-2">
        <div className="h-10 w-28 bg-gray-300 dark:bg-zinc-600 rounded-full"></div>
      </div>
    </div>
  );
};

function getWeekNumber(date: Date) {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const diff = target.getTime() - firstThursday.getTime();
  return 1 + Math.round(diff / (7 * 24 * 3600 * 1000));
}

export default function Sleep() {
  const [sleepHours, setSleepHours] = useState(8);
  const [weeklySleep, setWeeklySleep] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();

  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];
  const currentDayIndex = (new Date().getDay() + 6) % 7;

  useEffect(() => {
    const fetchSleepData = async () => {
      if (status === "loading") {
         setLoading(true);
         return;
      }
      if (!session?.user?.email) {
          setLoading(false);
          setWeeklySleep(Array(7).fill(0));
          return;
      }
  
      setLoading(true);
      try {
        const res = await fetch("/api/features/sleep", { credentials: "include" });
        if (!res.ok) throw new Error("Server responded with an error while fetching sleep data");
        
        const responseData = await res.json(); // Contains { sleepRecords: [] }
        const recordsToProcess = responseData.sleepRecords; // Access the actual array
  
        const sleepArray = Array(7).fill(0);
        const now = new Date();
        const currentWeek = getWeekNumber(now);
        const currentYear = now.getFullYear();
  
        // MODIFICATION: Use recordsToProcess here
        if (Array.isArray(recordsToProcess)) {
            recordsToProcess.forEach((entry: { hours: number; timestamp: string }) => { 
               try {
                   const entryDate = new Date(entry.timestamp);
                   if (isNaN(entryDate.getTime())) {
                      console.warn("Invalid timestamp for entry:", entry);
                      return; // Skip this entry
                   }
                   const entryWeek = getWeekNumber(entryDate);
                   const entryYear = entryDate.getFullYear();
                   if (entryWeek === currentWeek && entryYear === currentYear) {
                     const dayIndex = (entryDate.getDay() + 6) % 7; // Monday = 0, ..., Sunday = 6
                     const hours = Number(entry.hours);
                     if (!isNaN(hours) && hours >= 0 && hours <= 24) {
                         sleepArray[dayIndex] = hours;
                     } else {
                      console.warn("Invalid hours for entry:", entry);
                     }
                   }
               } catch(e) { console.error("Error processing sleep entry", e, entry); }
            });
        } else {
          console.warn("Expected 'sleepRecords' to be an array in API response, but received:", responseData);
        }
        setWeeklySleep(sleepArray);
  
        const todayIndex = (new Date().getDay() + 6) % 7;
        if (sleepArray[todayIndex] > 0) {
          setSleepHours(sleepArray[todayIndex]);
        } else {

        }
  
      } catch (error) {
        console.error("Failed to fetch sleep data:", error);
        toast.error(`Failed to load sleep data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };
  
    fetchSleepData();
  }, [session, status]); 

  const handleIncrement = () => {
    if (sleepHours < 12) setSleepHours(sleepHours + 1);
  };

  const handleDecrement = () => {
    if (sleepHours > 0) setSleepHours(sleepHours - 1);
  };

  const handleSave = async () => {
    if (!session?.user?.email) {
        toast.error("Please sign in to log sleep."); // Toast if somehow button is clicked while logged out
        return;
    }

    const currentSleep = weeklySleep[currentDayIndex];
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
      if (!res.ok) {
        // Instead of throwing, show toast and proceed to catch for rollback
        toast.error(`Failed to save sleep data (${res.status}).`);
        throw new Error(`Server responded with status ${res.status}`); // Throw to trigger catch for rollback
      }
      toast.success("Sleep logged successfully!"); // Use toast for success
    } catch (error) {
      console.error("Error saving sleep:", error);
      // Show specific toast only if it wasn't shown in the !res.ok block
      if (!(error instanceof Error && error.message.startsWith("Server responded"))) {
          toast.error(`Error saving sleep: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      // Rollback optimistic update on failure
      const rollbackSleep = [...weeklySleep];
      rollbackSleep[currentDayIndex] = currentSleep;
      setWeeklySleep(rollbackSleep);
    }
  };

  const getSleepBarStyle = (value: number | null) => {
    if (!value) return { height: "10px", colorClass: "bg-secondary-black" };
    if (value >= 8) return { height: "70px", colorClass: "bg-primary" };
    if (value >= 4) return { height: "40px", colorClass: "bg-primary" };
    if (value >= 1) return { height: "20px", colorClass: "bg-primary" };
    return { height: "10px", colorClass: "bg-gray-500" };
  };

  if (loading || status === "loading") {
    return <SleepSkeleton />;
  }

  if (!session) return (
    <div className="p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col h-full justify-center items-center">
        <p className="text-center text-gray-600 dark:text-gray-400">Please sign in to track your sleep.</p>
    </div>
  );

  return (
    <div className="p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h1 className="text-sm text-secondary-black dark:text-secondary-white opacity-40">SLEEP</h1>
      </div>
      <div className="">
        <div className="flex items-center justify-center">
          <button onClick={handleDecrement} className="text-primary text-2xl font-bold bg-transparent border-none cursor-pointer"> - </button>
          <p className="text-secondary-black dark:text-secondary-white font-medium text-2xl mx-1.5 my-1"> {sleepHours} </p>
          <button onClick={handleIncrement} className="text-primary text-2xl font-bold bg-transparent border-none cursor-pointer"> + </button>
        </div>
      </div>

      <div className="flex flex-col mx-24 pb-5">
        <div className="h-20 flex justify-around items-center">
          {weeklySleep.map((value, index) => {
            const { height, colorClass } = getSleepBarStyle(value);
            return (
              <div key={index} className="flex flex-col items-center">
{value === 0 ? (
  <div className={`h-2.5 w-2.5 rounded-full opacity-20 ${colorClass} dark:bg-gray-600 dark:opacity-70`}></div>
) : (
  <div className={`w-2 rounded-lg ${colorClass}`} style={{ height }}></div>
)}
              </div>
            );
          })}
        </div>
        <div className="flex justify-around items-center">
          {dayLabels.map((day, index) => (
            <span key={index} className="text-xs text-gray-500 dark:primary-black-dark w-5 text-center"> {day} </span>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          className="dark:bg-primary dark:text-secondary-white mx-2.5 px-6 py-2 rounded-full text-sm font-normal transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
          onClick={handleSave}
          disabled={!session || loading} // Disable if not logged in or loading
        >
          Log sleep
        </button>
      </div>
    </div>
  );
}