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

// --- Mood Icons Definition (Unchanged) ---
const moodIcons = [
  { icon: IconMoodAngry, value: "angry", color: "bg-[#f12828]", hoverColor: "bg-[#f34747]", textColor: "text-[#f12828] dark:text-[#f85c5c]", label: "Angry" },
  { icon: IconMoodCry, value: "miserable", color: "bg-[#FF5151]", hoverColor: "bg-[#ff7070]", textColor: "text-[#FF5151] dark:text-[#ff7b7b]", label: "Miserable" },
  { icon: IconMoodSad, value: "sad", color: "bg-[#FF7449]", hoverColor: "bg-[#ff8d68]", textColor: "text-[#FF7449] dark:text-[#ff9a76]", label: "Sad" },
  { icon: IconMoodEmpty, value: "neutral", color: "bg-[#FF9B19]", hoverColor: "bg-[#ffac45]", textColor: "text-[#FF9B19] dark:text-[#ffbc5c]", label: "Neutral" },
  { icon: IconMoodTongueWink, value: "cheerful", color: "bg-[#75DB74]", hoverColor: "bg-[#8fe28e]", textColor: "text-[#75DB74] dark:text-[#9cea9c]", label: "Cheerful" },
  { icon: IconMoodHappy, value: "happy", color: "bg-[#46AE3A]", hoverColor: "bg-[#55c248]", textColor: "text-[#46AE3A] dark:text-[#6cd45e]", label: "Happy" },
  { icon: IconMoodSmileDizzy, value: "ecstatic", color: "bg-[#186922]", hoverColor: "bg-[#1f8a2c]", textColor: "text-[#186922] dark:text-[#2ea13a]", label: "Ecstatic" },
];

// Interface for mood entries (Unchanged)
interface MoodEntry {
  mood: string;
  timestamp: Date;
}

