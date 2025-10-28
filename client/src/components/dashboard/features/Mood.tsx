"use client";

import React, { useState, useEffect } from "react";
import {
  IconMoodSmileDizzy,
  IconMoodCry,
  IconMoodHappy,
  IconMoodTongueWink,
  IconMoodSad,
  IconMoodEmpty,
  IconMoodAngry,
  IconChevronLeft,
} from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { specialSceneThemeNames } from "@/lib/themeConfig";

const moodIcons = [
  {
    icon: IconMoodAngry,
    value: "angry",
    color: "bg-[#f12828]",
    hoverColor: "bg-[#f34747]",
    textColor: "text-[#f12828] dark:text-[#f85c5c]",
    label: "Angry",
  },
  {
    icon: IconMoodCry,
    value: "miserable",
    color: "bg-[#FF5151]",
    hoverColor: "bg-[#ff7070]",
    textColor: "text-[#FF5151] dark:text-[#ff7b7b]",
    label: "Miserable",
  },
  {
    icon: IconMoodSad,
    value: "sad",
    color: "bg-[#FF7449]",
    hoverColor: "bg-[#ff8d68]",
    textColor: "text-[#FF7449] dark:text-[#ff9a76]",
    label: "Sad",
  },
  {
    icon: IconMoodEmpty,
    value: "neutral",
    color: "bg-[#FF9B19]",
    hoverColor: "bg-[#ffac45]",
    textColor: "text-[#FF9B19] dark:text-[#ffbc5c]",
    label: "Neutral",
  },
  {
    icon: IconMoodTongueWink,
    value: "cheerful",
    color: "bg-[#75DB74]",
    hoverColor: "bg-[#8fe28e]",
    textColor: "text-[#75DB74] dark:text-[#9cea9c]",
    label: "Cheerful",
  },
  {
    icon: IconMoodHappy,
    value: "happy",
    color: "bg-[#46AE3A]",
    hoverColor: "bg-[#55c248]",
    textColor: "text-[#46AE3A] dark:text-[#6cd45e]",
    label: "Happy",
  },
  {
    icon: IconMoodSmileDizzy,
    value: "ecstatic",
    color: "bg-[#22C55E]",
    hoverColor: "bg-[#1FAD55]",
    textColor: "text-[#22C55E] dark:text-[#34D399]",
    label: "Ecstatic",
  },
];

interface MoodEntry {
  mood: string;
  timestamp: Date;
}

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
        return {
          day,
          isLogged: true,
          color:
            moodIcons.find((m) => m.value === entry.mood)?.color ||
            "bg-gray-200",
        };
      }
      const isPast = day < currentDay;
      return {
        day,
        isLogged: false,
        baseClass: isPast
          ? "border border-gray-300 dark:border-zinc-700 bg-transparent"
          : "border border-gray-200 dark:border-zinc-800 bg-transparent opacity-50",
      };
    });

  const positiveMoods = moodHistory.filter((entry) => {
    const entryDate = new Date(entry.timestamp);
    return (
      entryDate.getMonth() === currentMonth &&
      entryDate.getFullYear() === currentYear &&
      ["ecstatic", "happy"].includes(entry.mood)
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

  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(now.getDate() - 7);
  const weekHistory: MoodEntry[] = moodHistory.filter(
    (entry: MoodEntry) => new Date(entry.timestamp) >= oneWeekAgo
  );
  const weeklyPositive = weekHistory.filter((entry) =>
    ["ecstatic", "happy"].includes(entry.mood)
  ).length;
  const weeklyPercentage =
    weekHistory.length > 0
      ? Math.round((weeklyPositive / weekHistory.length) * 100)
      : 0;

  const currentMonthName = now.toLocaleString("default", { month: "long" });


  const insightsSubtleTextColor = isSpecialTheme ? "text-white/60" : "text-primary-black dark:text-gray-300 opacity-60";
  const insightsPercentageColor = isSpecialTheme ? "text-white" : "text-secondary-black dark:text-secondary-white";


  return (
    <div
      className={`p-4 backdrop-blur-md rounded-xl flex flex-col h-full ${
        isSpecialTheme
          ? "dark bg-zinc-900/50 border border-zinc-800/50"
          : "bg-white/80 dark:bg-zinc-900/80 border border-slate-200/50 dark:border-zinc-800/50"
      }`}
    >
      <div className="flex items-center mb-4">
        <button
          onClick={onBack}
          className={`mr-2 p-1 rounded-full transition-colors ${ isSpecialTheme ? 'hover:bg-white/10' : 'hover:bg-gray-200 dark:hover:bg-zinc-700'}`}
        >
          <IconChevronLeft
            size={20}
            className={ isSpecialTheme ? 'text-white/80' : 'text-gray-800 dark:text-gray-200'}
          />
        </button>
      </div>
      <div className="mt-1">
        <span className={`font-medium text-sm ${insightsSubtleTextColor}`}>
          {`${currentMonthName} ${currentYear}`}
        </span>
      </div>
      <div className="flex flex-1 mt-4">
        <div className="grid grid-cols-7 gap-2 mr-6">
          {grid.map((item, index) => (
            <div
              key={index}
              className={`w-5 h-5 rounded flex items-center justify-center text-[10px] ${
                item.isLogged ? item.color : item.baseClass
              }`}
              title={item.isLogged ? `Day ${item.day}: Logged` : `Day ${item.day}: Not logged`}
            >
              {(!item.isLogged || isSpecialTheme) && (
                 <span className={`font-medium ${isSpecialTheme ? 'text-white opacity-90' : 'text-black dark:text-white opacity-75'}`}>
                   {item.day}
                 </span>
              )}
            </div>
          ))}
        </div>
        <div className={insightsPercentageColor}>
          <div className="mb-4">
            <div className="text-3xl font-extrabold">{monthlyPercentage}%</div>
            <div className="text-sm opacity-60">Monthly positivity</div>
          </div>
          <div>
            <div className="text-xl font-extrabold">{weeklyPercentage}%</div>
            <div className="text-xs opacity-60">Weekly positivity</div>
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
      className={`p-4 backdrop-blur-md rounded-xl flex flex-col h-full animate-pulse ${
        isSpecialTheme
          ? "dark bg-zinc-900/50 border border-zinc-800/50"
          : "bg-white/80 dark:bg-zinc-900/80 border border-slate-200/50 dark:border-zinc-800/50"
      }`}
    >
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div className="h-3 w-12 bg-gray-200 dark:bg-zinc-700 rounded"></div>
        <div className="h-4 w-20 bg-gray-200 dark:bg-zinc-700 rounded"></div>
      </div>
      <div className="flex-grow flex flex-col justify-center">
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          {Array(7)
            .fill(null)
            .map((_, index) => (
              <div key={index} className="flex justify-center">
                <div className="w-10 h-10 bg-gray-200 dark:bg-zinc-700 rounded-full"></div>
              </div>
            ))}
        </div>
        <div className="flex justify-center items-center gap-4">
          <div className="h-9 w-28 bg-gray-300 dark:bg-zinc-600 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
};

const MoodPicker: React.FC = () => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [hoveredMood, setHoveredMood] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false); // Add isMounted state
  const { data: session, status } = useSession();
  const { theme } = useTheme();

  useEffect(() => {
    setIsMounted(true); // Set mounted on client
  }, []);

  // Calculate theme *after* mount and ensure boolean type
  const isSpecialTheme =
    isMounted && // Check if mounted
    !!theme && // Ensure theme is defined
    specialSceneThemeNames.includes(
      theme as (typeof specialSceneThemeNames)[number]
    );

  const todayStr = new Date().toDateString();
  const todayEntry = moodHistory.find(
    (e) => new Date(e.timestamp).toDateString() === todayStr
  );
  const displayMood = selectedMood ?? todayEntry?.mood ?? null;

  useEffect(() => {
    const fetchMoodHistory = async () => {
      if (status === "loading" || !isMounted) {
         setLoading(true);
         return;
      }
      if (status === "unauthenticated") {
        setLoading(false);
        setMoodHistory([]);
        return;
      }
      if (session?.user?.email) {
          setLoading(true);
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
              `Failed to load mood history: ${
                error instanceof Error ? error.message : "Unknown error"
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
    const todayMoodIndex = moodHistory.findIndex(
      (entry) => new Date(entry.timestamp).toDateString() === now.toDateString()
    );
    const newMoodEntry = { mood: selectedMood, timestamp: now };
    const previousHistory = [...moodHistory];
    const updatedHistory = [...moodHistory];

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
        `Error logging mood: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setMoodHistory(previousHistory);
    }
  };

  const handleToggleInsights = () => {
    setShowInsights(!showInsights);
  };

  const containerBaseClasses = "p-4 backdrop-blur-md rounded-xl flex flex-col h-full transition-opacity duration-300";
  const containerPreMountClasses = "bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/50 opacity-0";
  const containerPostMountClasses = isSpecialTheme
    ? "dark bg-zinc-900/50 border border-zinc-800/50 opacity-100"
    : "bg-white/80 dark:bg-zinc-900/80 border border-slate-200/50 dark:border-zinc-800/50 opacity-100";


  if (loading || !isMounted) {
     // Pass the boolean value correctly
    return <MoodPickerSkeleton isSpecialTheme={!!isSpecialTheme} />;
  }

  if (!session && isMounted) {
    return (
      <div
        className={`${containerBaseClasses} ${
            isMounted ? containerPostMountClasses : containerPreMountClasses
        } justify-center items-center`}
      >
        <p className={`text-center ${isSpecialTheme ? 'text-white/70': 'text-gray-600 dark:text-gray-400'}`}>
          Please sign in to track your mood.
        </p>
      </div>
    );
  }

  if (showInsights) {
    return (
      <MoodInsights
        moodHistory={moodHistory}
        onBack={handleToggleInsights}
        isSpecialTheme={isSpecialTheme} // Pass the calculated boolean
      />
    );
  }

  const moodIconBg = isSpecialTheme ? 'dark:bg-white/5' : 'bg-gray-200 dark:bg-secondary-black';
  const moodIconText = isSpecialTheme ? 'text-white/50' : 'text-gray-500 dark:text-gray-400';
  const moodIconHoverText = isSpecialTheme ? 'text-white/90' : 'text-gray-700 dark:text-gray-200';
  const viewInsightsButtonColor = isSpecialTheme ? 'text-white/60 hover:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200';
  const logButtonInactiveBg = isSpecialTheme ? 'bg-white/10 text-white/40' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500';


  return (
    <div
      className={`${containerBaseClasses} ${
          isMounted ? containerPostMountClasses : containerPreMountClasses
      }`}
    >
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <h1 className={`text-sm opacity-40 ${isSpecialTheme ? 'text-white/70' : 'text-secondary-black dark:text-secondary-white'}`}>
          MOOD
        </h1>
        <button
          onClick={handleToggleInsights}
          className={`text-sm transition-colors ${viewInsightsButtonColor}`}
        >
          View Insights
        </button>
      </div>

      <div className="flex-grow flex flex-col justify-center">
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          {moodIcons.map((mood) => {
            const IconComponent = mood.icon;
            const isSelected = displayMood === mood.value;
            const isHovered = hoveredMood === mood.value;

            return (
              <div
                key={mood.value}
                onClick={() => handleMoodClick(mood.value)}
                onMouseEnter={() => setHoveredMood(mood.value)}
                onMouseLeave={() => setHoveredMood(null)}
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <div
                  className={`
                    p-2 rounded-full transition-transform duration-200
                    ${isSelected ? mood.color : moodIconBg}
                    ${isSelected || isHovered ? "transform scale-110 shadow-md" : "shadow-sm"}
                  `}
                >
                  <IconComponent
                    size={24}
                    className={`transition-colors duration-200 ${
                      isSelected
                        ? "text-white"
                        : isHovered
                        ? moodIconHoverText
                        : moodIconText
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center items-center">
          <button
            className={`
              px-5 py-2 rounded-lg text-sm font-normal transition-all duration-200 ease-in-out
              ${
                selectedMood
                  ? `${
                      moodIcons.find((m) => m.value === selectedMood)?.color
                    } text-white cursor-pointer hover:opacity-90 transform active:scale-95 shadow-md`
                  : `${logButtonInactiveBg} cursor-not-allowed opacity-80`
              }
            `}
            onClick={handleLogMood}
            disabled={!selectedMood || loading } 
          >
            {selectedMood
              ? `Log ${moodIcons.find((m) => m.value === selectedMood)?.label}`
              : "Log mood"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoodPicker;