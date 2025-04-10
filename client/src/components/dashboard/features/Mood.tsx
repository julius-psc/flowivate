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

const moodIcons = [
  { icon: IconMoodAngry, value: "angry", color: "bg-[#f12828]", hoverColor: "bg-[#f34747]", textColor: "text-[#f12828] dark:text-[#f85c5c]", label: "Angry" },
  { icon: IconMoodCry, value: "miserable", color: "bg-[#FF5151]", hoverColor: "bg-[#ff7070]", textColor: "text-[#FF5151] dark:text-[#ff7b7b]", label: "Miserable" },
  { icon: IconMoodSad, value: "sad", color: "bg-[#FF7449]", hoverColor: "bg-[#ff8d68]", textColor: "text-[#FF7449] dark:text-[#ff9a76]", label: "Sad" },
  { icon: IconMoodEmpty, value: "neutral", color: "bg-[#FF9B19]", hoverColor: "bg-[#ffac45]", textColor: "text-[#FF9B19] dark:text-[#ffbc5c]", label: "Neutral" },
  { icon: IconMoodTongueWink, value: "cheerful", color: "bg-[#75DB74]", hoverColor: "bg-[#8fe28e]", textColor: "text-[#75DB74] dark:text-[#9cea9c]", label: "Cheerful" },
  { icon: IconMoodHappy, value: "happy", color: "bg-[#46AE3A]", hoverColor: "bg-[#55c248]", textColor: "text-[#46AE3A] dark:text-[#6cd45e]", label: "Happy" },
  { icon: IconMoodSmileDizzy, value: "ecstatic", color: "bg-[#186922]", hoverColor: "bg-[#1f8a2c]", textColor: "text-[#186922] dark:text-[#2ea13a]", label: "Ecstatic" },
];

interface MoodEntry {
  mood: string;
  timestamp: Date;
}

const MoodInsights: React.FC<{ moodHistory: MoodEntry[]; onBack: () => void }> = ({ moodHistory, onBack }) => {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();

  const grid = Array(daysInMonth).fill(null).map((_, index) => {
    const day = index + 1;
    const moodEntry = moodHistory.find(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate.getDate() === day && entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
    });

    if (moodEntry) {
      return moodIcons.find(m => m.value === moodEntry.mood)?.color || "bg-gray-200";
    }
    return day < currentDay ? "bg-white border border-gray-200 opacity-50" : "bg-gray-300 border border-gray-200 opacity-50";
  });

  const positiveMoods = moodHistory.filter(entry => ["ecstatic", "happy"].includes(entry.mood)).length;
  const monthlyPercentage = moodHistory.length > 0 ? Math.round((positiveMoods / moodHistory.length) * 100) : 0;

  const weekHistory = moodHistory.slice(0, 7);
  const weeklyPositive = weekHistory.filter(entry => ["ecstatic", "happy"].includes(entry.mood)).length;
  const weeklyPercentage = weekHistory.length > 0 ? Math.round((weeklyPositive / weekHistory.length) * 100) : 0;

  const currentMonth = now.toLocaleString("default", { month: "long" });
  const currentYear = now.getFullYear();

  return (
    <div className="bg-white dark:bg-gray-800 text-primary-black dark:text-gray-200 border border-gray-100 dark:border-gray-800 rounded-lg w-full h-full p-4 flex flex-col">
      <div className="flex items-center mb-4">
        <button onClick={onBack} className="mr-2">
          <IconChevronLeft size={24} className="text-gray-800 dark:text-gray-200" />
        </button>
        <h2 className="text-lg font-semibold">My Mood Insights</h2>
      </div>
      <div className="mt-1">
        <span className="font-medium text-primary-black dark:text-gray-300 text-sm opacity-60">
          {`${currentMonth} ${currentYear}`}
        </span>
      </div>

      <div className="flex flex-1 mt-4">
        <div className="grid grid-cols-7 gap-x-4 gap-y-3 mr-4">
          {grid.map((color, index) => (
            <div key={index} className={`w-4 h-4 rounded-full ${color}`} />
          ))}
        </div>

        <div className="ml-4">
          <div className="text-3xl font-extrabold">{monthlyPercentage}%</div>
          <div className="text-sm mt-2">Monthly Positive Mood</div>
          <div className="text-sm mt-2">Weekly Positive: {weeklyPercentage}%</div>
        </div>
      </div>
    </div>
  );
};