// --- MoodInsights Component (Unchanged) ---
const MoodInsights: React.FC<{ moodHistory: MoodEntry[]; onBack: () => void }> = ({ moodHistory, onBack }) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const currentDay = now.getDate();

  // Generate the grid data for the calendar view
  const grid = Array(daysInMonth).fill(null).map((_, index) => {
    const day = index + 1;
    // Find if there's a mood entry for this specific day in the current month/year
    const moodEntry = moodHistory.find(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate.getDate() === day && entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
    });

    // If an entry exists, use its mood color and mark as logged
    if (moodEntry) {
      return {
        day,
        color: moodIcons.find(m => m.value === moodEntry.mood)?.color || "bg-gray-500", // Fallback color
        isLogged: true // Mark as logged
      };
    }

    // Determine if the day is in the past and wasn't logged
    const isPastUnlogged = day < currentDay;
    // Return data for unlogged days (past or future/current)
    return {
      day,
      // Different styling for past unlogged vs future/current unlogged days
      color: isPastUnlogged ? "bg-secondary-white opacity-20 dark:bg-zinc-700 dark:opacity-30" : "bg-gray-300 dark:bg-zinc-600 opacity-50",
      isLogged: false // Mark as not logged
    };
  });

  // Calculate monthly positivity index (happy or ecstatic moods)
  const positiveMoods = moodHistory.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear && ["ecstatic", "happy"].includes(entry.mood);
  }).length;
  const entriesThisMonth = moodHistory.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
  }).length;
  const monthlyPercentage = entriesThisMonth > 0 ? Math.round((positiveMoods / entriesThisMonth) * 100) : 0;


  // Calculate weekly positivity index (last 7 days)
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(now.getDate() - 7);
  const weekHistory = moodHistory.filter(entry => new Date(entry.timestamp) >= oneWeekAgo);
  const weeklyPositive = weekHistory.filter(entry => ["ecstatic", "happy"].includes(entry.mood)).length;
  const weeklyPercentage = weekHistory.length > 0 ? Math.round((weeklyPositive / weekHistory.length) * 100) : 0;

  // Get current month name and year
  const currentMonthName = now.toLocaleString("default", { month: "long" });

  return (
    <div className="p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col h-full">
      {/* Back Button */}
      <div className="flex items-center mb-4">
        <button onClick={onBack} className="mr-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors">
          <IconChevronLeft size={20} className="text-gray-800 dark:text-gray-200" />
        </button>
      </div>
      {/* Month and Year Display */}
      <div className="mt-1">
        <span className="font-medium text-primary-black dark:text-gray-300 text-sm opacity-60">
          {`${currentMonthName} ${currentYear}`}
        </span>
      </div>

      {/* Main Content: Calendar Grid and Stats */}
      <div className="flex flex-1 mt-4">
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-x-4 gap-y-3 mr-4">
          {grid.map((item, index) => (
            <div key={index} className={`w-6 h-6 rounded-full ${item.color} flex items-center justify-center`}>
              {/* Conditionally render day number: Show if future/current OR if it's a past logged day */}
              {(item.day >= currentDay || item.isLogged) && (
                <span className="text-xs font-medium text-black dark:text-white opacity-75">
                  {item.day}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Positivity Index Stats */}
        <div className="ml-2 text-secondary-black dark:text-secondary-white ">
          <div className="mb-4">
            <div className="text-3xl font-extrabold">{monthlyPercentage}%</div>
            <div className="text-sm opacity-40">Monthly positivity</div>
          </div>
          <div>
            <div className="text-xl font-extrabold">{weeklyPercentage}%</div>
            <div className="text-xs opacity-40">Weekly positivity</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- New Skeleton Loader Component ---
const MoodPickerSkeleton = () => {
  return (
    <div className="p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col h-full">
      {/* Header Skeleton (placeholders directly with pulse) */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0 animate-pulse">
        <div className="h-3 w-12 bg-gray-200 dark:bg-zinc-700 rounded"></div> {/* "MOOD" placeholder */}
        <div className="h-4 w-20 bg-gray-200 dark:bg-zinc-700 rounded"></div> {/* "View Insights" placeholder */}
      </div>

      {/* Pulsing Content Area */}
      <div className="animate-pulse flex-grow flex flex-col justify-between pt-2"> {/* Added pt-2 for spacing */}
        {/* Mood Grid Skeleton */}
        <div className="grid grid-cols-7 gap-2 mb-8">
          {Array(7).fill(null).map((_, index) => (
            <div key={index} className="flex justify-center">
              {/* Circular placeholder matching approx size */}
              <div className="w-10 h-10 bg-gray-200 dark:bg-zinc-700 rounded-full"></div>
            </div>
          ))}
        </div>

        {/* Footer Skeleton */}
        <div className="flex justify-center items-center gap-4 mt-auto mb-2"> {/* Pushes to bottom */}
          {/* Button placeholder */}
          <div className="h-9 w-24 bg-gray-300 dark:bg-zinc-600 rounded-full"></div>
          {/* Text placeholder */}
          <div className="h-3 w-32 bg-gray-200 dark:bg-zinc-700 rounded"></div>
        </div>
      </div>
    </div>
  );
};


// --- Main Mood Picker Component ---
const MoodPicker: React.FC = () => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [hoveredMood, setHoveredMood] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession(); // Unchanged call

  // Unchanged useEffect
  useEffect(() => {
    const fetchMoodHistory = async () => {
      // Don't fetch if loading session or no user email
      if (status === "loading") {
          setLoading(true); // Ensure loading state while session loads
          return;
      }
       if (!session?.user?.email) {
          setLoading(false); // Stop loading if session is loaded but no user
          setMoodHistory([]); // Clear history if logged out
          return;
      }


      setLoading(true); // Start loading indicator
      try {
        // Fetch mood data from API
        const res = await fetch("/api/features/mood", {
          credentials: "include", // Include cookies for authentication
        });
        if (!res.ok) throw new Error("Failed to fetch mood history");
        const data = await res.json();
        // Ensure data is an array and map timestamps
        if (Array.isArray(data)) {
            setMoodHistory(data.map((entry: { mood: string; timestamp: string }) => ({ ...entry, timestamp: new Date(entry.timestamp) })));
        } else {
            setMoodHistory([]); // Set empty array if data is not as expected
        }
      } catch (error) {
        console.error("Failed to fetch mood history:", error);
        setMoodHistory([]); // Clear history on error
        // Optionally: set an error state here
      } finally {
        setLoading(false); // Stop loading indicator
      }
    };
    fetchMoodHistory();
  }, [session, status]); // Unchanged dependencies

  // Unchanged handlers
  const handleMoodClick = (value: string) => {
    setSelectedMood(value); // Set the selected mood value
  };

  const handleLogMood = async () => {
    // Ensure a mood is selected and user is logged in
    if (!selectedMood || !session?.user?.email) return;

    // Validate selected mood against defined icons (safety check)
    if (!moodIcons.some(m => m.value === selectedMood)) {
      console.error("Invalid mood value selected:", selectedMood);
      return;
    }

    const now = new Date();
    // Check if a mood was already logged today
    const todayMoodIndex = moodHistory.findIndex(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate.toDateString() === now.toDateString();
    });

    const newMoodEntry = { mood: selectedMood, timestamp: now };
    const previousHistory = [...moodHistory];
    const updatedHistory = [...moodHistory]; 

    // Optimistic UI update: Update local state immediately
    if (todayMoodIndex > -1) {
      // If mood exists for today, replace it
      updatedHistory[todayMoodIndex] = newMoodEntry;
    } else {
      // Otherwise, add the new mood entry to the beginning
      updatedHistory.unshift(newMoodEntry);
      // Sort history by date descending after adding (optional but good practice)
      updatedHistory.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    setMoodHistory(updatedHistory); // Update state

    try {
      // Send the new mood entry to the API
      const res = await fetch("/api/features/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: selectedMood, timestamp: now.toISOString() }), // Send ISO string
        credentials: "include",
      });
      if (!res.ok) {
          // Try to parse error message from response
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to log mood (${res.status})`);
      }
      // If successful, clear the selected mood
      setSelectedMood(null);
    } catch (error) {
      console.error("Error logging mood:", error);
      // Rollback UI on failure: Restore previous history state
      setMoodHistory(previousHistory);
      // Optionally: show an error message to the user
    }
  };

  const handleToggleInsights = () => {
    setShowInsights(!showInsights);
  };

  // --- Skeleton Loader Rendering --- (Replaced content)
  if (loading || status === "loading") {
    return <MoodPickerSkeleton />;
  }

  // --- Authentication Check --- (Unchanged)
  if (!session) {
      return (
        <div className="p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col h-full justify-center items-center">
            <p className="text-center text-gray-600 dark:text-gray-400">Please sign in to track your mood.</p>
            {/* Optionally add a sign-in button here */}
        </div>
      );
  }


  // --- Insights View Rendering --- (Unchanged)
  if (showInsights) {
    return <MoodInsights moodHistory={moodHistory} onBack={handleToggleInsights} />;
  }

  // --- Mood Picker View Rendering --- (Unchanged)
  return (
    <div className="p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col h-full">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <h1 className="text-sm text-secondary-black dark:text-secondary-white opacity-40">MOOD</h1>
        {/* Button to toggle insights view */}
        <button
          onClick={handleToggleInsights}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          View Insights
        </button>
      </div>

      {/* Mood Icon Grid */}
      <div className="grid grid-cols-7 gap-2 mb-8">
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
              className="flex flex-col items-center justify-center" // Center icon within its grid cell
            >
              {/* Mood Icon Container */}
              <div
                className={`
                  p-2 rounded-full transition-transform duration-200 cursor-pointer
                  ${isSelected ? mood.color : "bg-gray-200 dark:bg-secondary-black"} {/* Apply mood color only if selected */}
                  ${isSelected || isHovered ? "transform scale-110" : ""} {/* Scale effect on hover or select */}
                `}
              >
                {/* Mood Icon */}
                <IconComponent
                  size={24}
                  className={`transition-colors duration-200 ${
                    isSelected ? "text-white" : // White text when selected (on colored background)
                    isHovered ? "text-gray-700 dark:text-gray-200" : // Darker/Lighter text on hover (on gray background)
                    "text-gray-500 dark:text-gray-400" // Default text color
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Log Mood Button and Info Text */}
      <div className="flex justify-center items-center gap-4 mt-auto"> {/* Pushes to bottom */}
        <button
          className={`
            px-6 py-2 rounded-full text-sm font-normal transition-all duration-200 ease-in-out
            ${selectedMood
              ? `${moodIcons.find(m => m.value === selectedMood)?.color} text-white cursor-pointer hover:opacity-90 transform active:scale-95` // Use mood color for button, add interactions
              : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-80"}
          `}
          onClick={handleLogMood}
          disabled={!selectedMood || loading} // Disable button if no mood is selected or loading
        >
          Log mood
        </button>
        {/* Informational text */}
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Mood editable until midnight
        </span>
      </div>
    </div>
  );
};

export default MoodPicker;