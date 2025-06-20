"use client";

import React, { useState, useEffect } from "react";
import { useDashboard } from "../../../context/DashboardContext";
import { FeatureKey } from "../../../components/dashboard/features/featureMap";
import { useTheme } from "next-themes";
import useSubscriptionStatus from "@/hooks/useSubscriptionStatus";

import {
  IconPlus,
  IconCheck,
  IconApps,
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
  IconTarget,
  IconBulb,
  IconChartLine,
} from "@tabler/icons-react";

// Feature icon mapping
const featureIcons = {
  Tasks: <IconList size={20} />,
  Pomodoro: <IconClock size={20} />,
  Meditation: <IconBrain size={20} />,
  Water: <IconGlass size={20} />,
  Sleep: <IconZzz size={20} />,
  Mood: <IconMoodSmile size={20} />,
  DeepWork: <IconBulb size={20} />,
  Ambient: <IconWaveSine size={20} />,
  Assistant: <IconRobot size={20} />,
  Books: <IconBook size={20} />,
  Affirmations: <IconDirections size={20} />,
};

const featureCategories = [
  {
    name: "AI Companion",
    icon: <IconBulb size={20} />,
    features: [
      {
        key: "Assistant",
        description: "AI-powered support for smarter work.",
        benefit: "Elevate efficiency",
      },
    ],
  },
  {
    name: "Task Mastery",
    icon: <IconTarget size={20} />,
    features: [
      {
        key: "Tasks",
        description: "Seamlessly plan and track your tasks.",
        benefit: "Simplify your day",
      },
    ],
  },
  {
    name: "Focus",
    icon: <IconBulb size={20} />,
    features: [
      {
        key: "Pomodoro",
        description: "Sharpen focus with timed work sessions.",
        benefit: "Maximize output",
      },
      {
        key: "DeepWork",
        description: "Immerse in distraction-free work.",
        benefit: "Achieve flow",
      },
      {
        key: "Ambient",
        description: "Create a calming audio backdrop.",
        benefit: "Stay engaged",
      },
    ],
  },
  {
    name: "Balance",
    icon: <IconBrain size={20} />,
    features: [
      {
        key: "Meditation",
        description: "Practice guided sessions for clarity.",
        benefit: "Find peace",
      },
      {
        key: "Affirmations",
        description: "Boost confidence with daily positivity.",
        benefit: "Feel empowered",
      },
      {
        key: "Mood",
        description: "Reflect on emotions for self-insight.",
        benefit: "Grow awareness",
      },
    ],
  },
  {
    name: "Wellness",
    icon: <IconChartLine size={20} />,
    features: [
      {
        key: "Water",
        description: "Track hydration for better health.",
        benefit: "Stay energized",
      },
      {
        key: "Sleep",
        description: "Enhance rest with sleep monitoring.",
        benefit: "Recharge fully",
      },
      {
        key: "Books",
        description: "Organize reads for personal growth.",
        benefit: "Learn daily",
      },
    ],
  },
];

export default function Features() {
  const { addFeature, isFeatureSelected, selectedFeatures } = useDashboard();
  const { status: subscriptionStatus, loading } = useSubscriptionStatus();
  const [activeCategory, setActiveCategory] = useState("all");
  const { theme } = useTheme();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // While subscription status is loading, disable all add buttons
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-gray-500">Loading features…</span>
      </div>
    );
  }

  const headingColor = !mounted
    ? "text-transparent"
    : theme === "jungle" || theme === "ocean"
    ? "text-white"
    : "text-gray-900 dark:text-gray-100";

  const categoryColor = !mounted
    ? "text-transparent"
    : theme === "jungle" || theme === "ocean"
    ? "text-white"
    : "text-gray-900 dark:text-gray-100";

  // Filter categories by activeCategory tab
  const filteredCategories =
    activeCategory === "all"
      ? featureCategories
      : featureCategories.filter(
          (category) => category.name === activeCategory
        );

  return (
    <div className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-4xl mb-12">
        <h2 className={`text-3xl font-bold z-20 ${headingColor}`}>
          Your Productivity Hub
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-lg">
          Pick features to tailor your dashboard to your workflow.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="max-w-4xl mb-10">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-1.5 ${
              activeCategory === "all"
                ? "bg-primary text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-primary hover:text-white"
            }`}
          >
            <IconApps size={14} />
            All
          </button>
          {featureCategories.map((category) => {
            const isActive = activeCategory === category.name;
            const baseClasses =
              "px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-1.5";
            const activeClass = "bg-primary text-white";
            const inactiveClass = !mounted
              ? "text-transparent"
              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-primary hover:text-white";

            return (
              <button
                key={category.name}
                onClick={() => setActiveCategory(category.name)}
                className={`${baseClasses} ${
                  isActive ? activeClass : inactiveClass
                }`}
              >
                {React.cloneElement(category.icon, { size: 14 })}
                {category.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feature Grid */}
      <div className="max-w-4xl">
        {filteredCategories.map((category) => (
          <div key={category.name} className="mb-12">
            <div className="flex items-center mb-6">
              <h3
                className={`text-lg font-semibold flex items-center gap-2 ${categoryColor}`}
              >
                {React.cloneElement(category.icon, {
                  className: "text-primary",
                })}
                {category.name}
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {category.features.map(({ key, description, benefit }) => {
                const isSelected = isFeatureSelected(key as FeatureKey);

                // “Assistant” is the AI feature that should always be locked for free users
                const isProFeature = key === "Assistant";

                // If free user has 4 already, they cannot add any more (unless this one is already selected)
                const cannotAddBecauseOfLimit =
                  subscriptionStatus === "free" &&
                  selectedFeatures.length >= 4 &&
                  !isSelected;

                // If free user, always lock AI feature
                const lockedForFree = isProFeature && subscriptionStatus === "free";

                const isLocked = lockedForFree || cannotAddBecauseOfLimit;

                // Decide button label
                let buttonLabel = "Add to Dashboard";
                if (lockedForFree) {
                  buttonLabel = "Pro Only";
                } else if (cannotAddBecauseOfLimit) {
                  buttonLabel = "Limit reached";
                }

                return (
                  <div
                    key={key}
                    className="p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col h-full"
                  >
                    {/* Icon and Title */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 dark:bg-primary/20 rounded-md text-primary">
                          {featureIcons[key as keyof typeof featureIcons]}
                        </div>
                        <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                          {key}
                        </h4>
                      </div>
                      {isSelected && (
                        <span className="text-xs font-medium text-third-green dark:text-third-green/80 bg-third-green/10 dark:bg-third-green/20 px-2 py-1 rounded-md flex items-center shrink-0">
                          <IconCheck size={12} className="mr-1" />
                          Active
                        </span>
                      )}
                    </div>

                    {/* Benefit Tag */}
                    <div className="mb-3">
                      <span className="inline-block px-2 py-1 text-xs font-medium text-primary dark:text-primary/80 bg-primary/20 dark:bg-primary/20 rounded-md">
                        {benefit}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 grow">
                      {description}
                    </p>

                    {/* Action Button */}
                    {!isSelected && (
                      <button
                        onClick={() => addFeature(key as FeatureKey)}
                        disabled={isLocked}
                        className={`mt-auto py-2 text-sm font-medium rounded-md transition-colors duration-200 flex items-center justify-center gap-2 ${
                          isLocked
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-primary text-white hover:bg-primary-hover focus:ring-2 focus:ring-primary-ring dark:focus:ring-primary-ring focus:outline-none"
                        }`}
                      >
                        {!isLocked && <IconPlus size={14} />}
                        {buttonLabel}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
