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
  IconBook
} from "@tabler/icons-react";

// Feature icon mapping
const featureIcons = {
  Tasks: <IconList size={24} />,
  Pomodoro: <IconClock size={24} />,
  Meditation: <IconBrain size={24} />,
  Water: <IconGlass size={24} />,
  Sleep: <IconZzz size={24} />,
  Mood: <IconMoodSmile size={24} />,
  Ambient: <IconWaveSine size={24} />,
  Assistant: <IconRobot size={24} />,
  Books: <IconBook size={24} />
};

// Define feature categories with icons and descriptions
const featureCategories = [
  {
    name: "Productivity",
    icon: <IconActivity size={24} />,
    features: [
      { key: "Tasks", description: "Track and organize your daily tasks with ease" },
      { key: "Pomodoro", description: "Stay focused with timed work sessions" }
    ]
  },
  {
    name: "Wellness",
    icon: <IconHeartbeat size={24} />,
    features: [
      { key: "Meditation", description: "Guided sessions for mindfulness and relaxation" },
      { key: "Water", description: "Track your daily water intake" },
      { key: "Sleep", description: "Monitor your sleep patterns and quality" },
      { key: "Mood", description: "Log and analyze your emotional wellbeing" }
    ]
  },
  {
    name: "Environment",
    icon: <IconTree size={24} />,
    features: [
      { key: "Ambient", description: "Customize your workspace with ambient sounds" }
    ]
  },
  {
    name: "Tools",
    icon: <IconTools size={24} />,
    features: [
      { key: "Assistant", description: "AI-powered help for your daily tasks" },
      { key: "Books", description: "Keep track of your reading list and progress" }
    ]
  }
];

export default function Personal() {
  const { addFeature, isFeatureSelected } = useDashboard();
  const [activeCategory, setActiveCategory] = useState("all");

  // Filter features based on selected category
  const filteredCategories = activeCategory === "all"
    ? featureCategories
    : featureCategories.filter(category => category.name === activeCategory);

  return (
    <div className="min-h-screen p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Customize Your Dashboard
        </h2>

        {/* Category filter tabs */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mt-4 md:mt-0">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeCategory === "all"
                ? "bg-white dark:bg-gray-700"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            <IconApps size={16} className="inline mr-1" /> All
          </button>
          {featureCategories.map(category => (
            <button
              key={category.name}
              onClick={() => setActiveCategory(category.name)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeCategory === category.name
                  ? "bg-white dark:bg-gray-700"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {React.cloneElement(category.icon, { size: 16, className: "inline mr-1" })}
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Render features by category */}
      {filteredCategories.map((category) => (
        <div key={category.name} className="mb-12">
          <div className="flex items-center mb-6">
            {React.cloneElement(category.icon, { className: "mr-2 text-primary-blue dark:text-primary-blue" })}
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              {category.name}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {category.features.map(({ key, description }) => {
              const isSelected = isFeatureSelected(key as FeatureKey);

              return (
                <div
                  key={key}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex flex-col"
                >
                  <div className="p-5">
                    <div className="text-primary-blue dark:text-primary-blue mb-3">
                      {featureIcons[key as keyof typeof featureIcons]}
                    </div>

                    <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      {key}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                      {description}
                    </p>

                    <button
                      onClick={() => addFeature(key as FeatureKey)}
                      disabled={isSelected}
                      className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md border transition-colors ${
                        isSelected
                          ? "bg-gray-50 dark:bg-gray-900 text-primary-green dark:text-primary-green border-gray-200 dark:border-gray-700"
                          : "bg-primary-blue dark:bg-primary-blue-600 text-white border-primary-blue dark:border-primary-blue-600 hover:bg-primary-blue-600 dark:hover:bg-primary-blue-700"
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <IconCheck size={16} /> Added to Dashboard
                        </>
                      ) : (
                        <>
                          <IconPlus size={16} /> Add to Dashboard
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
  );
}