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
  IconViewfinder
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

// Feature categories
const featureCategories = [
  {
    name: "Task Management",
    icon: <IconTarget size={20} />,
    features: [
      {
        key: "Tasks",
        description: "Plan and track tasks with ease.",
        benefit: "Streamline your workflow",
      },
      {
        key: "Assistant",
        description: "AI-powered task optimization.",
        benefit: "Work smarter",
      },
    ],
  },
  {
    name: "Focus & Flow",
    icon: <IconBulb size={20} />,
    features: [
      {
        key: "DeepWork",
        description: "Dedicate your time fruitfully.",
        benefit: "Improve efficiency",
      },
      {
        key: "Pomodoro",
        description: "Enhance focus with timed sessions.",
        benefit: "Maximize productivity",
      },
      {
        key: "Ambient",
        description: "Curate a productive soundscape.",
        benefit: "Stay immersed",
      },
    ],
  },
  {
    name: "Health & Wellness",
    icon: <IconBrain size={20} />,
    features: [
      {
        key: "Meditation",
        description: "Guided sessions for mental clarity.",
        benefit: "Find calm",
      },
      {
        key: "Affirmations",
        description: "Attract what you deserve.",
        benefit: "Be positive",
      },
      {
        key: "Water",
        description: "Stay hydrated with goal tracking.",
        benefit: "Feel energized",
      },
      {
        key: "Sleep",
        description: "Monitor and improve sleep quality.",
        benefit: "Rest deeply",
      },
    ],
  },
  {
    name: "Insights & Growth",
    icon: <IconChartLine size={20} />,
    features: [
      {
        key: "Mood",
        description: "Track and reflect on your emotions.",
        benefit: "Understand yourself",
      },
      {
        key: "Books",
        description: "Organize your reading and insights.",
        benefit: "Grow daily",
      },
    ],
  },
];

export default function Personal() {
  const { addFeature, isFeatureSelected } = useDashboard();
  const [activeCategory, setActiveCategory] = useState("all");

  // Filter categories based on active selection
  const filteredCategories = activeCategory === "all"
    ? featureCategories
    : featureCategories.filter((category) => category.name === activeCategory);

  return (
    <div className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-4xl mb-12">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
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
                ? "bg-primary-blue text-white" // Updated color
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-primary-blue hover:text-white" // Updated color
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
                  ? "bg-primary-blue text-white" // Updated color
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-primary-blue hover:text-white" // Updated color
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
                {/* Updated color for category icon */}
                {React.cloneElement(category.icon, { className: "text-primary-blue" })}
                {category.name}
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Use 'tips' variable from map to satisfy linting/compiler, but don't render it */}
              {category.features.map(({ key, description, benefit }) => {
                const isSelected = isFeatureSelected(key as FeatureKey);

                return (
                  // Outer div card styling updated as requested
                  <div
                    key={key}
                    className="p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col h-full"
                  >
                    {/* Icon and Title */}
                    <div className="flex justify-between items-start mb-3"> {/* Changed items-center to items-start */}
                      <div className="flex items-center gap-3">
                        {/* Updated colors for icon container */}
                        <div className="p-2 bg-primary-bluelight dark:bg-primary-blue/30 rounded-md text-primary-blue">
                          {featureIcons[key as keyof typeof featureIcons]}
                        </div>
                        <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                          {key}
                        </h4>
                      </div>
                      {isSelected && (
                         // Active tag styling - Kept green for visual distinction
                        <span className="text-xs font-medium text-third-green dark:text-third-green/80 bg-third-green/10 dark:bg-third-green/20 px-2 py-1 rounded-md flex items-center shrink-0">
                          <IconCheck size={12} className="mr-1" />
                          Active
                        </span>
                      )}
                    </div>

                    {/* Benefit Tag */}
                    <div className="mb-3">
                      {/* Updated colors for benefit tag */}
                      <span className="inline-block px-2 py-1 text-xs font-medium text-primary-blue dark:text-primary-bluelight bg-primary-bluelight/50 dark:bg-primary-blue/30 rounded-md">
                        {benefit}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 grow"> {/* Added grow and mb-4 */}
                      {description}
                    </p>

                    {/* Pro Tip Section REMOVED */}
                    {/* <div className="mb-4 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md border-l-2 border-blue-400 dark:border-blue-500">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-medium text-blue-600 dark:text-blue-400">Pro tip:</span> {tips}
                      </p>
                    </div> */}

                    {/* Action Button */}
                    <button
                      onClick={() => addFeature(key as FeatureKey)}
                      disabled={isSelected}
                      className={`mt-auto py-2 text-sm font-medium rounded-md transition-colors duration-200 flex items-center justify-center gap-2 ${
                        isSelected
                          ? "bg-accent-grey/30 dark:bg-zinc-800 text-accent-grey-hover dark:text-zinc-500 cursor-not-allowed" // Updated disabled state colors
                          : "bg-primary-blue text-white hover:bg-primary-blue-hover focus:ring-2 focus:ring-primary-blue-ring dark:focus:ring-primary-blue-ring focus:outline-none" // Updated active state colors
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <IconCheck size={14} />
                          Added
                        </>
                      ) : (
                        <>
                          <IconPlus size={14} />
                          Add to Dashboard
                        </>
                      )}
                    </button>
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