const MoodPicker: React.FC = () => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hoveredMood, setHoveredMood] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();

  useEffect(() => {
    const fetchMoodHistory = async () => {
      if (status === "loading" || !session?.user?.email) return;

      try {
        const res = await fetch("/api/features/mood", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch mood history");
        const data = await res.json();
        setMoodHistory(data.map((entry: { mood: string; timestamp: string }) => ({ ...entry, timestamp: new Date(entry.timestamp) })));
      } catch (error) {
        console.error("Failed to fetch mood history:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMoodHistory();
  }, [session, status]);

  const handleMoodClick = (value: string) => {
    setIsAnimating(true);
    setSelectedMood(value);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handleLogMood = async () => {
    if (!selectedMood || !session?.user?.email) return;

    if (!moodIcons.some(m => m.value === selectedMood)) {
      console.error("Invalid mood value");
      return;
    }

    const now = new Date();
    const todayMood = moodHistory.find(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate.toDateString() === now.toDateString();
    });

    const newMoodEntry = { mood: selectedMood, timestamp: now };
    let updatedHistory = [...moodHistory];
    if (todayMood) {
      updatedHistory = updatedHistory.map(entry =>
        new Date(entry.timestamp).toDateString() === now.toDateString() ? newMoodEntry : entry
      );
    } else {
      updatedHistory.unshift(newMoodEntry);
    }
    setMoodHistory(updatedHistory);

    try {
      const res = await fetch("/api/features/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: selectedMood, timestamp: now }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to log mood");
      setSelectedMood(null);
    } catch (error) {
      console.error("Error logging mood:", error);
      setMoodHistory(moodHistory); // Rollback on failure
    }
  };

  const handleToggleInsights = () => {
    setShowInsights(!showInsights);
  };

  if (status === "loading") return <div>Loading session...</div>;
  if (!session) return <div>Please sign in to track your mood</div>;
  if (loading) return <div>Loading mood history...</div>;

  if (showInsights) {
    return <MoodInsights moodHistory={moodHistory} onBack={handleToggleInsights} />;
  }

  return (
    <div className="bg-white dark:bg-bg-dark rounded-lg p-6 w-full h-full border border-gray-200 dark:border-gray-800/50">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-lg font-normal text-gray-800 dark:text-gray-100">
          How do you feel today?
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={handleToggleInsights}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            View Insights
          </button>
          <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
            My mood
          </span>
        </div>
      </div>

      <div className="flex justify-between mb-10">
        {moodIcons.map((mood) => {
          const IconComponent = mood.icon;
          const isSelected = selectedMood === mood.value;
          const isHovered = hoveredMood === mood.value;

          return (
            <div
              key={mood.value}
              onClick={() => handleMoodClick(mood.value)}
              onMouseEnter={() => setHoveredMood(mood.value)}
              onMouseLeave={() => setHoveredMood(null)}
              className="flex flex-col items-center"
            >
              <div
                className={`
                  relative p-2 rounded-full transition-colors duration-200 cursor-pointer 
                  ${isSelected && isAnimating ? "animate-pulse" : ""}
                  ${isSelected ? mood.color : isHovered ? mood.hoverColor : "bg-gray-200 dark:bg-gray-700"}
                `}
              >
                <IconComponent
                  size={28}
                  className={`transition-colors duration-200 ${isSelected || isHovered ? "text-white" : "text-gray-500 dark:text-gray-400"}`}
                />
                {isSelected && isAnimating && (
                  <span
                    className="absolute inset-0 rounded-full animate-ping opacity-75"
                    style={{ backgroundColor: mood.textColor.replace("text-", "").split(" ")[0].replace("[", "").replace("]", "") }}
                  ></span>
                )}
              </div>
              <div className="h-5 mt-1 text-center">
                {isSelected && (
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    {mood.label}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center items-center gap-4">
        <button
          className={`
            px-6 py-2 rounded-full text-sm font-normal transition-colors duration-200
            ${selectedMood
              ? "bg-black cursor-pointer dark:bg-white text-white dark:text-black opacity-100"
              : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-80"}
          `}
          onClick={handleLogMood}
          disabled={!selectedMood}
        >
          Log mood
        </button>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Mood editable until midnight
        </span>
      </div>
    </div>
  );
};

export default MoodPicker;