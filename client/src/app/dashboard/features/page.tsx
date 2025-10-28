"use client";

import React, { useState, useEffect } from "react";
import { useDashboard } from "../../../context/DashboardContext";
import { FeatureKey } from "../../../components/dashboard/features/featureMap";
import { useTheme } from "next-themes";
import useSubscriptionStatus from "@/hooks/useSubscriptionStatus";
import { motion, AnimatePresence } from "framer-motion";
import { specialSceneThemeNames } from "@/lib/themeConfig"; // Import theme names

// Icons
import {
  IconList,
  IconClock,
  IconBrain,
  IconGlass,
  IconZzz,
  IconMoodSmile,
  IconWaveSine,
  IconRobot,
  IconBook,
  IconDirections,
  IconBulb,
  IconLock,
} from "@tabler/icons-react";

// Feature icon mapping
const featureIcons = {
  Tasks: <IconList className="text-gray-500 dark:text-gray-400" size={20} />,
  Pomodoro: <IconClock className="text-gray-500 dark:text-gray-400" size={20} />,
  Meditation: <IconBrain className="text-gray-500 dark:text-gray-400" size={20} />,
  Water: <IconGlass className="text-gray-500 dark:text-gray-400" size={20} />,
  Sleep: <IconZzz className="text-gray-500 dark:text-gray-400" size={20} />,
  Mood: <IconMoodSmile className="text-gray-500 dark:text-gray-400" size={20} />,
  DeepWork: <IconBulb className="text-gray-500 dark:text-gray-400" size={20} />,
  Ambient: <IconWaveSine className="text-gray-500 dark:text-gray-400" size={20} />,
  Assistant: <IconRobot className="text-gray-500 dark:text-gray-400" size={20} />,
  Books: <IconBook className="text-gray-500 dark:text-gray-400" size={20} />,
  Affirmations: <IconDirections className="text-gray-500 dark:text-gray-400" size={20} />,
};

// Flat list of all features (no categories)
const allFeatures = [
  {
    key: "Assistant",
    description: "AI-powered support for smarter work.",
    benefit: "Elevate efficiency",
    proOnly: true,
  },
  {
    key: "Tasks",
    description: "Seamlessly plan and track your tasks.",
    benefit: "Simplify your day",
    proOnly: false,
  },
  {
    key: "Pomodoro",
    description: "Sharpen focus with timed work sessions.",
    benefit: "Maximize output",
    proOnly: false,
  },
  {
    key: "DeepWork",
    description: "Immerse in distraction-free work.",
    benefit: "Achieve flow",
    proOnly: false,
  },
  {
    key: "Ambient",
    description: "Create a calming audio backdrop.",
    benefit: "Stay engaged",
    proOnly: false,
  },
  {
    key: "Meditation",
    description: "Practice guided sessions for clarity.",
    benefit: "Find peace",
    proOnly: false,
  },
  {
    key: "Affirmations",
    description: "Boost confidence with daily positivity.",
    benefit: "Feel empowered",
    proOnly: false,
  },
  {
    key: "Mood",
    description: "Reflect on emotions for self-insight.",
    benefit: "Grow awareness",
    proOnly: false,
  },
  {
    key: "Water",
    description: "Track hydration for better health.",
    benefit: "Stay energized",
    proOnly: false,
  },
  {
    key: "Sleep",
    description: "Enhance rest with sleep monitoring.",
    benefit: "Recharge fully",
    proOnly: false,
  },
  {
    key: "Books",
    description: "Organize reads for personal growth.",
    benefit: "Learn daily",
    proOnly: false,
  },
];

// Tooltip for locked features
const LockTooltip = ({ message }: { message: string }) => (
  // Adjusted tooltip style for better visibility
  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-10 bg-black/80 dark:bg-zinc-800 text-white dark:text-gray-100 text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
    {message}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-2 h-2 bg-black/80 dark:bg-zinc-800 transform rotate-45"></div>
  </div>
);

export default function Features() {
  const { addFeature, removeFeature, isFeatureSelected, selectedFeatures } =
    useDashboard();
  const { status: subscriptionStatus, loading } = useSubscriptionStatus();
  const { theme } = useTheme();
  const [isMounted, setIsMounted] = useState(false); // Add isMounted state
  const [hoveredLock, setHoveredLock] = useState<string | null>(null);

  // Effect runs only on the client after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Calculate isSpecialTheme *after* mount
  const isSpecialTheme =
    isMounted &&
    !!theme &&
    specialSceneThemeNames.includes(
      theme as (typeof specialSceneThemeNames)[number]
    );

  if (loading || !isMounted) { // Display loading until mounted and subscription status is known
    return (
      <div className="flex items-center justify-center min-h-screen">
        {/* Optional: Add a skeleton loader here */}
        <span className="text-gray-500 dark:text-gray-400">Loading features…</span>
      </div>
    );
  }

  // Define base classes
  const containerBaseClasses = "backdrop-blur-md rounded-xl p-4 sm:p-6 lg:p-8 transition-opacity duration-300";
  // Define pre-mount classes (using opacity-0 is simpler here)
  const containerPreMountClasses = "opacity-0";
  // Define post-mount classes based on theme
  const containerPostMountClasses = isSpecialTheme
    ? "dark bg-zinc-900/50 border border-zinc-800/50 opacity-100" // Frosted glass
    : "bg-white/80 dark:bg-zinc-900/80 border border-slate-200/50 dark:border-zinc-800/50 opacity-100"; // Standard transparent

  const handleToggle = (key: FeatureKey, enabled: boolean) => {
    if (enabled) {
      addFeature(key);
    } else {
      removeFeature(key);
    }
  };

  return (
    // Outer container for padding and max-width
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Themed container for the content */}
      <div
        className={`${containerBaseClasses} ${
          isMounted ? containerPostMountClasses : containerPreMountClasses
        }`}
      >
        {/* Removed Header - assuming it's part of layout */}

        {/* Flat feature list */}
        <div className="space-y-3">
          {allFeatures.map((feature) => {
            const isSelected = isFeatureSelected(feature.key as FeatureKey);
            const isProFeature = feature.proOnly;
            const isFreeUser = subscriptionStatus === "free";
            const hasReachedLimit =
              isFreeUser && selectedFeatures.length >= 4 && !isSelected;

            let isLocked = false;
            let lockReason = "";

            if (isProFeature && isFreeUser) {
              isLocked = true;
              lockReason = "Available on Pro plan";
            } else if (hasReachedLimit) {
              isLocked = true;
              lockReason = "Free plan limit reached (4 features)";
            }

            // Text color is now handled by the container's `dark` class
            const featureNameColor = "text-gray-900 dark:text-gray-100"; // Standard text color
            const featureDescriptionColor = "text-gray-500 dark:text-gray-400"; // Standard description color

            return (
              <div
                key={feature.key}
                // Use a slightly lighter border inside the frosted container
                className={`flex items-start justify-between py-4 border-b ${
                  isSpecialTheme
                    ? 'border-white/10'
                    : 'border-gray-100 dark:border-gray-800'
                } last:border-0`}
              >
                {/* Left: Icon + Name + Benefit + Description */}
                <div className="flex items-start gap-4">
                  <div className="pt-0.5 flex-shrink-0">
                    {/* Icons might need adjusted colors if they clash with dark frost */}
                    {React.cloneElement(
                      featureIcons[feature.key as keyof typeof featureIcons],
                      { className: isSpecialTheme ? "text-white/60" : "text-gray-500 dark:text-gray-400" } // Example: Adjust icon color for special themes
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`font-medium ${featureNameColor}`}>
                        {feature.key}
                      </span>
                      {isProFeature && (
                        <span className={` ${isSpecialTheme ? "text-white/50" : "text-gray-400 dark:text-gray-500"}`}>
                          <IconLock size={14} />
                        </span>
                      )}
                    </div>
                    <p className={`text-xs ${featureDescriptionColor} mt-0.5`}>
                      {feature.benefit}
                    </p>
                    <p className={`text-sm ${featureDescriptionColor} mt-1 max-w-prose`}>
                      {feature.description}
                    </p>
                  </div>
                </div>

                {/* Right: Toggle */}
                <div className="relative flex-shrink-0 ml-4 pt-0.5"> {/* Added pt-0.5 for alignment */}
                  {isLocked ? (
                    <div
                      className="relative"
                      onMouseEnter={() => setHoveredLock(feature.key)}
                      onMouseLeave={() => setHoveredLock(null)}
                    >
                      {/* Adjusted locked toggle appearance */}
                      <div className="w-12 h-6 bg-gray-200 dark:bg-zinc-700 rounded-full flex items-center px-1 cursor-not-allowed opacity-60">
                        <div className="w-4 h-4 bg-gray-400 dark:bg-zinc-500 rounded-full"></div>
                      </div>
                      <AnimatePresence>
                        {hoveredLock === feature.key && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }} // Animate from bottom
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute right-1/2 translate-x-1/2 top-full mt-1" // Centered below toggle
                          >
                            <LockTooltip message={lockReason} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        handleToggle(feature.key as FeatureKey, !isSelected)
                      }
                      aria-label={`${isSelected ? "Disable" : "Enable"} ${
                        feature.key
                      }`}
                      // Use theme-aware colors for toggle background
                      className={`relative inline-flex h-6 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        isSelected
                          ? "bg-primary"
                          : isSpecialTheme
                          ? "bg-white/20" // Lighter grey for dark frost
                          : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`${
                          isSelected ? "translate-x-6" : "translate-x-0"
                        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                      />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}