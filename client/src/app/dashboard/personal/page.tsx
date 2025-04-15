"use client";

import React, { useState } from "react";
import { useDashboard } from "../../../context/DashboardContext";
import { FeatureKey } from "../../../components/dashboard/features/featureMap";
import {
  IconPlus,
  IconCheck,
  IconApps,
  IconActivity,
  IconHeartbeat,
  IconTree,
  IconTools,
  IconList,
  IconClock,
  IconMoodSmile,
  IconWaveSine,
  IconBrain,
  IconGlass,
  IconZzz,
  IconRobot,
  IconBook,
} from "@tabler/icons-react";

// Feature icon mapping
const featureIcons = {
  Tasks: <IconList size={20} />,
  Pomodoro: <IconClock size={20} />,
  Meditation: <IconBrain size={20} />,
  Water: <IconGlass size={20} />,
  Sleep: <IconZzz size={20} />,
  Mood: <IconMoodSmile size={20} />,
  Ambient: <IconWaveSine size={20} />,
  Assistant: <IconRobot size={20} />,
  Books: <IconBook size={20} />,
};

// Feature categories
const featureCategories = [
  {
    name: "Productivity",
    icon: <IconActivity size={20} />,
    features: [
      { key: "Tasks", description: "Organize and track daily tasks effortlessly." },
      { key: "Pomodoro", description: "Boost focus with timed work intervals." },
    ],
  },
  {
    name: "Wellness",
    icon: <IconHeartbeat size={20} />,
    features: [
      { key: "Meditation", description: "Mindfulness sessions for calm and clarity." },
      { key: "Water", description: "Monitor your daily hydration goals." },
      { key: "Sleep", description: "Track sleep patterns for better rest." },
      { key: "Mood", description: "Reflect on and analyze your emotions." },
    ],
  },
  {
    name: "Environment",
    icon: <IconTree size={20} />,
    features: [
      { key: "Ambient", description: "Create a calming workspace with sounds." },
    ],
  },
  {
    name: "Tools",
    icon: <IconTools size={20} />,
    features: [
      { key: "Assistant", description: "AI support for smarter task management." },
      { key: "Books", description: "Manage your reading list and progress." },
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
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8 ">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">
          Build Your Dashboard
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Choose features to personalize your experience.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors flex items-center gap-2 ${
              activeCategory === "all"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            <IconApps size={16} />
            All
          </button>
          {featureCategories.map((category) => (
            <button
              key={category.name}
              onClick={() => setActiveCategory(category.name)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors flex items-center gap-2 ${
                activeCategory === category.name
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {React.cloneElement(category.icon, { size: 16 })}
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Feature Grid */}
      <div className="max-w-7xl mx-auto">
        {filteredCategories.map((category) => (
          <div key={category.name} className="mb-12">
            <div className="flex items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                {React.cloneElement(category.icon, { className: "text-blue-500" })}
                {category.name}
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {category.features.map(({ key, description }) => {
                const isSelected = isFeatureSelected(key as FeatureKey);

                return (
                  <div
                    key={key}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl flex flex-col"
                  >
                    <div className="p-5 flex flex-col flex-grow">
                      <div className="text-blue-500 mb-4">
                        {featureIcons[key as keyof typeof featureIcons]}
                      </div>
                      <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {key}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex-grow">
                        {description}
                      </p>
                      <button
                        onClick={() => addFeature(key as FeatureKey)}
                        disabled={isSelected}
                        className={`w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                          isSelected
                            ? "bg-gray-100 dark:bg-gray-700 text-green-600 dark:text-green-500 border border-gray-200 dark:border-gray-600"
                            : "bg-blue-500 text-white hover:bg-blue-600"
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <IconCheck size={16} />
                            Added
                          </>
                        ) : (
                          <>
                            <IconPlus size={16} />
                            Add
                          </>
                        )}
                      </button>
                    </div>
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