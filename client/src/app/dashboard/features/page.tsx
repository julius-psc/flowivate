"use client";

import React, { useState } from "react";
import { useDashboard } from "../../../context/DashboardContext";
import { FeatureKey } from "../../../components/dashboard/features/featureMap";
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
  IconTarget,
  IconBulb,
  IconChartLine,
  IconDirections,
  IconViewfinder,
} from "@tabler/icons-react";

// Feature icon mapping
const featureIcons = {
  Tasks: <IconList size={20} />,
  Pomodoro: <IconClock size={20} />,
  Meditation: <IconBrain size={20} />,
  Water: <IconGlass size={20} />,
  Sleep: <IconZzz size={20} />,
  Mood: <IconMoodSmile size={20} />,
  DeepWork: <IconViewfinder size={20} />,
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
  const { addFeature, isFeatureSelected } = useDashboard();
  const [activeCategory, setActiveCategory] = useState("all");

  // Filter categories based on active selection
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
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 z-20">
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
          {featureCategories.map((category) => (
            <button
              key={category.name}
              onClick={() => setActiveCategory(category.name)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-1.5 ${
                activeCategory === category.name
                  ? "bg-primary text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-primary hover:text-white"
              }`}
            >
              {React.cloneElement(category.icon, { size: 14 })}
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Feature Grid */}
      <div className="max-w-4xl">
        {filteredCategories.map((category) => (
          <div key={category.name} className="mb-12">
            <div className="flex items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                {React.cloneElement(category.icon, {
                  className: "text-primary",
                })}
                {category.name}
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {category.features.map(({ key, description, benefit }) => {
                const isSelected = isFeatureSelected(key as FeatureKey);

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
                        className="mt-auto py-2 text-sm font-medium rounded-md transition-colors duration-200 flex items-center justify-center gap-2 bg-primary text-white hover:bg-primary-hover focus:ring-2 focus:ring-primary-ring dark:focus:ring-primary-ring focus:outline-none"
                      >
                        <IconPlus size={14} />
                        Add to Dashboard
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