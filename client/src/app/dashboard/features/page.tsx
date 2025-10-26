"use client";

import React, { useState, useEffect } from "react";
import { useDashboard } from "../../../context/DashboardContext";
import { FeatureKey } from "../../../components/dashboard/features/featureMap";
import { useTheme } from "next-themes";
import useSubscriptionStatus from "@/hooks/useSubscriptionStatus";
import { motion, AnimatePresence } from "framer-motion";

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
  <div className="absolute left-0 top-full mt-1 z-10 bg-gray-900 text-white text-xs px-2 py-1 rounded-md shadow-lg whitespace-nowrap">
    {message}
    <div className="absolute top-0 left-3 w-2 h-2 bg-gray-900 transform rotate-45 -translate-y-1"></div>
  </div>
);

export default function Features() {
  const { addFeature, removeFeature, isFeatureSelected, selectedFeatures } = useDashboard();
  const { status: subscriptionStatus, loading } = useSubscriptionStatus();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [hoveredLock, setHoveredLock] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="text-gray-500">Loading features…</span>
      </div>
    );
  }

  const textColor = mounted
    ? theme === "jungle" || theme === "ocean"
      ? "text-white"
      : "text-gray-900 dark:text-gray-100"
    : "text-transparent";

  const handleToggle = (key: FeatureKey, enabled: boolean) => {
    if (enabled) {
      addFeature(key);
    } else {
      removeFeature(key);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Header — left aligned */}
      <div className="mb-8">
        <h1 className={`text-2xl font-bold ${textColor}`}>Your Productivity Hub</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Toggle features to customize your dashboard.
        </p>
      </div>

      {/* Flat feature list — all left-aligned */}
      <div className="space-y-3">
        {allFeatures.map((feature) => {
          const isSelected = isFeatureSelected(feature.key as FeatureKey);
          const isProFeature = feature.proOnly;
          const isFreeUser = subscriptionStatus === "free";
          const hasReachedLimit = isFreeUser && selectedFeatures.length >= 4 && !isSelected;

          let isLocked = false;
          let lockReason = "";

          if (isProFeature && isFreeUser) {
            isLocked = true;
            lockReason = "Available on Pro plan";
          } else if (hasReachedLimit) {
            isLocked = true;
            lockReason = "Free plan limit reached (4 features)";
          }

          return (
            <div
              key={feature.key}
              className="flex items-start justify-between py-4 border-b border-gray-100 dark:border-gray-800 last:border-0"
            >
              {/* Left: Icon + Name + Benefit + Description (all left-aligned) */}
              <div className="flex items-start gap-4">
                <div className="pt-0.5 flex-shrink-0">
                  {featureIcons[feature.key as keyof typeof featureIcons]}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`font-medium ${textColor}`}>{feature.key}</span>
                    {isProFeature && (
                      <span className="text-gray-400 dark:text-gray-500">
                        <IconLock size={14} />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {feature.benefit}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-prose">
                    {feature.description}
                  </p>
                </div>
              </div>

              {/* Right: Toggle (stays on the right, as per macOS pattern) */}
              <div className="relative flex-shrink-0 ml-4">
                {isLocked ? (
                  <div
                    className="relative"
                    onMouseEnter={() => setHoveredLock(feature.key)}
                    onMouseLeave={() => setHoveredLock(null)}
                  >
                    <div className="w-12 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center px-1 cursor-not-allowed">
                      <div className="w-4 h-4 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                    </div>
                    <AnimatePresence>
                      {hoveredLock === feature.key && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute right-0 top-full mt-2"
                        >
                          <LockTooltip message={lockReason} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <button
                    onClick={() => handleToggle(feature.key as FeatureKey, !isSelected)}
                    aria-label={`${isSelected ? "Disable" : "Enable"} ${feature.key}`}
                    className={`relative inline-flex h-6 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                      isSelected
                        ? "bg-primary"
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
  );
}