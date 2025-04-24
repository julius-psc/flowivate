"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

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
      if (status === "loading" || !session?.user?.email) return;

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

        data.forEach((entry: { hours: number; timestamp: string }) => {
          const entryDate = new Date(entry.timestamp);
          const entryWeek = getWeekNumber(entryDate);
          const entryYear = entryDate.getFullYear();

          if (entryWeek === currentWeek && entryYear === currentYear) {
            const dayIndex = (entryDate.getDay() + 6) % 7;
            sleepArray[dayIndex] = entry.hours;
          }
        });

        setWeeklySleep(sleepArray);
      } catch (error) {
        console.error("Failed to fetch sleep data:", error);
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
    if (!session?.user?.email) return;

    const newWeeklySleep = [...weeklySleep];
    newWeeklySleep[currentDayIndex] = sleepHours;
    setWeeklySleep(newWeeklySleep);

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
      setWeeklySleep(weeklySleep); // Rollback on failure
    }
  };

  const getSleepBarStyle = (value: number | null) => {
    if (!value) return { height: "10px", colorClass: "bg-secondary-black" };
    if (value >= 8) return { height: "70px", colorClass: "bg-primary-blue" };
    if (value >= 4) return { height: "40px", colorClass: "bg-primary-blue" };
    if (value >= 1) return { height: "20px", colorClass: "bg-primary-blue" };
    return { height: "10px", colorClass: "bg-gray-500" };
  };

  if (loading || status === "loading") {
    return (
      <div className="bg-white border border-gray-200 dark:border-gray-800/50 dark:bg-bg-dark rounded-lg p-6 h-full w-full">
        <div className="animate-pulse">
          <div className="flex justify-between items-center mb-8">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
          </div>
          <div className="flex items-center justify-center mb-8">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="w-12 h-8 bg-gray-200 dark:bg-gray-700 rounded mx-4"></div>
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="flex flex-col mx-24 pb-5">
            <div className="h-20 flex justify-around items-end">
              {[...Array(7)].map((_, index) => (
                <div key={index} className="w-2 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
            <div className="flex justify-around items-center mt-2">
              {[...Array(7)].map((_, index) => (
                <div key={index} className="w-5 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
          <div className="flex justify-center">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full w-24"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) return <div>Please sign in to track your sleep</div>;

  return (
    <div className="p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col h-full">
    {/* Header Section */}
    <div className="flex justify-between items-center mb-4 flex-shrink-0">
      <h1 className="text-sm text-secondary-black dark:text-secondary-white opacity-40">SLEEP</h1>
    </div>
      <div className="">
        <div className="flex items-center justify-center">
          <button
            onClick={handleDecrement}
            className="text-primary-blue text-2xl font-bold bg-transparent border-none cursor-pointer"
          >
            -
          </button>
          <p className="text-secondary-black dark:text-secondary-white font-medium text-2xl mx-1.5 my-1">
            {sleepHours}
          </p>
          <button
            onClick={handleIncrement}
            className="text-primary-blue text-2xl font-bold bg-transparent border-none cursor-pointer"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex flex-col mx-24 pb-5">
        <div className="h-20 flex justify-around items-center">
          {weeklySleep.map((value, index) => {
            const { height, colorClass } = getSleepBarStyle(value);
            return (
              <div key={index} className="flex flex-col items-center">
                {value === 0 ? (
                  <div className={`h-2.5 w-2.5 rounded-full opacity-20 ${colorClass}`}></div>
                ) : (
                  <div
                    className={`w-2 rounded-lg ${colorClass}`}
                    style={{ height }}
                  ></div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-around items-center">
          {dayLabels.map((day, index) => (
            <span
              key={index}
              className="text-xs text-gray-500 dark:primary-black-dark w-5 text-center"
            >
              {day}
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          className="dark:bg-secondary-black bg-secondary-white  dark:text-secondary-white mx-2.5 px-6 py-2 rounded-full text-sm font-normal transition-colors duration-200"
          onClick={handleSave}
        >
          Log sleep
        </button>
      </div>
    </div>
  );
}
