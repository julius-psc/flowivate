"use client";

import React, { useState, useEffect } from "react";
import { IconChevronLeft } from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { specialSceneThemeNames } from "@/lib/themeConfig";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGlobalStore, type MoodEntry } from "@/hooks/useGlobalStore";

interface MoodOption {
  emoji: string;
  value: string;
  color: string;
  hoverColor: string;
  textColor: string;
  label: string;
}

const moodIcons: MoodOption[] = [
  {
    emoji: "😡",
    value: "angry",
    color: "bg-red-500",
    hoverColor: "bg-red-600",
    textColor: "text-red-500 dark:text-red-400",
    label: "Angry",
  },
  {
    emoji: "😭",
    value: "miserable",
    color: "bg-orange-600",
    hoverColor: "bg-orange-700",
    textColor: "text-orange-600 dark:text-orange-400",
    label: "Miserable",
  },
  {
    emoji: "😢",
    value: "sad",
    color: "bg-orange-400",
    hoverColor: "bg-orange-500",
    textColor: "text-orange-400 dark:text-orange-300",
    label: "Sad",
  },
  {
    emoji: "😐",
    value: "neutral",
    color: "bg-yellow-400",
    hoverColor: "bg-yellow-500",
    textColor: "text-yellow-600 dark:text-yellow-400",
    label: "Neutral",
  },
  {
    emoji: "🙂",
    value: "cheerful",
    color: "bg-lime-400",
    hoverColor: "bg-lime-500",
    textColor: "text-lime-600 dark:text-lime-400",
    label: "Cheerful",
  },
  {
    emoji: "😊",
    value: "happy",
    color: "bg-green-500",
    hoverColor: "bg-green-600",
    textColor: "text-green-600 dark:text-green-400",
    label: "Happy",
  },
  {
    emoji: "🤩",
    value: "ecstatic",
    color: "bg-emerald-500",
    hoverColor: "bg-emerald-600",
    textColor: "text-emerald-600 dark:text-emerald-400",
    label: "Ecstatic",
  },
];

// MoodEntry interface removed, imported from useGlobalStore

