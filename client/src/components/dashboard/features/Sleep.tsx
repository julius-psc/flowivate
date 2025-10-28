"use client";

import { useState, useEffect } from "react";
import React from "react";
import { toast } from "sonner";
import { Plus, Minus } from "lucide-react";
import { useTheme } from "next-themes";
import { specialSceneThemeNames } from "@/lib/themeConfig";

const SleepSkeleton: React.FC<{ isSpecialTheme: boolean }> = ({
  isSpecialTheme,
}) => {
  const placeholderBarHeights = [
    "h-2.5",
    "h-10",
    "h-5",
    "h-16",
    "h-10",
    "h-2.5",
    "h-5",
  ];
  return (
    <div
      className={`p-4 backdrop-blur-md rounded-xl flex flex-col h-full animate-pulse ${
        isSpecialTheme
          ? "dark bg-zinc-900/50 border border-zinc-800/50"
          : "bg-white/80 dark:bg-zinc-900/80 border border-slate-200/50 dark:border-zinc-800/50"
      }`}
    >
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div className="h-3 w-12 bg-gray-200 dark:bg-zinc-700 rounded"></div>
      </div>
      <div className="flex items-center justify-center mb-4">
        <div className="w-8 h-8 bg-gray-300 dark:bg-zinc-600 rounded-lg"></div>
        <div className="h-8 w-12 bg-gray-200 dark:bg-zinc-700 rounded mx-3"></div>
        <div className="w-8 h-8 bg-gray-300 dark:bg-zinc-600 rounded-lg"></div>
      </div>
      <div className="flex flex-col mx-auto w-full max-w-xs mb-5 px-4">
        <div className="h-24 flex justify-around items-end mb-1">
          {placeholderBarHeights.map((heightClass, index) => (
            <div key={index} className="flex flex-col items-center">
              {heightClass === "h-2.5" ? (
                <div
                  className={`h-2.5 w-2.5 bg-gray-300 dark:bg-zinc-600 rounded-full opacity-50`}
                ></div>
              ) : (
                <div
                  className={`w-2 ${heightClass} bg-gray-300 dark:bg-zinc-600 rounded-lg`}
                ></div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-around items-center">
          {[...Array(7)].map((_, index) => (
            <div
              key={index}
              className="h-3 w-5 bg-gray-200 dark:bg-zinc-700 rounded"
            ></div>
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
  const [isSaving, setIsSaving] = useState(false);
  const [session, setSession] = useState<{ user: { email: string } } | null>(
    null
  );
  const [status, setStatus] = useState("loading");

  const { theme } = useTheme();
  const isSpecialTheme =
    !!theme &&
    specialSceneThemeNames.includes(
      theme as (typeof specialSceneThemeNames)[number]
    );

  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];
  const currentDayIndex = (new Date().getDay() + 6) % 7;
  const [selectedDayIndex, setSelectedDayIndex] = useState(currentDayIndex);

  useEffect(() => {
    // Simulate session loading
    const timer = setTimeout(() => {
      setSession({ user: { email: "user@example.com" } });
      setStatus("authenticated");
    }, 500);
    return () => clearTimeout(timer);
  }, []);

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
        const res = await fetch("/api/features/sleep", {
          credentials: "include",
        });
        if (!res.ok)
          throw new Error(
            "Server responded with an error while fetching sleep data"
          );

        const responseData = await res.json();
        const recordsToProcess = responseData.sleepRecords;

        const sleepArray = Array(7).fill(0);
        const now = new Date();
        const currentWeek = getWeekNumber(now);
        const currentYear = now.getFullYear();

        if (Array.isArray(recordsToProcess)) {
          recordsToProcess.forEach(
            (entry: { hours: number; timestamp: string }) => {
              try {
                const entryDate = new Date(entry.timestamp);
                if (isNaN(entryDate.getTime())) {
                  console.warn("Invalid timestamp for entry:", entry);
                  return;
                }
                const entryWeek = getWeekNumber(entryDate);
                const entryYear = entryDate.getFullYear();
                if (entryWeek === currentWeek && entryYear === currentYear) {
                  const dayIndex = (entryDate.getDay() + 6) % 7;
                  const hours = Number(entry.hours);
                  if (!isNaN(hours) && hours >= 0 && hours <= 24) {
                    sleepArray[dayIndex] = hours;
                  } else {
                    console.warn("Invalid hours for entry:", entry);
                  }
                }
              } catch (e) {
                console.error("Error processing sleep entry", e, entry);
              }
            }
          );
        } else {
          console.warn(
            "Expected 'sleepRecords' to be an array in API response, but received:",
            responseData
          );
        }
        setWeeklySleep(sleepArray);

        const todayIndex = (new Date().getDay() + 6) % 7;
        setSelectedDayIndex(todayIndex);
        setSleepHours(sleepArray[todayIndex] > 0 ? sleepArray[todayIndex] : 8);
      } catch (error) {
        console.error("Failed to fetch sleep data:", error);
        toast.error(
          `Failed to load sleep data: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSleepData();
  }, [session, status]);

  const handleDaySelect = (index: number) => {
    setSelectedDayIndex(index);
    setSleepHours(weeklySleep[index] > 0 ? weeklySleep[index] : 8);
  };

  const handleIncrement = () => {
    if (sleepHours < 12) setSleepHours(sleepHours + 1);
  };

  const handleDecrement = () => {
    if (sleepHours > 0) setSleepHours(sleepHours - 1);
  };

  const handleSave = async () => {
    if (!session?.user?.email) {
      toast.error("Please sign in to log sleep.");
      return;
    }

    setIsSaving(true);
    const originalSleepValue = weeklySleep[selectedDayIndex];
    const newWeeklySleep = [...weeklySleep];
    newWeeklySleep[selectedDayIndex] = sleepHours;
    setWeeklySleep(newWeeklySleep);

    try {
      const today = new Date();
      const dayOffset = selectedDayIndex - currentDayIndex;
      const selectedDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + dayOffset
      );

      const res = await fetch("/api/features/sleep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours: sleepHours, timestamp: selectedDate }),
        credentials: "include",
      });
      if (!res.ok) {
        toast.error(`Failed to save sleep data (${res.status}).`);
        throw new Error(`Server responded with status ${res.status}`);
      }
      toast.success("Sleep logged successfully!");
    } catch (error) {
      console.error("Error saving sleep:", error);
      if (
        !(error instanceof Error && error.message.startsWith("Server responded"))
      ) {
        toast.error(
          `Error saving sleep: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
      const rollbackSleep = [...weeklySleep];
      rollbackSleep[selectedDayIndex] = originalSleepValue;
      setWeeklySleep(rollbackSleep);
    } finally {
      setIsSaving(false);
    }
  };

  const getBarHeight = (hours: number) => {
    const maxHeight = 12;
    const chartHeight = 96; // h-24

    if (hours <= 0) {
      return "0px";
    }
    const calculatedHeight = (hours / maxHeight) * chartHeight;
    return `${Math.min(calculatedHeight, chartHeight)}px`;
  };

  if (loading || status === "loading") {
    return <SleepSkeleton isSpecialTheme={isSpecialTheme} />;
  }

  if (!session)
    return (
      <div
        className={`p-4 backdrop-blur-md rounded-xl flex flex-col h-full justify-center items-center ${
          isSpecialTheme
            ? "dark bg-zinc-900/50 border border-zinc-800/50"
            : "bg-white/80 dark:bg-zinc-900/80 border border-slate-200/50 dark:border-zinc-800/50"
        }`}
      >
        <p className="text-center text-gray-600 dark:text-gray-400">
          Please sign in to track your sleep.
        </p>
      </div>
    );

  const isValueUnchanged = weeklySleep[selectedDayIndex] === sleepHours;

  return (
    <div
      className={`p-4 backdrop-blur-md rounded-xl flex flex-col h-full ${
        isSpecialTheme
          ? "dark bg-zinc-900/50 border border-zinc-800/50"
          : "bg-white/80 dark:bg-zinc-900/80 border border-slate-200/50 dark:border-zinc-800/50"
      }`}
    >
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h1 className="text-sm text-secondary-black dark:text-secondary-white opacity-40">
          SLEEP
        </h1>
      </div>
      <div className="">
        <div className="flex items-center justify-center">
          <button
            onClick={handleDecrement}
            className="text-primary text-lg font-bold bg-slate-100 dark:bg-zinc-800/70 rounded-lg h-8 w-8 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-zinc-800 transition"
          >
            <Minus size={16} />
          </button>
          <p className="text-secondary-black dark:text-secondary-white font-medium text-2xl mx-3 my-1 w-10 text-center">
            {sleepHours}
          </p>
          <button
            onClick={handleIncrement}
            className="text-primary text-lg font-bold bg-slate-100 dark:bg-zinc-800/70 rounded-lg h-8 w-8 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-zinc-800 transition"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-col mx-auto w-full max-w-xs mb-5 px-4 mt-4">
        <div className="h-24 flex justify-around items-end mb-1">
          {weeklySleep.map((value, index) => {
            const height = getBarHeight(value);
            const isSelected = index === selectedDayIndex;
            const isDot = value <= 0;

            return (
              <div
                key={index}
                className="flex flex-col items-center cursor-pointer group"
                onClick={() => handleDaySelect(index)}
              >
                <div
                  className={`transition-all duration-300 ease-in-out ${
                    isSelected
                      ? "bg-primary"
                      : "bg-primary/30 dark:bg-primary/50 group-hover:bg-primary/50 dark:group-hover:bg-primary/70"
                  } ${
                    isDot
                      ? "w-2.5 rounded-full"
                      : "w-2 rounded-lg"
                  }`}
                  style={{ height: isDot ? "0.625rem" : height }}
                ></div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-around items-center">
          {dayLabels.map((day, index) => (
            <span
              key={index}
              className={`text-xs w-5 text-center transition-colors ${
                index === selectedDayIndex
                  ? "text-primary font-bold"
                  : "text-gray-500 dark:text-zinc-400"
              }`}
            >
              {day}
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-center mt-auto flex-shrink-0">
        <button
          className="bg-primary text-secondary-white dark:bg-primary dark:text-secondary-white mx-2.5 px-6 py-2 rounded-full text-sm font-normal transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSave}
          disabled={!session || loading || isSaving || isValueUnchanged}
        >
          {isSaving ? "Logging..." : "Log Sleep"}
        </button>
      </div>
    </div>
  );
}