"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function Sleep() {
  const [sleepHours, setSleepHours] = useState(8);
  const [weeklySleep, setWeeklySleep] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [loading, setLoading] = useState(false);
  const { data: session, status } = useSession();

  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];
  const currentDayIndex = (new Date().getDay() + 6) % 7; // Convert Sunday (0) to 6, Monday (1) to 0, etc.

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
        data.forEach((entry: { hours: number; timestamp: string }) => {
          const entryDate = new Date(entry.timestamp);
          const daysDiff = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 3600 * 24));
          if (daysDiff >= 0 && daysDiff < 7) {
            const position = (currentDayIndex - daysDiff + 7) % 7;
            sleepArray[position] = entry.hours;
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
  }, [session, status, currentDayIndex]);

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
    if (!value) return { height: "10px", colorClass: "bg-primary-black-dark" };
    if (value >= 8) return { height: "70px", colorClass: "bg-primary-blue" };
    if (value >= 4) return { height: "40px", colorClass: "bg-primary-blue" };
    if (value >= 1) return { height: "20px", colorClass: "bg-primary-blue" };
    return { height: "10px", colorClass: "bg-gray-500" };
  };

  if (status === "loading") return <div>Loading session...</div>;
  if (!session) return <div>Please sign in to track your sleep</div>;

  return (
    <div className="bg-white border border-gray-200 dark:border-gray-800/50 dark:bg-bg-dark rounded-lg p-6 h-full w-full">
      <div className="">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-lg font-normal text-gray-800 dark:text-gray-100">
            How much did you sleep?
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
              My sleep
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <button
            onClick={handleDecrement}
            className="text-primary-blue text-2xl font-bold bg-transparent border-none cursor-pointer"
          >
            -
          </button>
          <p className="text-primary-black dark:text-primary-white font-medium text-2xl mx-1.5 my-1">
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
          {loading ? (
            <p className="text-white">Loading sleep data...</p>
          ) : (
            weeklySleep.map((value, index) => {
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
            })
          )}
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
          className="dark:bg-primary-black-dark text-primary-black dark:text-primary-white mx-2.5 px-6 py-2 rounded-full text-sm font-normal transition-colors duration-200"
          onClick={handleSave}
        >
          Log sleep
        </button>
      </div>
    </div>
  );
}