const MoodInsights: React.FC<{
  moodHistory: MoodEntry[];
  onBack: () => void;
  isSpecialTheme: boolean;
}> = ({ moodHistory, onBack, isSpecialTheme }) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const currentDay = now.getDate();

  const grid = Array(daysInMonth)
    .fill(null)
    .map((_, index) => {
      const day = index + 1;
      const entry = moodHistory.find((e) => {
        const entryDate = new Date(e.timestamp);
        return (
          entryDate.getDate() === day &&
          entryDate.getMonth() === currentMonth &&
          entryDate.getFullYear() === currentYear
        );
      });
      if (entry) {
        const moodData = moodIcons.find((m) => m.value === entry.mood);
        return {
          day,
          isLogged: true,
          color: moodData?.color || "bg-gray-300",
          emoji: moodData?.emoji || "😐",
        };
      }
      const isPast = day < currentDay;
      return {
        day,
        isLogged: false,
        emoji: null,
        baseClass: isPast
          ? "bg-gray-100 dark:bg-zinc-800/50"
          : "bg-gray-50 dark:bg-zinc-900/50 opacity-50",
      };
    });

  const positiveMoods = moodHistory.filter((entry) => {
    const entryDate = new Date(entry.timestamp);
    return (
      entryDate.getMonth() === currentMonth &&
      entryDate.getFullYear() === currentYear &&
      ["ecstatic", "happy", "cheerful"].includes(entry.mood)
    );
  }).length;
  const entriesThisMonth = moodHistory.filter((entry) => {
    const entryDate = new Date(entry.timestamp);
    return (
      entryDate.getMonth() === currentMonth &&
      entryDate.getFullYear() === currentYear
    );
  }).length;
  const monthlyPercentage =
    entriesThisMonth > 0
      ? Math.round((positiveMoods / entriesThisMonth) * 100)
      : 0;

  const currentMonthName = now.toLocaleString("default", { month: "long" });

  const subtleText = isSpecialTheme
    ? "text-white/50"
    : "text-gray-400 dark:text-gray-500";
  const mainText = isSpecialTheme
    ? "text-white"
    : "text-secondary-black dark:text-secondary-white";

  return (
    <div
      className={`p-5 backdrop-blur-md rounded-xl flex flex-col h-full ${isSpecialTheme
        ? "dark bg-zinc-900/50 border border-zinc-800/50"
        : "bg-white/80 dark:bg-zinc-900/80 border border-slate-200/50 dark:border-zinc-800/50"
        }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className={`p-1.5 rounded-lg transition-colors ${isSpecialTheme
              ? "hover:bg-white/10 text-white/70"
              : "hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400"
              }`}
          >
            <IconChevronLeft size={18} />
          </button>
          <span className={`text-sm font-medium ${mainText}`}>
            {`${currentMonthName} ${currentYear}`}
          </span>
        </div>
        <div className={`text-xs font-medium ${subtleText}`}>
          {entriesThisMonth}/{daysInMonth} logged
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-7 gap-2 mb-6">
          {grid.map((item, index) => (
            <div
              key={index}
              className={`aspect-square rounded-lg flex items-center justify-center text-sm transition-all cursor-default ${item.isLogged
                ? `${item.color} hover:scale-105`
                : item.baseClass
                }`}
              title={
                item.isLogged
                  ? `Day ${item.day}: ${item.emoji}`
                  : `Day ${item.day}: Not logged`
              }
            >
              {item.isLogged ? (
                <span className="text-base select-none">{item.emoji}</span>
              ) : (
                <span className={`text-xs font-medium ${subtleText}`}>
                  {item.day}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Monthly Stats */}
        <div
          className={`flex items-center justify-center gap-3 py-3 px-4 rounded-xl ${isSpecialTheme ? "bg-white/5" : "bg-gray-50 dark:bg-zinc-800/50"
            }`}
        >
          <div className={`text-4xl font-bold tracking-tight ${mainText}`}>
            {monthlyPercentage}%
          </div>
          <div className={`text-xs font-medium uppercase tracking-wide leading-tight ${subtleText}`}>
            Positive<br />this month
          </div>
        </div>
      </div>
    </div>
  );
};

const MoodPickerSkeleton: React.FC<{ isSpecialTheme: boolean }> = ({
  isSpecialTheme,
}) => {
  return (
    <div
      className={`p-4 backdrop-blur-md rounded-xl flex flex-col h-full ${isSpecialTheme
        ? "dark bg-zinc-900/50 border border-zinc-800/50"
        : "bg-white/80 dark:bg-zinc-900/80 border border-slate-200/50 dark:border-zinc-800/50"
        }`}
    >
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex-grow flex flex-col justify-center">
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {Array(7)
            .fill(null)
            .map((_, index) => (
              <Skeleton key={index} className="w-10 h-10 rounded-2xl" />
            ))}
        </div>
        <div className="flex justify-center items-center gap-4">
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

const MoodPicker: React.FC = () => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const { moodHistory, setMoodHistory } = useGlobalStore();
  const history = moodHistory || [];
  const [hoveredMood, setHoveredMood] = useState<string | null>(null);
  const [loading, setLoading] = useState(moodHistory === null);
  const [isMounted, setIsMounted] = useState(false);
  const { data: session, status } = useSession();
  const { theme } = useTheme();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isSpecialTheme =
    isMounted &&
    !!theme &&
    specialSceneThemeNames.includes(
      theme as (typeof specialSceneThemeNames)[number]
    );

  const todayStr = new Date().toDateString();
  const todayEntry = history.find(
    (e) => new Date(e.timestamp).toDateString() === todayStr
  );
  // Do NOT automatically select today's mood if it's already logged, just highlight it visually if possible,
  // OR pre-select it but allow changing. Pre-selection is usually good.
  const displayMood = selectedMood ?? todayEntry?.mood ?? null;

  useEffect(() => {
    const fetchMoodHistory = async () => {
      if (status === "loading" || !isMounted) {
        // Only show loading if we don't have history yet
        if (!moodHistory) setLoading(true);
        return;
      }
      if (status === "unauthenticated") {
        setLoading(false);
        setMoodHistory([]);
        return;
      }
      if (session?.user?.email) {
        // Only show loading if we don't have history yet
        if (!moodHistory) setLoading(true);
        try {
          const res = await fetch("/api/features/mood", {
            credentials: "include",
          });
          if (!res.ok) throw new Error("Failed to fetch mood history");
          const payload = await res.json();
          const arr = Array.isArray(payload) ? payload : [];
          setMoodHistory(
            arr.map((e: { mood: string; timestamp: string }) => ({
              mood: e.mood,
              timestamp: new Date(e.timestamp),
            }))
          );
        } catch (error: unknown) {
          console.error("Failed to fetch mood history:", error);
          toast.error(
            `Failed to load mood history: ${error instanceof Error ? error.message : "Unknown error"
            }`
          );
          setMoodHistory([]);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        setMoodHistory([]);
      }
    };
    fetchMoodHistory();
  }, [session, status, isMounted]);

  const handleMoodClick = (value: string) => {
    setSelectedMood(value);
  };

  const handleLogMood = async () => {
    if (!selectedMood) {
      toast.warning("Please select a mood first.");
      return;
    }
    if (!session?.user?.email) {
      toast.error("You must be signed in to log your mood.");
      return;
    }

    if (!moodIcons.some((m) => m.value === selectedMood)) {
      console.error("Invalid mood value selected:", selectedMood);
      toast.error("Invalid mood selected.");
      return;
    }

    const now = new Date();
    const todayMoodIndex = history.findIndex(
      (entry) => new Date(entry.timestamp).toDateString() === now.toDateString()
    );
    const newMoodEntry = { mood: selectedMood, timestamp: now };
    const previousHistory = [...history];
    const updatedHistory = [...history];

    if (todayMoodIndex > -1) updatedHistory[todayMoodIndex] = newMoodEntry;
    else updatedHistory.unshift(newMoodEntry);
    updatedHistory.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
    setMoodHistory(updatedHistory);

    try {
      const res = await fetch("/api/features/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood: selectedMood,
          timestamp: now.toISOString(),
        }),
        credentials: "include",
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        toast.error(errorData.message || `Failed to log mood (${res.status})`);
        setMoodHistory(previousHistory);
        return;
      }
      toast.success("Mood logged successfully!");
      setSelectedMood(null);
    } catch (error: unknown) {
      console.error("Error logging mood:", error);
      toast.error(
        `Error logging mood: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setMoodHistory(previousHistory);
    }
  };

  const handleToggleInsights = () => {
    setShowInsights(!showInsights);
  };

  const containerBaseClasses =
    "p-4 backdrop-blur-md rounded-xl flex flex-col h-full transition-opacity duration-300";
  const containerPreMountClasses =
    "bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/50 opacity-0";
  const containerPostMountClasses = isSpecialTheme
    ? "dark bg-zinc-900/50 border border-zinc-800/50 opacity-100"
    : "bg-white/80 dark:bg-zinc-900/80 border border-slate-200/50 dark:border-zinc-800/50 opacity-100";

  if (loading || !isMounted) {
    return <MoodPickerSkeleton isSpecialTheme={!!isSpecialTheme} />;
  }

  if (!session && isMounted) {
    return (
      <div
        className={`${containerBaseClasses} ${isMounted ? containerPostMountClasses : containerPreMountClasses
          } justify-center items-center`}
      >
        <p
          className={`text-center ${isSpecialTheme ? "text-white/70" : "text-gray-600 dark:text-gray-400"
            }`}
        >
          Please sign in to track your mood.
        </p>
      </div>
    );
  }

  if (showInsights) {
    return (
      <MoodInsights
        moodHistory={history}
        onBack={handleToggleInsights}
        isSpecialTheme={isSpecialTheme}
      />
    );
  }

  const viewInsightsButtonColor = isSpecialTheme
    ? "text-white/60 hover:text-white"
    : "text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-200";
  const logButtonInactiveBg = isSpecialTheme
    ? "bg-white/10 text-white/40"
    : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500";

  return (
    <div
      className={`${containerBaseClasses} ${isMounted ? containerPostMountClasses : containerPreMountClasses
        }`}
    >
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <h1
          className={`text-sm opacity-40 ${isSpecialTheme
            ? "text-white/70"
            : "text-secondary-black dark:text-secondary-white"
            }`}
        >
          MOOD
        </h1>
        <button
          onClick={handleToggleInsights}
          className={`text-xs font-medium transition-colors ${viewInsightsButtonColor}`}
        >
          Insights
        </button>
      </div>

      <div className="flex-grow flex flex-col justify-center">
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {moodIcons.map((mood) => {
            const isSelected = displayMood === mood.value;
            const isHovered = hoveredMood === mood.value;

            return (
              <div
                key={mood.value}
                onClick={() => handleMoodClick(mood.value)}
                onMouseEnter={() => setHoveredMood(mood.value)}
                onMouseLeave={() => setHoveredMood(null)}
                className="flex flex-col items-center justify-center cursor-pointer group"
              >
                <div
                  className={`
                    w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 ease-out
                    ${isSelected
                      ? `${mood.color} text-white scale-110 shadow-lg`
                      : isSpecialTheme
                        ? "bg-white/5 hover:bg-white/10 text-white/50"
                        : "bg-gray-50 dark:bg-zinc-800/80 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800"
                    }
                    ${!isSelected && isHovered ? "scale-105" : ""}
                  `}
                >
                  <span className={`text-2xl select-none ${isSelected || isHovered ? "opacity-100 scale-110" : "opacity-80 scale-100"} transition-transform duration-200`}>
                    {mood.emoji}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center items-center h-10">
          <button
            className={`
              px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ease-out
              ${selectedMood
                ? `${moodIcons.find((m) => m.value === selectedMood)?.color
                } text-white cursor-pointer hover:opacity-90 hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 select-none`
                : `${logButtonInactiveBg} cursor-not-allowed`
              }
            `}
            onClick={handleLogMood}
            disabled={!selectedMood || loading}
          >
            {selectedMood
              ? `Log ${moodIcons.find((m) => m.value === selectedMood)?.label}`
              : "Select a mood"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoodPicker;